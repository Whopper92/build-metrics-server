require 'net/http'

@metric_server = 'http://dagr.delivery.puppetlabs.net:4567/overview/metrics'
@package      = 'derp_pkg'
@dist         = 'el9'
@build_time   = '12.34'
@build_user   = 'sinatra'
@build_loc    = 'not-dagr'
@version      = '1.2.3rc2'
@pe_version   = '2.8.0'
@success      = true
@build_log    = ["buildlog!"]

uri = URI(@metric_server)
res = Net::HTTP.post_form(
  uri,
  {
    'date'        => Time.now.strftime("%Y-%m-%d %H:%M:%S").to_s,
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
puts res.code
