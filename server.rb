require 'sinatra/base'
require 'fileutils'
require 'json'
require 'yaml'
require 'date'
require 'data_mapper'
require 'dm-postgres-adapter'
require 'dm-aggregates'

class MetricServer < Sinatra::Base

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
    before do
      @allPackageNames   = Metric.all(:fields => [:package_name], :unique => true, :order => [:package_name.asc])
      @allDists          = Metric.all(:fields => [:dist], :unique => true, :order => [:dist.asc])
      @allHosts          = Metric.all(:fields => [:build_loc], :unique => true, :order => [:build_loc.asc])
      @allUsers          = Metric.all(:fields => [:build_user], :unique => true, :order => [:build_user.asc])
      @allPackageTypes   = ['deb', 'rpm', 'gem', 'dmg']
      @pageNumber        = 0 # This is used for the historical build log
    end

  #  =============================  ROUTES  =============================== #
  get '/' do
    redirect to('/overview')
  end

  get '/package' do
    erb :packageSelection
  end

  get '/overview' do
    @urlType      = 'all'
    @urlName      = 'all'

    # Determine how many pages of data there are for the historical build log
    @totalPages = Metric.count
    puts @totalPages
    @totalPages = (Float(@totalPages) / Float(11)).ceil

    # First, get all data about the latest 6 builds
    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :jenkins_build_time.not => nil)

    # Next, for each recent build find all build times for the appropriate dist to formulate a trend
    @trends = Hash.new
    @stats[:latest].each do |package|
      @trends["#{package[:package_name]}-#{package[:dist]}-#{package[:id]}"] = Metric.all(:fields => [:jenkins_build_time],
                                                      :order                  => [:date.desc],
                                                      :package_name           => package[:package_name],
                                                      :dist                   => package[:dist],
                                                      :jenkins_build_time.not => nil,
                                                      :id.lte => package[:id])
    end

    # Gather high level metrics. Some of this data is fabricated until real data can be aquired
    # These arrays are used to create a time series of number of builds by various teams
    # Gather time series data about the number of builds and failure rate. Allow up to 12 months of data.
    thisYear                                   = Date.today.strftime("%Y")
    lastYear                                   = thisYear.to_i - 1
    thisMonth                                  = Date.today.strftime("%m")
    @stats[:buildsTimeSeries]                  = Hash.new
    @stats[:buildsTimeSeries][:"#{thisYear}"]  = Hash.new
    @stats[:buildsTimeSeries][:"#{lastYear}"]  = Hash.new

    @stats[:teamTimeSeries]                    = Hash.new
    @stats[:teamTimeSeries][:"#{thisYear}"]    = Hash.new
    @stats[:teamTimeSeries][:"#{lastYear}"]    = Hash.new

    @monthArray                                = []
    monthCounter                               = 0
    curYear                                    = lastYear

    # Create an array of months based on the current month
    fakeTeamData = [10, 12, 16, 7, 12, 20, 14, 14, 10, 9, 4, 19, 19]
    until monthCounter == 13 do
      if monthCounter != 0 and thisMonth == '01'
        # Incrememnt the year
        nextYear = curYear.to_i + 1
        curYear  = nextYear
      end
      @stats[:buildsTimeSeries][:"#{curYear}"][:"#{thisMonth}"]               = Hash[:key => "#{curYear}-#{thisMonth}", :count => 0, :failCount => 0]
      @stats[:buildsTimeSeries][:"#{curYear}"][:"#{thisMonth}"][:count]       = DataMapper.repository.adapter.select("SELECT COUNT(*) FROM metrics WHERE date LIKE '#{curYear}-#{thisMonth}%'")
      @stats[:buildsTimeSeries][:"#{curYear}"][:"#{thisMonth}"][:failCount]   = DataMapper.repository.adapter.select("SELECT COUNT(*) FROM metrics WHERE success = false AND date LIKE '#{curYear}-#{thisMonth}%'")
      @stats[:teamTimeSeries][:"#{curYear}"][:"#{thisMonth}"]                 = Hash[:key => "#{curYear}-#{thisMonth}", :count => fakeTeamData[monthCounter]]

      @monthArray << "#{curYear}-#{thisMonth}"
      nextMonth = thisMonth.to_i + 1
      if nextMonth.to_i < 10
        nextMonth = '0' + nextMonth.to_s
      elsif nextMonth.to_i == 13
        nextMonth = '01'
      end
      thisMonth = nextMonth
      monthCounter += 1
    end

    # Collect data on shipped RC and final packages
    @stats[:shipped]         = Hash.new
    @stats[:shipped][:final] = Hash[:key => 'Final', :count => 1]
    @stats[:shipped][:rc]    = Hash[:key => 'RC', :count => 3]

    # Gather the number of times each package has been built and find the top 3
    @pkgNumBuilds = Hash.new
    @allPackageNames.each do |pkg|
     @pkgNumBuilds[:"#{pkg.package_name}"] = Metric.count(:conditions => ['package_name = ?', "#{pkg.package_name}"])
    end

    @freqPackages = @pkgNumBuilds.sort_by { |k,v| -v }[0..2]

    # Find the users who most frequently run builds
    @userNumBuilds = Hash.new
    @allUsers.each do |user|
     @userNumBuilds[:"#{user.build_user}"] = Metric.count(:conditions => ['build_user =?', "#{user.build_user}"])
    end

    @freqUsers = @userNumBuilds.sort_by { |k,v| -v }[0..2]

    # Gather aggregate data about each package type
    @allPackageTypes.each do |type|
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

    erb :overview
  end

  # A dynamic route to gather historical build log data
  get '/log/:options' do
    @packageName  = params[:package]

    # options is a parameter with the form: package-facter, type-deb, or all-all
    type = params[:options].split('~')[0]
    name = params[:options].split('~')[1]
    page = params[:options].split('~')[2]


    # Get all data about the latest 11 builds
    offset = page.to_i * 11
    @stats = Hash.new
    if type == 'all'
      @stats[:latest] = Metric.all(:order  => [:date.desc], :offset => offset.to_i, :limit  => 11)
    else
      @stats[:latest] = Metric.all(:order  => [:date.desc], :offset => offset.to_i, :limit  => 11, :"#{type}" => name)
    end

    @stats[:latest].each do |build|
      build = Hash[:id                   => build.id,
                   :date                 => build.date,
                   :package_name         => build.package_name,
                   :package_type         => build.package_type,
                   :dist                 => build.dist,
                   :build_user           => build.build_user,
                   :build_loc            => build.build_loc,
                   :version              => build.version,
                   :pe_version           => build.pe_version,
                   :jenkins_build_time   => build.jenkins_build_time,
                   :package_build_time   => build.package_build_time,
                   :success              => build.success,
                   :build_log            => build.build_log]
    end
    @stats[:latest].to_json
  end

  # A dynamic route for each individual package view
  get '/package/:package' do
    @packageName  = params[:package]
    @urlType      = 'package_name'
    @urlName      = params[:package]

    # Determine how many pages of data there are for the historical build log
    @totalPages = Metric.count(:package_name => params[:package])
    @totalPages = (Float(@totalPages) / Float(11)).ceil

    # First, get all data about the latest 6 builds
    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :package_name => params[:package],
                        :jenkins_build_time.not => nil)

    # Next, for each recent build find all build times for the appropriate dist to formulate a trend
    @trends = Hash.new
    @stats[:latest].each do |package|
      @trends["#{package[:package_name]}-#{package[:dist]}-#{package[:id]}"] = Metric.all(:fields => [:jenkins_build_time],
                                                      :order                  => [:date.desc],
                                                      :package_name           => params[:package],
                                                      :dist                   => package[:dist],
                                                      :jenkins_build_time.not => nil,
                                                      :id.lte                 => package[:id])
    end

    # Gather stats for the 'general stats' section
    @stats[:general] = Hash.new
    @stats[:general][:RCReleases]    = 22
    @stats[:general][:finalReleases] = 35
    @stats[:general][:releaseBuilds] = 402
    @stats[:general][:otherBuilds]   = 115
    @stats[:general][:FOSSBuilds]    = Metric.count(:package_name => params[:package], :pe_version => 'N/A')
    @stats[:general][:PEBuilds]      = Metric.count(:package_name => params[:package], :pe_version.not => 'N/A')

    # Gather aggregate data about each package type
    @allPackageTypes.each do |type|
      @stats[:"#{type}"]                   = Hash[:key => "#{type}", :count => 0, :avgSpd => 0, :freqHost => '', :freqHostPercent => 0, :freqHostHash => Hash.new]
      @stats[:"#{type}"][:count]           = Metric.count(:package_type => type, :package_name => params[:package])
      @stats[:"#{type}"][:avgSpd]          = Metric.avg(:jenkins_build_time, :package_type => type, :package_name => params[:package])
    end

    totalBuilds = Metric.count(:package_name => params[:package])
    @stats[:freqHostList]    = Metric.aggregate(:build_loc, :all.count, :package_name => params[:package]).sort {|a,b| b[1] <=> a[1]}
    @stats[:freqHostList].each do |host|
      percent = host[1] / Float(totalBuilds)
      percent = (percent * 100).round(0)
      host << percent
    end

    @stats[:freqHostList] = @stats[:freqHostList][0..9]

    # Gather time series data about the number of builds and failure rate. Allow up to 12 months of data.
    thisYear                             = Date.today.strftime("%Y")
    lastYear                             = thisYear.to_i - 1
    thisMonth                            = Date.today.strftime("%m")
    @stats[:timeSeries]                  = Hash.new
    @stats[:timeSeries][:"#{thisYear}"]  = Hash.new
    @stats[:timeSeries][:"#{lastYear}"]  = Hash.new
    @monthArray                          = []
    monthCounter                         = 0
    curYear                              = lastYear

    # Create an array of months based on the current month
    until monthCounter == 13 do
      if monthCounter != 0 and thisMonth == '01'
        # Incrememnt the year
        nextYear = curYear.to_i + 1
        curYear  = nextYear
      end
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"]       = Hash[:key => "#{curYear}-#{thisMonth}", :count => 0, :avg => 0, :failureRate => 0]
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:count] = DataMapper.repository.adapter.select("SELECT COUNT(*) FROM metrics WHERE package_name = '#{params[:package]}' AND date LIKE '#{curYear}-#{thisMonth}%'")
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg] = DataMapper.repository.adapter.select("SELECT jenkins_build_time FROM metrics WHERE package_name = '#{params[:package]}' AND jenkins_build_time IS NOT NULL AND date LIKE '#{curYear}-#{thisMonth}%'")
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg] = @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg].inject(0.0) { |sum, el| sum + el } / @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg].size
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg] = 0 if @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:avg].nan?
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate] = DataMapper.repository.adapter.select("SELECT COUNT(*) FROM metrics WHERE package_name = '#{params[:package]}' AND success = false AND date LIKE '#{curYear}-#{thisMonth}%'")
      @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate] = Float(@stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate][0]) / Float(@stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:count][0])

      if @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate].nan?
        @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate] = 0
      else
        puts @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate]
        @stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate] = ((@stats[:timeSeries][:"#{curYear}"][:"#{thisMonth}"][:failureRate]) * 100).round(0)
      end

      @monthArray << "#{curYear}-#{thisMonth}"
      nextMonth = thisMonth.to_i + 1
      if nextMonth.to_i < 10
        nextMonth = '0' + nextMonth.to_s
      elsif nextMonth.to_i == 13
        nextMonth = '01'
      end
      thisMonth = nextMonth
      monthCounter += 1
    end
    erb :package
  end

  get '/summary/type/:type' do
    @packageType  = case params[:type]
      when 'deb' then 'Debian'
      when 'rpm' then 'RPM'
      when 'gem' then 'RubyGem'
      when 'dmg' then 'DMG'
    end
    @urlType  = 'package_type'
    @urlName  = params[:type]

    # Determine how many pages of data there are for the historical build log
    @totalPages = Metric.count(:package_type => params[:type])
    @totalPages = (Float(@totalPages) / Float(11)).ceil

    # First, get all data about the latest 6 builds
    @stats = Hash.new
    @stats[:latest] = Metric.all(
                        :order => [:date.desc],
                        :limit => 6,
                        :jenkins_build_time.not => nil,
                        :package_type => params[:type])

    # Next, for each recent build find all build times for the appropriate dist to formulate a trend
    @trends = Hash.new
    @stats[:latest].each do |package|
      @trends["#{package[:package_name]}-#{package[:dist]}-#{package[:id]}"] = Metric.all(:fields => [:jenkins_build_time],
                                                      :order                  => [:date.desc],
                                                      :package_name           => package[:package_name],
                                                      :dist                   => package[:dist],
                                                      :jenkins_build_time.not => nil,
                                                      :package_type           => params[:type],
                                                      :id.lte                 => package[:id])
    end

    # Gather stats about Jenkins and local builds
    @stats[:jenkinsBuilds]          = Hash[:key => 'Jenkins Jobs', :count => 0, :avgSpd => 0]
    @stats[:localBuilds]            = Hash[:key => 'Local Builds', :count => 0, :avgSpd => 0]
    @stats[:jenkinsBuilds][:count]  = Metric.count(:package_type => params[:type], :jenkins_build_time.not => nil)
    @stats[:localBuilds][:count]    = Metric.count(:package_type => params[:type], :jenkins_build_time => nil, :package_build_time.not => nil)
    @stats[:jenkinsBuilds][:avgSpd] = Metric.avg(:jenkins_build_time, :package_type => params[:type], :jenkins_build_time.not => nil)
    @stats[:localBuilds][:avgSpd]   = Metric.avg(:package_build_time, :package_type => params[:type], :package_build_time.not => nil)

    # Gather stats about build hosts
    @hostDataArray = []
    allBuildHosts   = Metric.all(:fields => [:build_loc], :unique => true, :package_type => params[:type], :jenkins_build_time.not => nil, :order => [:build_loc.asc])
    allBuildHosts.each do |host|
      hostName = /^[^\.]*/.match(host.build_loc)
      @stats["#{hostName}"] = Hash[:key => "#{hostName}", :count => 0, :percent => 0]
      @stats["#{hostName}"][:count]   = Metric.count(:package_type => params[:type], :build_loc => "#{host.build_loc}", :jenkins_build_time.not => nil)
      @stats["#{hostName}"][:percent] = @stats["#{hostName}"][:count] / Float(@stats[:jenkinsBuilds][:count])
      @stats["#{hostName}"][:percent] = (@stats["#{hostName}"][:percent] * 100).round(0)
      @hostDataArray << @stats["#{hostName}"].to_json
    end

    # Collect stats for each distribution of this package type, including average speed and failure percentage
    @distDataArray = []
    allDists   = Metric.all(:fields => [:dist], :unique => true, :package_type => params[:type], :order => [:dist.asc])
    allDists.each do |dist|
      numBuilds = Metric.count(:dist => dist.dist)
      @stats["#{dist.dist}"]           = Hash[:key => "#{dist.dist}", :avgSpd => 0, :failPercent => 0]
      @stats["#{dist.dist}"][:avgSpd]  = Metric.avg(:package_build_time, :dist => dist.dist, :package_build_time.not => nil)
      @stats["#{dist.dist}"][:failPercent] = (Metric.count(:dist => dist.dist, :success => false) / Float(numBuilds))
      @stats["#{dist.dist}"][:failPercent] = (@stats["#{dist.dist}"][:failPercent] * 100).round(0)
      @distDataArray << @stats["#{dist.dist}"].to_json
    end

    @stats[:general]                    = Hash.new
    @stats[:general][:totalBuilds]      = Metric.count(:package_type => params[:type])
    @stats[:general][:releaseBuilds]    = 620
    @stats[:general][:otherBuilds]      = 293
    @stats[:general][:mostBuiltDist]    = Metric.aggregate(:dist, :all.count, :conditions => ['package_type = ?', "#{params[:type]}"]).sort {|a,b| b[1] <=> a[1]}[0]
    @stats[:general][:mostBuiltPackage] = Metric.aggregate(:package_name, :all.count, :conditions => ['package_type = ?', "#{params[:type]}"]).sort {|a,b| b[1] <=> a[1]}[0]
    @stats[:general][:failureRate]      = Metric.count(:package_type => params[:type], :success => false) / Float(@stats[:general][:totalBuilds])
    @stats[:general][:failureRate]      = (@stats[:general][:failureRate] * 100).round(0)

    erb :pkgTypeBoard
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
      if /(?:Finished building in:) ([\d]+\.?[\d]*)/.match(params[:build_log])
        params[:package_build_time]  = /(?:Finished building in:) ([\d]+\.?[\d]*)/.match(params[:build_log])[1]
      else
        params[:package_build_time] = params[:jenkins_build_time] if params[:package_build_time] == nil
      end
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
