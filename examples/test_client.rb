require 'net/http'

@metric_server = 'http://localhost:4567/overview/metrics'
@package      = 'client_test'
@dist         = 'el9'
@build_time   = '12.34.56'
@build_user   = 'sinatra'
@build_loc    = 'not dagr'
@version      = '1.2.3rc1'
@pe_version   = '2.8.0'
@success      = true
@build_log    = ['IT BUILT!']

uri = URI(@metric_server)
res = Net::HTTP.post_form(
  uri,
  {
    'date'        => Time.now.to_s,
    'package'     => @package,
    'dist'        => @dist,
    'build_time'  => @build_time,
    'build_user'  => @build_user,
    'build_loc'   => @build_loc,
    'version'     => @version,
    'pe_version'  => @pe_version,
    'success'     => @success,
    'build_log'   => @build_log,
  })

puts res.body
