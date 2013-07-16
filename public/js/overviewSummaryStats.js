function createBuildTimeSeriesGraph(dataset) {

  var screenWidth  = screen.width;
  var screenGeight = screen.height;
  if(screenWidth <  1900) {
    var w           = 280
    var h           = 280
    var textPadding = 55
  } else {
    var w           = 500
    var h           = 480
    var textPadding = 70
  }

  var xPadding = 30
  var yPadding = 40
  console.log(dataset.length)

  var xScale = d3.scale.ordinal()
                 .domain(d3.range(dataset.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(dataset, function(d) {
                    return parseInt(JSON.parse(d)) + 10
                  })])
                .range([h - yPadding, 0]);

  var svg = d3.select('#summaryBuildNumberContent')
      .append("svg:svg")
      .attr("width", w)
      .attr("height", h)

  var g = svg.append("svg:g")
      .attr("transform", "translate(0, 25)");

  var line = d3.svg.line()
      .interpolate('cardinal')
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
        return yScale(d);
      })

var points = svg.selectAll(".point")
         .data(dataset)
         .enter()
         .append("svg:circle")
         .attr("stroke", "black")
         .attr("fill", function(d, i) { return "steelblue" })
         .attr("cx", function(d, i) { return xScale(i) + xPadding})
         .attr("cy", function(d, i) { return yScale(d) + yPadding - 14 })
         .attr("r", function(d, i) { return 5 })
         .on('mouseover', function(d) {
            d3.select(this)
              .transition()
              .duration(250)
              .attr('fill', 'yellow')
              .attr('cursor', 'pointer')
          })
         .on('mouseout', function(d) {
           d3.select(this)
             .transition()
             .duration(250)
             .attr('fill', 'steelblue');
         })

  g.append("svg:path")
   .attr("d", line(dataset))
   .attr('stroke', 'steelblue');

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
