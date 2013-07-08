require 'spec_helper'
require 'rspec'
require 'rack/test'
require 'yaml'
require File.expand_path('../../server.rb', __FILE__)
require File.expand_path('../../models/metric.rb', __FILE__)

describe MetricServer do
  include Rack::Test::Methods

  before :all do
    config = YAML.load_file('/etc/metrics/db.conf')
    config_string = "postgres://#{config['username']}:#{config['password']}@#{config['hostname']}#{config.has_key?('port') ? ":#{config['port']}" : ""}/test_metrics"
    DataMapper.setup(:default, config_string)
    DataMapper.finalize
    Metric.auto_migrate!
  end

  def app
    MetricServer
  end

  it 'should load the overview page' do
    get '/overview'
    last_response.should be_ok
  end

  it 'should load an existing package page' do
    get '/package/facter'
    last_response.should be_ok
  end

  it 'should throw a 404 when a page is not found' do
    get '/nonexistent'
    last_response.status.should == 404
  end

  it 'should store data from post requests to /overview/metrics' do
    lambda do
      post '/overview/metrics', params = { :date               => '2013-07-05T20:08:43+00:00',
                                  :package_name       => 'puppet-razor',
                                  :dist               => 'wheezy',
                                  :jenkins_build_time => 55.0,
                                  :package_build_time => 50.0,
                                  :build_user         => 'user',
                                  :version            => '1.0.0',
                                  :pe_version         => 'N/A',
                                  :success            => 'TRUE' }
    end.should {
      last_response.should be_ok
      change(Metric, :count).by(1)
    }
  end
end
