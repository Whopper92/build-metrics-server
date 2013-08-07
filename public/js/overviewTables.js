/* Creates the modals which are triggered by hovering
over any table row on the overview dashboard */
function createTableRowModal(rowID, modalContent) {
  var container = document.getElementById(rowID.id);
  var topPos = 0;
  var leftPos = 0;
  while(container.tagName != "BODY") {
    topPos   += container.offsetTop - 25;
    leftPos  += container.offsetLeft + 10;
    container = container.offsetParent;
  }

  d3.select('#tableModal')
    .style('left', leftPos + 'px')
    .style('top', topPos + 'px')
    .select('#tableModalTitle')
    .text(modalContent)

    console.log(modalContent)
  d3.select('#tableModal')
    .style('left', leftPos + 'px')
    .style('top', topPos + 'px')
    .select('#tableModalFooter')
    .text('Click for additional data');

    d3.select('#tableModal').classed('hidden', false);
}

function removeTableModal() {
  d3.select('#tableModal').classed('hidden', true);
}
