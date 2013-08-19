/* Creates a line graph for individual package build speed trends*/
function createPackageSpeedLineGraph(dataset, width, height, txtPadding, divID, graphID, units) {
  /* Define variables for use with graph generation*/
  console.log(dataset)
  var w           = width
  var h           = height
  var textPadding = txtPadding
  var xPadding    = 30
  var yPadding    = 110

  /* D3 scales used in graph generation */
  var xScale = d3.scale.ordinal()
                 .domain(d3.range(dataset.length))
                 .rangeRoundBands([0, w - xPadding], 0.05);

  var yScale = d3.scale.linear()
                 .domain([0, d3.max(dataset, function(d) {
                    if(units == '% Failed') {
                      return 100
                    } else {
                      return parseInt(JSON.parse(d).avg) + 50
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

  var line = d3.svg.line()
      .x(function(d,i) { return xScale(i) + xPadding; })
      .y(function(d) {
        if(units == '% Failed') {
          return yScale(JSON.parse(d).failureRate) + 10;
        } else {
          return yScale(JSON.parse(d).avg) + 10;
        }
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
          } else {
            return yScale(JSON.parse(d).avg) + 35
          }
        })
       .attr('r', '5')
       .on('mouseover', function(d) {
          if(units == '% Failed') {
            displayLabel = JSON.parse(d).failureRate.toFixed(0)
          } else {
            displayLabel = JSON.parse(d).avg.toFixed(2)
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

/* Generate a label string */
function getLabelString(data) {
 var months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 var month_num = JSON.parse(data).key.slice(5,7)
 var month     = months[parseInt(month_num) - 1]
 return month + ' ' + JSON.parse(data).key.slice(0,4)
}
