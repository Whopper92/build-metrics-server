/* Triggers the all-time build log modal to appear on the overview dashboard */

function createHistoricalBuildLogModal() {
  $('#histLogModal').modal('show')
}

function getBuilds(pageNumber) {
  console.log(pageNumber)
  URL = '/overview/log/' + pageNumber
  d3.json(URL, function(data) {
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
  console.log('ello')
  console.log(data)
}
