require 'sinatra'
require 'passenger'

require "#{File.dirname(__FILE__)}/server"

run MetricServer
