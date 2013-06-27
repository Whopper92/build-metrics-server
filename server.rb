require 'yaml'
require 'sinatra/base'
require 'data_mapper'
require 'dm-postgres-adapter'

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
      puts "Temporary error notice: no configuration file present, and no DB could \
            be reached"
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

  #  =============================  ROUTES  =============================== #

  get '/' do
    puts '/'
  end

  # Listener for incoming metrics. Stores the data in the metrics database
  # Expects a hash with the following keys:
  #
  #
  post '/overview/metrics' do
    render_page do
      begin
        # Do math on minutes section, combine with seconds bits.
        if (time = params[:build_time].match(/(\d*)m(\d*\.\d*)s/))
          params[:build_time] = (time[1].to_i * 60).to_f + time[2].to_f
        # Strip the trailing s from `time` submissions.
        elsif (time = params[:build_time].match(/(\d*\.\d*)s/))
          params[:build_time] = time[1]
        end
        Metric.create( params )
        200
      rescue Exception => e
        [418, "#{e.message} AND #{params.inspect}"]
      end
    end
  end

  # Start the server if this file is executed directly
  run! if app_file == $0
end
