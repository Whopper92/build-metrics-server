function createBuildTimeSeriesGraph(dataset) {

  var screenWidth  = screen.width;
  var screenGeight = screen.height;
  if(screenWidth <  1900) {
    var w           = 260
    var h           = 260
    var textPadding = 55
  } else {
    var w           = 460
    var h           = 460
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
         .attr("fill", 'steelblue')
         .attr("cx", function(d, i) { return xScale(i) + xPadding})
         .attr("cy", function(d, i) { return yScale(d) + yPadding - 14 })
         .attr('r', '5')
         .on('mouseover', function(d) {
            d3.select(this)
              .transition()
              .duration(250)
              .attr('r', '10')
              .attr('cursor', 'pointer')
          })
         .on('mouseout', function(d) {
           d3.select(this)
             .transition()
             .duration(250)
             .attr('r', '5')
         })

  g.append("svg:path")
   .attr("d", line(dataset))
   .attr('stroke', 'steelblue');

  var weeksAgo = 12
  // Create the labels
  svg.selectAll('text')
      .data(dataset)
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

  svg.append("g")
      .attr("class", "grid")
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 3  + ')')
      .call(make_y_axis(yScale)
          .tickSize(-w, 0, 0)
          .tickFormat("")
      )
}

function make_y_axis(yScale) {
    return d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(10)
}

function createShippedGraph(dataset) {

  console.log(dataset)
  var screenWidth  = screen.width;
  var screenGeight = screen.height;
  if(screenWidth <  1900) {
    var w           = 110
    var h           = 260
    var textPadding = 20
  } else {
    var w           = 200
    var h           = 460
    var textPadding = 40
  }

  var xPadding = 30
  var yPadding = 40

// Set X and Y scales for dynamic data handling
  var xScale = d3.scale.ordinal()
              .domain(d3.range(dataset.length))
              .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
              .domain([0, d3.max(dataset, function(d) {
                return parseInt(JSON.parse(d).count
              )})])
              .range([h - yPadding, 0]);

  // Create the SVG canvas
  var svg = d3.select('#summaryShippedContent')
              .append('svg')
              .attr({width: w, height: h });

  // Create the package build time bars
  svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'histoBar')
    .attr('x', function(d, i) {
      return xScale(i) + xPadding;
     })
    .attr('y', function(d) {
      return yScale(JSON.parse(d).count) + yPadding / 2;
    } )
    .attr('height', function(d) {
      return h - yScale(JSON.parse(d).count) - yPadding;
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
        return JSON.parse(d).type
      })
      .attr('x', function(d, i) {
        return xScale(i) + xPadding + textPadding
      })
      .attr('y', function(d) {
        return h - 5
      })
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '');

  // Create the Axes
  var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

  svg.append('g')
      .attr('class', 'x axis xhistoAxis invisAxis')
      .attr('transform', 'translate('+ xPadding +','+ (h - (yPadding - 20)) + ')')
      .call(xAxis)

  var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

  svg.append('g')
      .attr('class', 'y axis yhistoAxis')
      .attr('transform', 'translate('+ xPadding +','+ yPadding / 2 + ')')
      .call(yAxis)

}
