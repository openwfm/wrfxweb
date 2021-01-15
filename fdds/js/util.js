/** Makes given element draggable from sub element with id "subID" */
export function dragElement(elmnt, subID) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var elmntLeft = 0, elmntTop = 0;
  var clientWidth = document.body.clientWidth, clientHeight = document.body.clientHeight;
  if (clientWidth < 769) return;
  document.getElementById(elmnt.id + subID).onpointerdown = dragMouseDown;
  window.addEventListener("resize", () => {
    let offsetLeft = clientWidth - document.body.clientWidth;
    if (elmntLeft != 0 && elmnt.offsetLeft + (elmnt.clientWidth / 2) > (document.body.clientWidth / 2) && (elmntLeft - offsetLeft) > 0) {
      elmntLeft = elmntLeft - offsetLeft; 
      elmnt.style.left = elmntLeft + "px";
    }
    let offsetTop = clientHeight - document.body.clientHeight;
    if (elmntTop != 0 && elmnt.offsetTop + (elmnt.clientHeight / 2) > (document.body.clientHeight / 2) && (elmntTop - offsetTop) > 0 && (elmntTop - offsetTop + elmnt.clientHeight) < document.body.clientHeight) {
      elmntTop = elmntTop - offsetTop;
      elmnt.style.top = elmntTop + "px";
    }
    clientWidth = document.body.clientWidth;
    clientHeight = document.body.clientHeight;
  })

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onpointerup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onpointermove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (elmntLeft == 0) {
      elmntLeft = elmnt.offsetLeft;
      elmntTop = elmnt.offsetTop;
    }
    // set the element's new position:
    if (Math.abs(pos1) >= 1 && elmntLeft - pos1 > 0 && elmntLeft + elmnt.clientWidth - pos1 < clientWidth) {
      elmntLeft = elmntLeft - pos1;
      elmnt.style.left = elmntLeft + "px";
    }
    if (Math.abs(pos2) >= 1 && elmntTop - pos2 > 0 && elmntTop + elmnt.clientHeight - pos2  < clientHeight) {
      elmntTop = elmntTop - pos2;
      elmnt.style.top = elmntTop + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onpointerup = null;
    document.onpointermove = null;
  }
}
