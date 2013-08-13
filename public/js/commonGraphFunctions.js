/* Create a Y Axis bar */
function make_y_axis(yScale) {
    return d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(10)
}

/* Display a dynamically positioned tooltip on any graph type*/
function displayTooltip(tooltipID, contentTitle, contentFooter, xPosition, yPosition, key, count, units) {

  console.log(key)
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
      if(units == '%' || units == '% failed') {
        return label + count + units
      } else {
        return label + count + ' ' + units
      }
    })


  d3.select(tooltipID)
    .style('left', xPosition + 'px')
    .style('top', yPosition + 'px')
    .select(contentFooter)
    .text('Click for additional data');

    d3.select(tooltipID).classed('hidden', false);
}

/* Hide the dynamic tooltip */
function hideTooltip(tooltipID) {
  d3.select(tooltipID).classed('hidden', true);
}
