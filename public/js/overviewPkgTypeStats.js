// Functions to create D3 graphs relating to build hosts and package types
function createDistNumbersGraph(data) {

  console.log(data)
  var w           = 350
  var h           = 460
  var textPadding = 70
  var xPadding    = 40
  var yPadding    = 30

  // Set X and Y scales for dynamic data handling
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(data.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(data, function(d) {
                    return parseInt(JSON.parse(d).num) + 20
                  })])
                .range([h - yPadding, 0]);

  // Create the SVG canvas
  var svg = d3.select('#typeBuildNumberContent')
              .append('svg')
              .attr({width: w, height: h})
              .style('margin-left', '-15px');

  // Create the Bars
  svg.selectAll('rect')
     .data(data)
     .enter()
     .append('rect')
     .attr('class', 'histoBar')
     .attr('x', function(d, i) {
      return xScale(i) + xPadding;
     })
     .attr('y', function(d) {
      return yScale(JSON.parse(d).num) + yPadding / 3;
     })
     .attr('height', function(d) {
       console.log(h - yScale(JSON.parse(d).num))
       return h - yScale(JSON.parse(d).num) - yPadding;
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
      .data(data)
      .enter()
      .append('text')
      .text(function(d) {
        return JSON.parse(d).type
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

function createDistAvgSpeedGraph(data) {

  console.log(data)
  var screenWidth  = screen.width;
  var screenHeight = screen.height;
  if(screenWidth < 1900) {
    var w           = 180
    var h           = 280
    var textPadding = 55
  } else {
  }

  var w           = 350
  var h           = 460
  var textPadding = 70
  var xPadding    = 40
  var yPadding    = 30

  // Set X and Y scales for dynamic data handling
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(data.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(data, function(d) {
                    return parseInt(JSON.parse(d).avgSpd) + 20
                  })])
                .range([h - yPadding, 0]);

  // Create the SVG canvas
  var svg = d3.select('#typeBuildSpeedContent')
              .append('svg')
              .attr({width: w, height: h})
              .style('margin-left', '-20px');

  // Create the Bars
  svg.selectAll('rect')
     .data(data)
     .enter()
     .append('rect')
     .attr('class', 'histoBar')
     .attr('x', function(d, i) {
      return xScale(i) + xPadding;
     })
     .attr('y', function(d) {
      return yScale(JSON.parse(d).avgSpd) + yPadding / 3;
     })
     .attr('height', function(d) {
       console.log(h - yScale(JSON.parse(d).avgSpd))
       return h - yScale(JSON.parse(d).avgSpd) - yPadding;
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
      .data(data)
      .enter()
      .append('text')
      .text(function(d) {
        return JSON.parse(d).type
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
