/* Create a Y Axis bar */
function make_y_axis(yScale) {
    return d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10)
}

/* Generate a label string */
function getLabelString(data) {
 var months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  var month_num = JSON.parse(data).key.slice(5,7)
  var month     = months[parseInt(month_num) - 1]
  return month + ' ' + JSON.parse(data).key.slice(0,4)
}

/* Display a dynamically positioned tooltip on any graph type*/
function displayTooltip(tooltipID, contentTitle, contentFooter, xPosition, yPosition, key, count, units) {
  if(key == '') {
    var label = ''
  } else {
    var label = key + ': '
  }

  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentTitle)
    .text(function() {
      if(units == '%' || units == '% Failed') {
        return label + count + units
      } else {
        return label + count + ' ' + units
      }
    })


  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')

    d3.select(tooltipID).classed('hidden', false);
}

/* Hide the dynamic tooltip */
function hideTooltip(tooltipID) {
  d3.select(tooltipID).classed('hidden', true);
}
