function createRecentBuildsGraphic(data) {

  console.log(data);
  var dataset = data;
  drawRecentBuildsGraphic(dataset);
}

function drawRecentBuildsGraphic(dataset) {

  var w           = 500;
  var h           = 400;
  var columnCount = 1;
  var Origcolor   = ''

  var buildsDiv = d3.select('#recentBuildsContent').selectAll('#recentBuild')
                    .data(dataset)
                    .enter()
                    .append('div')
                    .attr('id', 'recentBuild')
                    .style('background-color', function(d) {
                      if(columnCount % 2 == 1) {
                        columnCount += 1
                        color = '#D4D4D4'
                        return color
                      } else {
                        columnCount += 1
                        color = '#FFFFFF'
                        return color
                      }
                    })
                    .on('mouseover', function(d) {
                      origColor = this.style.backgroundColor
                      var xPosition = parseFloat(d3.select(this).attr('x'));
                      var yPosition = parseFloat(d3.select(this).attr('y')) - 100;
                      if(d.success == true) {
                        var result = "Package successfully built!"
                      } else {
                        var result = "Package failed to build..."
                      }
                      d3.select(this)
                        .style('background-color', 'rgba(101, 156, 239, 0.5)')

                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipTitle', xPosition, yPosition, 'Build Details');
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipDate', xPosition, yPosition, d.date.slice(0,10) + ' ' + d.date.slice(11,19));
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipPackage', xPosition, yPosition, d.package_name);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipDist', xPosition, yPosition, d.dist);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipBuildTime', xPosition, yPosition, d.jenkins_build_time );
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipBuildUser', xPosition, yPosition, d.build_user);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipBuildLoc', xPosition, yPosition, d.build_loc);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipVersion', xPosition, yPosition, d.version);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipPEVersion', xPosition, yPosition, d.pe_version);
                        displayOverviewTooltip('#recentBuildsToolTip', '#recentBuildsToolTipSuccess', xPosition, yPosition, result);
                    })
                    .on('mouseout', function(d) {
                      d3.select(this)
                        .style('background-color', function(d) {
                          return origColor
                        })
                      hideTooltip('#recentBuildsToolTip')
                    })

  var successInd = buildsDiv.append('svg')
                            .attr('id', 'recentBuildsSuccess')

  successInd.append('circle')
            .attr('cx', 15)
            .attr('cy', 12)
            .attr('r', 8)
            .attr('fill', function(d) {
              if( d.success == true) {
                return 'limegreen'
              } else {
                return 'red'
              }
            });

  buildsDiv.append('div')
           .attr('id', 'recentBuildsPackageName')
           .text(function(d) { return d.package_name })
           .style('font-size', '20px')

  buildsDiv.append('div')
           .attr('id', 'recentBuildsDist')
           .text(function(d) { return d.dist })
           .style('font-size', '18px')

  buildsDiv.append('div')
           .attr('id', 'recentBuildsBuildTime')
           .text(function(d) { return d.jenkins_build_time.toFixed(0) + " sec"})
           .style('font-size', '20px')

  buildsDiv.append('div')
           .attr('id', 'recentBuildsSparkline')
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
