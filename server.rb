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
  # Determine if a configuration file is present and return its location if it is
  def self.config_file
    ["/etc/metrics/db.conf", "#{File.dirname(__FILE__)}/conf/db.conf"].each do |config|
      return config if File.exists?(config)
    end
    nil
  end

  # Yields to the provided block if a configuration file is present, or throws an error if it is not
  def render_page(*args, &block)
    if @@configured == true
      yield block
    else
      puts "No configuration file present, and no DB could be reached"
    end
  end

  config = YAML.load_file(config_file) if config_file

  # Load
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
    @@allHosts          = Metric.all(:fields => [:build_loc], :unique => true, :order => [:build_loc.asc])
    @@allUsers          = Metric.all(:fields => [:build_user], :unique => true, :order => [:build_user.asc])
    @@allPackageTypes   = ['deb', 'rpm', 'gem', 'dmg']

  #  =============================  ROUTES  =============================== #
  get '/' do
    redirect to('/overview')
  end

  get '/overview' do
    @title = "Packaging Overview"

    # First, get all data about the latest 6 builds
    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :jenkins_build_time.not => nil)

    # Next, for each recent build find all build times for the appropriate dist to formulate a trend
    @trends = Hash.new
    @stats[:latest].each do |package|
      @trends["#{package[:package_name]}-#{package[:dist]}"] = Metric.all(:fields => [:jenkins_build_time],
                                                      :order                  => [:date.desc],
                                                      :package_name           => package[:package_name],
                                                      :dist                   => package[:dist],
                                                      :jenkins_build_time.not => nil)
    end

    # Gather high level metrics. Some of this data is fabricated until real data can be aquired
    # These arrays are used to create a time series of number of builds by various teams
    @totalBuildsTimeSeries   = [100, 120, 80, 90, 100, 140 ,70, 60, 80, 70, 80, 80]
    @failedBuildsTimeSeries  = [12, 23, 6, 12, 12, 13 ,15, 7, 9, 12, 8, 5]
    @releaseBuildsTimeSeries = [50, 60, 40, 45, 50, 70 ,45, 30, 40, 50, 30, 40, 30]
    @jenkinsBuildsTimeSeries = [20, 20, 20, 15, 30, 30 ,25, 10, 10, 15, 20, 10, 20]
    @devBuildsTimeSeries     = [30, 40, 20, 30, 20, 40 ,20, 20, 10, 15, 20, 30, 30]
    @buildSeries             = [@totalBuildsTimeSeries, @failedBuildsTimeSeries, @devBuildsTimeSeries, @releaseBuildsTimeSeries, @jenkinsBuildsTimeSeries]

    # Collect data on shipped RC and final packages
    @stats[:shipped]         = Hash.new
    @stats[:shipped][:final] = Hash[:key => 'Final', :count => 4]
    @stats[:shipped][:rc]    = Hash[:key => 'RC', :count => 7]

    # Gather the number of times each package has been built and find the top 3
    @pkgNumBuilds = Hash.new
    @@allPackageNames.each do |pkg|
     @pkgNumBuilds[:"#{pkg.package_name}"] = Metric.count(:conditions => ['package_name = ?', "#{pkg.package_name}"])
    end

    @freqPackages = @pkgNumBuilds.sort_by { |k,v| -v }[0..2]

    # Find the users who most frequently run builds
    @userNumBuilds = Hash.new
    @@allUsers.each do |user|
     @userNumBuilds[:"#{user.build_user}"] = Metric.count(:conditions => ['build_user =?', "#{user.build_user}"])
    end

    @freqUsers = @userNumBuilds.sort_by { |k,v| -v }[0..2]

    # Gather aggregate data about each package type
    @@allPackageTypes.each do |type|
      @stats[:"#{type}"]                   = Hash[:key => "#{type}", :count => 0, :avgSpd => 0, :freqHost => '', :freqHostPercent => 0]
      @stats[:"#{type}"][:count]           = Metric.count(:conditions => ['package_type = ?', "#{type}"])
      @stats[:"#{type}"][:avgSpd]          = Metric.avg(:jenkins_build_time, :conditions => ['package_type = ?', "#{type}"])
      @stats[:"#{type}"][:freqHost]        = Metric.aggregate(:build_loc, :all.count, :conditions => ['package_type = ?', "#{type}"]).sort {|a,b| b[1] <=> a[1]}[0]
      @stats[:"#{type}"][:freqHost][0]     = /^[^\.]*/.match(@stats[:"#{type}"][:freqHost][0])
      totalTypeBuilds = Metric.count(:conditions => ['package_type = ?', "#{type}"])
      @stats[:"#{type}"][:freqHostPercent] = @stats[:"#{type}"][:freqHost][1] / Float(totalTypeBuilds)
      @stats[:"#{type}"][:freqHostPercent] = (@stats[:"#{type}"][:freqHostPercent] * 100).round(0)
    end

    # Gather team statistics
    @teamNumBuilds           = Hash.new
    @teamNumBuilds[:release] = Hash[:key => 'Release', :count => 102]
    @teamNumBuilds[:other]   = Hash[:key => 'Other', :count => 42]
    @otherTeamBuildSeries    = [10, 12, 16, 7, 12, 20, 14, 14, 10, 9, 4, 19]

    erb :overview
  end

  # A dynamic route for each individual package view
  get '/package/:package' do

    erb :package
  end

  get '/summary/type/:type' do
    if params[:type] == 'gem'
      @title = 'Overview of Rubygem Statistics'
    else
      @title = "Overview of distributions using #{params[:type]} packages"
    end

    erb :typeStats
  end

  # Listener for incoming metrics. Stores the data in the metrics database
  # Expects a hash with the following keys:
  # date, package_name, dist, package_type, build_user, build_loc, version, pe_version, package_build_time, jenkins_build_time,  success, build_log
  # See README for details on each of these variables
  post '/overview/metrics' do
    # Format some paramters and download the Jenkins build log for storage
    puts params.inspect
    params[:date]    = Time.now.to_s
    params[:dist]    = params[:dist][3..-1] if params[:dist][0..2].match(/[\d]+\.[\d]+/)
    params[:dist]    = 'sles11' if params[:dist] == 'sl11'
    params[:success] = case params[:success]
        when /SUCCESS/ then true
        when /true/    then true
        else false
    end

    # Download the build log from jenkins if the build was run through jenkins
    params[:build_log] = `wget -q #{params[:build_log]} -O -` if params[:jenkins_build_time] != nil
    params[:package_build_time] = nil if params[:package_build_time] == 'N/A'

    # A bit of a hack to make sure we get the package build time, which is a problem for dynamic Jenkins builds
    if params[:package_build_time] == nil and params[:jenkins_build_time] != nil and params[:build_log] != nil
      params[:package_build_time] = /(?:Finished building in:) ([\d]+\.?[\d]*)/.match(params[:build_log])[1]
    end

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
