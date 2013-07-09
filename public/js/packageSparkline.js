function createRecentSparkline(dataset, divid) {

console.log(divid)
dataset = dataset.reverse();
//var data = [3, 6, 2, 7, 5, 2, 1, 3, 8, 9, 2, 5, 7],
w = 160
h = 20

//w = document.getElementById("recentSparkline").offsetWidth
//h = document.getElementById("recentSparkline").offsetHeight

//console.log(dataset)
//console.log(w)
//console.log(h)

margin = 5,
y = d3.scale.linear().domain([0, d3.max(dataset)]).range([0 + margin, h]),
x = d3.scale.linear().domain([0, dataset.length]).range([0 + margin, w])

var vis = d3.select(divid)
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)

var g = vis.append("svg:g")
    .attr("transform", "translate(0, 25)");

var line = d3.svg.line()
    .x(function(d,i) { return x(i); })
    .y(function(d) { return -1 * y(d); })

g.append("svg:path").attr("d", line(dataset));
}

