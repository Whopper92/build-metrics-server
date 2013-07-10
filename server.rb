require 'yaml'
require 'sinatra/base'
require 'data_mapper'
require 'dm-postgres-adapter'
require 'dm-aggregates'
require 'fileutils'
require 'json'

class MetricServer < Sinatra::Base
  attr_accessor :metrics, :avg, :error, :builds, :last_sat, :next_sat, :title

  #  =============================  METHODS  =============================== #
  # Determine if a configuration file is present and return its location if it does
  def self.config_file
    ["/etc/metrics/db.conf", "#{File.dirname(__FILE__)}/conf/db.conf"].each do |config|
      return config if File.exists?(config)
    end
    nil
  end

  # Returns timestamps for both last Saturday and next Saturady, allowing for easy
  # weekly stats
  def get_saturdays
    today = Time.now
    @next_sat = today.dup
    while not @next_sat.saturday?
      @next_sat += 86400
    end
    @next_sat = Time.mktime(@next_sat.year, @next_sat.month, @next_sat.day) + 86399
    @last_sat = today.dup
    while not @last_sat.saturday?
      @last_sat -= 86400
    end
    @last_sat = Time.mktime(@last_sat.year, @last_sat.month, @last_sat.day)
  end

  # Yields to the provided block if a configuration file is present, or throws
  # an error if it is not
  def render_page(*args, &block)
    if @@configured == true
      yield block
    else
      puts "(Temporary error): no configuration file present, and no DB could be reached"
    end
  end

  config = YAML.load_file(config_file) if config_file

  if config
    @@configured = true
    DataMapper::Logger.new($stdout, :debug)
    config_string = "postgres://#{config['username']}:#{config['password']}@#{config['hostname']}#{config.has_key?('port') ? ":#{config['port']}" : ""}/#{config['database']}"
    DataMapper.setup(:default, config_string)
    require "#{File.dirname(__FILE__)}/models/metric"
  else
    @@configured = false
  end

  #  ============================= VARIABLES =============================== #
    @@allPackageNames   = Metric.all(:fields => [:package_name], :unique => true, :order => [:package_name.asc])
    @@allDists          = Metric.all(:fields => [:dist], :unique => true, :order => [:dist.asc])

  #  =============================  ROUTES  =============================== #
  get '/' do
    redirect to('/overview')
  end

  get '/overview' do
    @title = "Packaging Overview"
    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :jenkins_build_time.not => nil)

    @trends = Hash.new
    @stats[:latest].each do |package|
      @trends["#{package[:package_name]}-#{package[:dist]}"] = Metric.all(:fields => [:jenkins_build_time],
                                                      :order        => [:date.desc],
                                                      :package_name => package[:package_name],
                                                      :dist         => package[:dist])
    end

    @totalNumBuilds = Hash.new
    @totalNumBuilds[:deb] = Hash[:type => 'deb', :num => 0, :avgSpd => 0]
    @totalNumBuilds[:rpm] = Hash[:type => 'rpm', :num => 0, :avgSpd => 0]
    @totalNumBuilds[:gem] = Hash[:type => 'gem', :num => 0, :avgSpd => 0]
    @totalNumBuilds[:dmg] = Hash[:type => 'dmg', :num => 0, :avgSpd => 0]
    @numDebDists = 0
    @numRpmDists = 0

    @@allDists.each do |dist|
      puts dist[:dist]
      case dist[:dist]
        when /lucid|oneiric|precise|quantal|raring|sid|squeeze|stable|testing|unstable|wheezy/
          @totalNumBuilds[:deb][:num] += Metric.count(:dist => dist[:dist])
          @totalNumBuilds[:deb][:avgSpd] += Metric.avg(:jenkins_build_time, :conditions => [ 'dist = ?', dist[:dist]])
          @numDebDists += 1
        when /el5|el6|fedora17|fedora18/
          @totalNumBuilds[:rpm][:num] += Metric.count(:dist => dist[:dist])
          @totalNumBuilds[:rpm][:avgSpd] += Metric.avg(:jenkins_build_time, :conditions => [ 'dist = ?', dist[:dist]])
          @numRpmDists += 1
        when /gem/
          @totalNumBuilds[:gem][:num] += Metric.count(:dist => dist[:dist])
          @totalNumBuilds[:gem][:avgSpd] += Metric.avg(:jenkins_build_time, :conditions => [ 'dist = ?', dist[:dist]])
        when /apple/
          @totalNumBuilds[:dmg][:num] += Metric.count(:dist => dist[:dist])
          @totalNumBuilds[:dmg][:avgSpd] += Metric.avg(:jenkins_build_time, :conditions => [ 'dist = ?', dist[:dist]])
      end
    end

    @totalNumBuilds[:deb][:avgSpd] = @totalNumBuilds[:deb][:avgSpd] / @numDebDists
    @totalNumBuilds[:rpm][:avgSpd] = @totalNumBuilds[:rpm][:avgSpd] / @numRpmDists

    erb :overview
  end

  get '/package/:package' do
    @title = "Overview of #{params[:package]}"

    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 7,
                        :jenkins_build_time.not => nil,
                        :package_name => params[:package])
    @trends = Hash.new
    @trends[params[:package]] = Metric.all(:fields       => [:jenkins_build_time],
                                           :order        => [:date.desc],
                                           :package_name => params[:package])
    erb :package
  end

  # Listener for incoming metrics. Stores the data in the metrics database
  # Expects a hash with the following keys:
  post '/overview/metrics' do
    # Format some paramters and download the Jenkins build log for storage
    puts params.inspect
    params[:date]       = Time.now.to_s
    params[:success] = case params[:success]
        when /SUCCESS/ then true
        when /true/    then true
        else false
    end
    params[:build_log] = `wget -q #{params[:build_log]} -O -` if params[:jenkins_build_time] != nil
    params[:package_build_time] = nil if params[:package_build_time] == "N/A"
    render_page do
      begin
        Metric.create( params )
        200
      rescue Exception => e
        puts "something went wrong\n\n\n"
        [418, "#{e.message} AND #{params.inspect}"]
      end
    end
  end

  not_found do
    status 404
    erb :notfound
  end

  # Start the server if this file is executed directly
  run! if app_file == $0
end
