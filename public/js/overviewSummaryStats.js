function createBuildTimeSeriesGraph(dataset) {

  var w           = 460
  var h           = 445
  var textPadding = 70
  var xPadding    = 30
  var yPadding    = 40

  var xScale = d3.scale.ordinal()
                 .domain(d3.range(dataset[0].length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(dataset[0], function(d) {
                    return parseInt(JSON.parse(d)) + 10
                  })])
                .range([h - yPadding, 0]);

  var svg = d3.select('#summaryBuildNumberContent')
      .append('svg')
      .attr('width', w)
      .attr('height', h)

  var g = svg.append('g')
      .attr('transform', 'translate(0, 25)');

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

  var area = d3.svg.area()
      .x(function(d, i) { return xScale(i) + xPadding; })
      .y0(h - yPadding)
      .y1(function(d) { return yScale(d) + yPadding / 3; });

  var totalPoints = svg.selectAll('.point')
       .data(dataset[0])
       .enter()
       .append('circle')
       .attr('stroke', 'black')
       .attr('stroke-width', '1px')
       .attr('fill', 'steelblue')
       .attr('cx', function(d, i) { return xScale(i) + xPadding})
       .attr('cy', function(d, i) { return yScale(d) + yPadding / 3 })
       .attr('r', '5')
       .on('mouseover', function(d) {

          var container = document.getElementById('summaryBuildNumberContent');
          var topPos = 0;
          var leftPos = 0;
          while(container.tagName != "BODY") {
            topPos += container.offsetTop;
            leftPos += container.offsetLeft;
            container = container.offsetParent;
          }

          var xPosition = parseFloat(d3.select(this).attr('cx')) + leftPos - 40;
          var yPosition = parseFloat(d3.select(this).attr('cy')) + topPos - 20;
          var tooltipID     = '#graphToolTip';
          var contentTitle  = '#graphToolTipTitle';
          var contentFooter = '#graphToolTipFooter';

          displayLineTooltip(tooltipID, contentTitle, contentFooter, xPosition, yPosition, d);

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

  var failedPoints = svg.selectAll('.point')
       .data(dataset[1])
       .enter()
       .append('circle')
       .attr('stroke', 'black')
       .attr('stroke-width', '1px')
       .attr('fill', '#B80000')
       .attr('cx', function(d, i) { return xScale(i) + xPadding})
       .attr('cy', function(d, i) { return yScale(d) + yPadding / 3 })
       .attr('r', '5')
       .on('mouseover', function(d) {

          var container = document.getElementById('summaryBuildNumber');
          var topPos = 0;
          var leftPos = 0;
          while(container.tagName != "BODY") {
            topPos += container.offsetTop;
            leftPos += container.offsetLeft;
            container = container.offsetParent;
          }

          var xPosition = parseFloat(d3.select(this).attr('cx')) + leftPos - 10;
          var yPosition = parseFloat(d3.select(this).attr('cy')) + topPos - 10;
          var tooltipID     = '#graphToolTip';
          var contentTitle  = '#graphToolTipTitle';
          var contentFooter = '#graphToolTipFooter';

          displayLineTooltip(tooltipID, contentTitle, contentFooter, xPosition, yPosition, d);

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
   .attr('d', totalLine(dataset[0]))
   .attr('stroke', 'steelblue');

  g.append('path')
   .attr('d', failedLine(dataset[1]))
   .attr('stroke', '#B80000');

  var weeksAgo = 12
  // Create the labels
  svg.selectAll('text')
      .data(dataset[0])
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

  // Create the Axes
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

  // Add grid lines

  svg.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 3  + ')')
      .call(make_y_axis(yScale)
          .tickSize(-w, 0, 0)
          .tickFormat('')
      )
}

function make_y_axis(yScale) {
    return d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10)
}

function displayLineTooltip(tooltipID, contentTitle, contentFooter, xPosition, yPosition, count) {

  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentTitle)
    .text(count + ' builds');

  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentFooter)
    .text('Click for additional data');

    d3.select(tooltipID).classed('hidden', false);
}

function hideTooltip(tooltipID) {

  d3.select(tooltipID).classed('hidden', true);
}
