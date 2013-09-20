/* Common JS functions used throughout the dashboard */

function convertTime(dateString) {
  var date    = dateString.slice(0,10)
  var minutes = dateString.slice(14,16)
  if(parseInt(dateString.slice(11,13)) < 10) {
    var hours = dateString.slice(12,13)
  } else {
    var hours = dateString.slice(11,13)
  }

  if(parseInt(hours) == 12) {
    var time    = '12:' + minutes + ' PM'
  } else if(parseInt(hours) > 12) {
    var stdHour = parseInt(hours) - 12
    var time    = String(stdHour) + ':' + minutes + ' PM'
  } else {
    var time    = hours + ':' + minutes + ' AM'
  }
  return time
}

function getMonthNum(month) {
  var monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return monthFull.indexOf(month) + 1
}

function getMonthName(monthNum) {
  var monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return monthFull[monthNum]
}

function getDate(dateString, format) {
  var monthAbr  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  var monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December']

  var monthNum = dateString.slice(5,7)
  var day      = dateString.slice(8,10)

  if(format == 'full') {
    month = monthFull[parseInt(monthNum) - 1]
    date  = month + ' ' + day + ' at ' + convertTime(dateString)
  } else {
    month = monthAbr[parseInt(monthNum) - 1]
    date = month + ' ' + day + ', ' + convertTime(dateString)
  }

  return date
}

/* Creates the modals which are triggered by hovering
over any table row on the overview dashboard */
function createTableRowModal(rowID, modalContent) {
  var container = document.getElementById(rowID.id);
  var topPos = 0;
  var leftPos = 0;
  while(container.tagName != "BODY") {
    topPos   += container.offsetTop - 25;
    leftPos  += container.offsetLeft + 10;
    container = container.offsetParent;
  }

  d3.select('#tableModal')
    .style('left', leftPos + 'px')
    .style('top', topPos + 'px')
    .select('#tableModalTitle')
    .text(modalContent)

    console.log(modalContent)
  d3.select('#tableModal')
    .style('left', leftPos + 'px')
    .style('top', topPos + 'px')
    .select('#tableModalFooter')
    .text('Click for additional data');

    d3.select('#tableModal').classed('hidden', false);
}

function removeTableModal() {
  d3.select('#tableModal').classed('hidden', true);
}

function displayCalModal() {
  $('#calModal').modal('show')
}
