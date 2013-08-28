/* Creates the modal popup triggered when a recent
build is clicked in the recent builds graphic on the
overview dashboard */
function createRecentBuildsModal(data) {
  console.log(data)
  var date    = data.date.slice(0,10)
  var hours   = data.date.slice(11,13)
  var minutes = data.date.slice(14,16)

  // Convert time
  if(parseInt(hours) > 12) {
    var stdHour = parseInt(hours) - 12
    var time    = String(stdHour) + ':' + minutes + ' PM'
  } else {
    var time    = hours + ':' + minutes + ' AM'
  }

  // Convert date
  var months    = ['January','February','March','April','May','June','July','August','September','October','November','December']
  var month_num = date.slice(5,7)
  var day       = date.slice(8-10)
  var month     = months[parseInt(month_num) - 1]

  if(data.jenkins_build_time != null) {
    var message = 'This package was built remotely via Jenkins'
  } else {
    var message = 'This package was built locally'
  }

  $('#recentBuildsModal').modal('show')

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalTitle')
    .text(data.package_name + ': built on '+ month + ' ' + day + ' at ' + time)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalPackageCell')
    .text(data.package_name);

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalTypeCell')
    .text(data.package_type)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalDistCell')
    .text(data.dist)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalBuilderCell')
    .text(data.build_user)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalHostCell')
    .text(data.build_loc)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalVersionCell')
    .text(data.version)

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalPeVersionCell')
    .text(function(d) {
      if(data.pe_version != 'N/A') {
        return data.pe_version
      } else {
        return 'Not a PE build'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalTeamCell')
    .text(function(d) {
      if(data.build_team) {
        return data.build_team
      } else {
        return 'Not Available'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalPackageTimeCell')
    .text(function(d) {
      if(data.package_build_time) {
        return parseFloat(data.package_build_time).toFixed(2) + ' seconds'
      } else {
        return 'Not Available'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalJenkinsTimeCell')
    .text(function(d) {
      if(data.jenkins_build_time != null) {
        return parseFloat(data.jenkins_build_time).toFixed(2) + ' seconds'
      } else {
        return 'Not Available'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalStatus')
    .attr('class', function(d) {
      if(data.success == true) {
        return 'alert alert-success'
      } else {
        return 'alert alert-error'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalStatusIcon')
    .attr('class', function(d) {
      if(data.success == true) {
        return 'icon-ok'
      } else {
        return 'icon-remove'
      }
    })

  d3.select('#recentBuildsModal')
    .select('#recentBuildsModalStatusText')
    .html(function(d) {
      if(data.success == true) {
        return '&nbsp&nbsp&nbspThis build completed successfully'
      } else {
        return '&nbsp&nbsp&nbspThis build did not complete successfully'
      }
    })

  // Setup the build log
  d3.select('#logModal')
    .select('#logTitle')
    .text(data.package_name + ' Build Log')

 d3.select('#logModal')
    .select('#logContent')
    .html('<pre>' + data.build_log + '</pre>')

  d3.select('#logBody')
    .style('max-height', function(d) {
      if(screen.height > 900) {
        return '1000px'
      } else {
        return '600px'
      }
    })
}

function createBuildLogModal() {
  $('#logModal').modal('show')
  console.log('SHOWING')
}
