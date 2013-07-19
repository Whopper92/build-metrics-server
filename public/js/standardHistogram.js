function createHistogram(dataset, width, height, txtPadding, yAxisPadding, divid) {

  var w           = width
  var h           = height
  var textPadding = txtPadding
  var xPadding    = 40
  var yPadding    = 30

  // Set X and Y scales for dynamic data handling
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(dataset.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(dataset, function(d) {
                  if(divid == '#typeBuildSpeedContent') {
                    return parseInt(JSON.parse(d).avgSpd) + yAxisPadding
                  } else {
                    return parseInt(JSON.parse(d).count) + yAxisPadding
                  }
                  })])
                .range([h - yPadding, 0]);

  // Create the SVG canvas
  var svg = d3.select(divid)
              .append('svg')
              .attr({width: w, height: h})
              .style('margin-left', '-15px');

  // Create the Bars
  svg.selectAll('rect')
     .data(dataset)
     .enter()
     .append('rect')
     .attr('class', 'histoBar')
     .attr('x', function(d, i) {
      return xScale(i) + xPadding;
     })
     .attr('y', function(d) {
       if(divid == '#typeBuildSpeedContent') {
         return yScale(JSON.parse(d).avgSpd) + yPadding / 3;
       } else {
         return yScale(JSON.parse(d).count) + yPadding / 3;
       }
     })
     .attr('height', function(d) {
       console.log(h - yScale(JSON.parse(d).count))
       if(divid == '#typeBuildSpeedContent') {
         return h - yScale(JSON.parse(d).avgSpd) - yPadding;
       } else {
         return h - yScale(JSON.parse(d).count) - yPadding;
       }

     })
     .attr('width', xScale.rangeBand())
     .attr('fill', 'steelblue')
     .attr('fill-opacity', '0.7')
     .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(250)
          .attr('fill-opacity', '1');
      })
     .on('mouseout', function(d) {
       d3.select(this)
         .transition()
         .duration(250)
         .attr('fill-opacity', '0.6');
      });

  // Create the labels
  svg.selectAll('text')
      .data(dataset)
      .enter()
      .append('text')
      .text(function(d) {
        return JSON.parse(d).key
      })
      .attr('x', function(d, i) {
        return xScale(i) + textPadding;
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
}
