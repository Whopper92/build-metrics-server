/* Creates the sparklines present in the recent builds graphic
on the overview dashboard. Requires a divid to allow for dynamic
positioning */
function createRecentSparkline(dataset, divid) {
  dataset = dataset.reverse();
  var w = 350
  var h = 20

  var margin = 5
  var xScale = d3.scale.linear()
            .domain([0, dataset.length])
            .range([0 + margin, w]);

  var yScale = d3.scale.linear()
            .domain([0, d3.max(dataset)])
            .range([0 + margin, h]);

  var vis = d3.select(divid)
      .append('svg')
      .attr('class', 'sparklineTrend')
      .attr('width', w)
      .attr('height', h)

  var g = vis.append("svg:g")
      .attr('transform', 'translate(0, 25)');

  var line = d3.svg.line()
      .x(function(d,i) { return xScale(i); })
      .y(function(d) {
        return -1 * yScale(d);
      })

  g.append('path')
   .attr('d', line(dataset))
   .attr('stroke', 'steelblue');
}

