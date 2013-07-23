function createLineGraph(totalDataset, failedDataset, width, height, txtPadding, divID, graphID, units) {

  /* Define variables for use with graph generation*/
  var w           = width
  var h           = height
  var textPadding = txtPadding
  var xPadding    = 30
  var yPadding    = 40

  /* D3 scales used in graph generation */
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(totalDataset.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(totalDataset, function(d) {
                    return parseInt(JSON.parse(d)) + 10
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
    of package builds, while the failed line holds data about the number of failed builds. Either
    line is optional, simply by providing an empty array to this function as an argument for either.
  */
  var totalLine = d3.svg.line()
      .interpolate('cardinal')
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
        return yScale(d) - yPadding / 3;
      })

  var failedLine = d3.svg.line()
      .interpolate('cardinal')
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
        return yScale(d) - yPadding / 3;
      })

  /* Add the circular points on top of the line path */
  var totalPoints = svg.selectAll('.point')
       .data(totalDataset)
       .enter()
       .append('circle')
       .attr('stroke', 'black')
       .attr('stroke-width', '1px')
       .attr('fill', 'steelblue')
       .attr('cx', function(d, i) { return xScale(i) + xPadding})
       .attr('cy', function(d, i) { return yScale(d) + yPadding / 3 })
       .attr('r', '5')
       .on('mouseover', function(d) {

          displayTooltip('#graphToolTip', '#graphToolTipTitle', '#graphToolTipFooter', getToolTipXPos(divID, this), getToolTipYPos(divID, this), '', d, 'builds');
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

  /* If data is provided for a 'failed line', we render the points for it and draw the path*/
  if(failedDataset.length > 0) {
    var failedPoints = svg.selectAll('.point')
         .data(failedDataset)
         .enter()
         .append('circle')
         .attr('stroke', 'black')
         .attr('stroke-width', '1px')
         .attr('fill', '#B80000')
         .attr('cx', function(d, i) { return xScale(i) + xPadding})
         .attr('cy', function(d, i) { return yScale(d) + yPadding / 3 })
         .attr('r', '5')
         .on('mouseover', function(d) {

            displayTooltip('#graphToolTip', '#graphToolTipTitle', '#graphToolTipFooter', getToolTipXPos(divID, this), getToolTipYPos(divID, this), '',  d, 'builds');

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
     .attr('d', failedLine(failedDataset))
     .attr('stroke', '#B80000');
  }

  g.append('path')
   .attr('d', totalLine(totalDataset))
   .attr('stroke', 'steelblue');

  /* Create the axis labels*/
  var weeksAgo = 12
  svg.selectAll('text')
      .data(totalDataset)
      .enter()
      .append('text')
      .text(function(d) {
        if ( weeksAgo != 1) {
          weeksAgo--
          return weeksAgo
        } else {
          return 'Now'
        }
      })
      .attr('x', function(d, i) {
        return xScale(i) + xPadding;
      })
      .attr('y', function(d) {
        return h - 5
      })
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')

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
