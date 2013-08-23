/* Triggers the all-time build log modal to appear on the overview dashboard */

function createHistoricalBuildLogModal() {
  $('#histLogModal').modal('show')
}

function getBuilds(url) {
  console.log(url)

  d3.json(url, function(data) {
    $("#histLogTable").find("tr:gt(0)").remove();
    loadHistoricalLog(data)
  })
}

function getOldestBuilds() {
  console.log('old')
}

function getNewestBuilds() {
  console.log('new')
}

function loadHistoricalLog(data) {
  var dataArray = new Array()
  for(i = 0; i < data.length; ++i) {
    var trID        = 'histRow' + i
    dataArray[trID] = data[i]
    var user        = data[i].build_user
    var packageName = data[i].package_name
    var dist        = data[i].dist
    if(data[i].jenkins_build_time == null) {
      var buildTime   = data[i].package_build_time
    } else {
      var buildTime   = data[i].jenkins_build_time
    }

    var date    = data[i].date.slice(0,10)
    var hours   = data[i].date.slice(11,13)
    var minutes = data[i].date.slice(14,16)

    // Convert time
    if(parseInt(hours) > 12) {
      var stdHour = parseInt(hours) - 12
      var time    = String(stdHour) + ':' + minutes + ' PM'
    } else {
      var time    = hours + ':' + minutes + ' AM'
    }

    // Convert date
    var months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    var month_num = date.slice(5,7)
    var day       = date.slice(8-10)
    var month     = months[parseInt(month_num) - 1]
    var date      = month + ' ' + day + ', ' + time

    if(data[i].success == true) {
      var fillColor = 'limegreen'
    } else {
      var fillColor = 'red'
    }

    $('#histLogTableTbody').append(
      '<tr id=' + trID + '><td><svg id="resultCell"  xmlns="http://www.w3.org/2000/svg" version="1.1"><defs><filter id="drop-shadow"><feGaussianBlur in="SourceGraphic" stdDeviation="1" /></filter></defs><circle class="resultCircle" r="5" cx="20" cy="8" filter="url(#drop-shadow)" fill="' + fillColor + '"></svg></td><td>' + date + '</td><td>' + user + '</td><td>' + packageName + '</td><td>' + dist + '</td><td>' + buildTime.toFixed(0) + ' sec</td>');

  }

  // I'm so sorry
  $('#histRow0').click(function() { createRecentBuildsModal(data[0])  })
  $('#histRow1').click(function() { createRecentBuildsModal(data[1])   })
  $('#histRow2').click(function() { createRecentBuildsModal(data[2])   })
  $('#histRow3').click(function() { createRecentBuildsModal(data[3])   })
  $('#histRow4').click(function() { createRecentBuildsModal(data[4])   })
  $('#histRow5').click(function() { createRecentBuildsModal(data[5])   })
  $('#histRow6').click(function() { createRecentBuildsModal(data[6])   })
  $('#histRow7').click(function() { createRecentBuildsModal(data[7])   })
  $('#histRow8').click(function() { createRecentBuildsModal(data[8])   })
  $('#histRow9').click(function() { createRecentBuildsModal(data[9])   })
  $('#histRow10').click(function() { createRecentBuildsModal(data[10]) })
  $('#histRow11').click(function() { createRecentBuildsModal(data[11]) })

  $('#recentBuildsModal').css('z-index', '5000')
  $('#logModal').css('z-index', '6000')
}
