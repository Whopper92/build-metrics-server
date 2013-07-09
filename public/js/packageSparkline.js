function createRecentSparkline(dataset, divid) {

  dataset = dataset.reverse();
  console.log(dataset)
  var width  = screen.width;
  var height = screen.height;
  console.log(width)
  if(width <  1900) {
    w = 180
  } else {
    w = 350
  }

  h = 20

  margin = 5,
  y = d3.scale.linear().domain([0, d3.max(dataset)]).range([0 + margin, h]),
  x = d3.scale.linear().domain([0, dataset.length]).range([0 + margin, w])

  var vis = d3.select(divid)
      .append("svg:svg")
      .attr('class', 'sparklineTrend')
      .attr("width", w)
      .attr("height", h)

  var g = vis.append("svg:g")
      .attr("transform", "translate(0, 25)");

  var line = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d) { return -1 * y(d); })

  g.append("svg:path").attr("d", line(dataset));
}

