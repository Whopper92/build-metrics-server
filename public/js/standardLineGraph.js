/* Creates a line graph for individual package build speed trends*/
function createStandardLineGraph(dataset, width, height, txtPadding, xAxisPadding, yAxisPadding, scaleAdjust, divID, graphID, units) {
  /* Define variables for use with graph generation*/
  console.log(dataset)
  var w           = width
  var h           = height
  var textPadding = txtPadding
  var xPadding    = xAxisPadding
  var yPadding    = yAxisPadding

  /* D3 scales used in graph generation */
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(dataset.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(dataset, function(d) {
                    if(units == '% Failed') {
                      return 100
                    } else if(units == 'seconds') {
                      return parseInt(JSON.parse(d).avg) + scaleAdjust
                    } else if(units == 'builds') {
                      return parseInt(JSON.parse(d).count) + scaleAdjust
                    }
                  })])
                .range([h - yPadding, 0]);

  /* Graph generation. First, append the SVG element that holds the entire graph*/
  var svg = d3.select(divID)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .attr('id', graphID)
  var g = svg.append('g')
      .attr('transform', 'translate(0, 25)');

  /* Line graphs in this dashboard may have multiple lines. Specifically, they may contain
    a 'total line' and a 'failed line.' The total line contains data such as the total number
    of package builds, while the failed line holds data about the number of failed builds. The
    'failed' line is optional.
  */

  var line = d3.svg.line()
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
        if(units == '% Failed') {
          return yScale(JSON.parse(d).failureRate) + 10;
        } else if(units == 'seconds') {
          return yScale(JSON.parse(d).avg) + 10;
        } else if(units == 'builds') {
          return yScale(JSON.parse(d).count) + 10;
        }
      })

  var failedLine = d3.svg.line()
      .interpolate('cardinal')
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
          console.log('failed')
          console.log(JSON.parse(d).failCount)
          return yScale(JSON.parse(d).failCount) + 10;
      })

  /* Add the circular points on top of the line path */
  var points = svg.selectAll('.point')
       .data(dataset)
       .enter()
       .append('circle')
       .attr('stroke', 'black')
       .attr('stroke-width', '1px')
       .attr('fill', function(d) {
         if(units == '% Failed') {
           return '#B80000'
         } else {
           return 'steelblue'
         }
       })
       .attr('cx', function(d, i) { return xScale(i) + xPadding})
       .attr('cy', function(d, i) {
          if(units == '% Failed') {
            return yScale(JSON.parse(d).failureRate) + 35
          } else if(units =='seconds') {
            return yScale(JSON.parse(d).avg) + 35
          } else if(units == 'builds') {
            console.log(yScale(JSON.parse(d).count) + 35)
            return yScale(JSON.parse(d).count) + 35
          }
        })
       .attr('r', '5')
       .on('mouseover', function(d) {
          if(units == '% Failed') {
            displayLabel = JSON.parse(d).failureRate.toFixed(0)
          } else if(units == 'seconds') {
            displayLabel = JSON.parse(d).avg.toFixed(2)
          } else if(units == 'builds') {
            displayLabel = JSON.parse(d).count
          }
          displayTooltip('#graphToolTip', '#graphToolTipTitle', '#graphToolTipFooter', getToolTipXPos(divID, this), getToolTipYPos(divID, this), getLabelString(d), displayLabel, units);
          d3.select(this)
            .transition()
            .duration(250)
            .attr('r', '10')
            .attr('cursor', 'pointer')
        })
       .on('mouseout', function(d) {
         hideTooltip('#graphToolTip')
         d3.select(this)
           .transition()
           .duration(250)
           .attr('r', '5')
       })

  g.append('path')
   .attr('d', line(dataset))
   .attr('stroke', function(d) {
      if(units == '% Failed') {
        return '#B80000'
      } else {
        return 'steelblue'
      }
    });

/* If data is provided for a 'failed line', we render the points for it and draw the path*/
  if(JSON.parse(dataset[0]).failCount != null) {
    console.log('right mewo!!!')
    var failedPoints = svg.selectAll('.point')
         .data(dataset)
         .enter()
         .append('circle')
         .attr('stroke', 'black')
         .attr('stroke-width', '1px')
         .attr('fill', '#B80000')
         .attr('cx', function(d, i) { return xScale(i) + xPadding})
         .attr('cy', function(d, i) {
           return yScale(JSON.parse(d).failCount) + 35
          })
         .attr('r', '5')
         .on('mouseover', function(d) {
            displayLabel = JSON.parse(d).failCount
            displayTooltip('#graphToolTip', '#graphToolTipTitle', '#graphToolTipFooter', getToolTipXPos(divID, this), getToolTipYPos(divID, this), getLabelString(d),  displayLabel, 'Failed Builds');
            d3.select(this)
              .transition()
              .duration(250)
              .attr('r', '10')
              .attr('cursor', 'pointer')
          })
         .on('mouseout', function(d) {
           var tooltipID = '#graphToolTip';
           hideTooltip(tooltipID)
           d3.select(this)
             .transition()
             .duration(250)
             .attr('r', '5')
         })

    g.append('path')
     .attr('d', failedLine(dataset))
     .attr('stroke', '#B80000');
  }

  /* Create the axis labels*/
  svg.selectAll('text')
      .data(dataset)
      .enter()
      .append('text')
      .attr("text-anchor", "end")
      .attr('pointer-events', 'none')
      .attr('font-family', 'Arial')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(function(d) {
        return getLabelString(d)
      })
      .attr("transform", function(d, i) {         // transform all the text elements
        xTranslate = xScale(i) + xPadding + 15
        yTranslate = h - 60
        return "translate(" +                     // First translate
          xTranslate + ", " + yTranslate + ") " + // Translation params same as your existing x & y
          "rotate(-65)"                           // THEN rotate them to give a nice slope
        })

  /* Create the axes themselves*/
  var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

  svg.append('g')
      .attr('class', 'x axis xhistoAxis invisAxis')
      .attr('transform', 'translate('+ xPadding +','+ (h - (yPadding / 1.5)) + ')')
      .call(xAxis)

  var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

  svg.append('g')
      .attr('class', 'y axis yhistoAxis')
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 3 + ')')
      .call(yAxis)

  /* Add grid lines to the graph body*/
  svg.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 3  + ')')
      .call(make_y_axis(yScale)
          .tickSize(-w, 0, 0)
          .tickFormat('')
      )
}

/* Get the X position of the div, which allows for dynamic tooltip positioning*/
function getToolTipXPos(divID, svg) {
  var container = document.getElementById(divID.substring(1));
  var leftPos = 0;
  while(container.tagName != "BODY") {
    leftPos += container.offsetLeft;
    container = container.offsetParent;
  }
  var xPosition = parseFloat(d3.select(svg).attr('cx')) + leftPos - 30;
  return xPosition
}

/* Get the Y position of the div, which allows for dynamic tooltip positioning*/
function getToolTipYPos(divID, svg) {
  var container = document.getElementById(divID.substring(1));
  var topPos = 0;
  while(container.tagName != "BODY") {
    topPos += container.offsetTop;
    container = container.offsetParent;
  }
  var yPosition = parseFloat(d3.select(svg).attr('cy')) + topPos - 30;
  return yPosition
}
