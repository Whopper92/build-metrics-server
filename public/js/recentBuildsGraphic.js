function createRecentBuildsGraphic(data) {

  console.log(data);
  var dataset = data;
  drawRecentBuildsGraphic(dataset);
}

function drawRecentBuildsGraphic(dataset) {
  var fontSize;
  var columnTitles = ["Result", "Dist", "Package", "Time", "Trend"]
  var columns = ["success", "dist", "package_name", "jenkins_build_time", "trend"];

  var table = d3.select("#recentBuildsContent").append("table")
                .attr('class', 'table table-striped table-hover')
  var thead       = table.append("thead")
  var tbody       = table.append("tbody");

  // append the header row
  thead.append("tr")
      .selectAll("th")
      .data(columnTitles)
      .enter()
      .append("th")
      .text(function(column) { return column; })
      .attr('class', function(column) {
        if(column == 'Result') {
          return 'result'
        } else if(column == 'Dist') {
          return 'dist'
        } else if(column == 'Package') {
          return 'package'
        } else if(column == 'Time') {
          return 'buildTime'
        } else if(column == 'Trend') {
          return 'trend'
        }
      })

  // create a row for each object in the data
  var rows = tbody.selectAll("tr")
      .data(dataset)
      .enter()
      .append("tr")

  // create a cell in each row for each column
  var cells = rows.selectAll("td")
      .data(function(row) {
          return columns.map(function(column) {
              return {column: column, value: row[column]};
          });
      })
      .enter()
      .append("td")
      .text(function(d, row) {
        return d.value;
      })

/*
  var successInd = cells.append('svg')
                        .attr('id', 'recentBuildsSuccess')

  successInd.append('circle')
            .attr('cx', 15)
            .attr('cy', 27)
            .attr('r', 8)
            .attr('fill', function(d) {
              if( d.success == true) {
                return 'limegreen'
              } else {
                return 'red'
              }
            });
*/
/*
  var successInd = buildsDiv.append('svg')
                            .attr('id', 'recentBuildsSuccess')

  successInd.append('circle')
            .attr('cx', 15)
            .attr('cy', 27)
            .attr('r', 8)
            .attr('fill', function(d) {
              if( d.success == true) {
                return 'limegreen'
              } else {
                return 'red'
              }
            });
*/
}

function displayOverviewTooltip(tooltipID, contentID, xPosition, yPosition, textContent) {

  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentID)
    .text(' ' + textContent);

  d3.select(tooltipID).classed('hidden', false);
}

function hideTooltip(tooltipID) {

  d3.select(tooltipID).classed('hidden', true);
}
