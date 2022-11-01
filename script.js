///// SETTINGS /////
let peelCount = 20;
const peelSlipThreshold = 3;
const dupePeriod = 50;


///// DEFS /////
let bananaCascade = false;
let peelDuped = false;
let peelRip = false;
const peelURL = 'https://i.imgur.com/DMcSYjr.png';
const peelH = 64;
const peelLen = 100; // match with css '.peel'
const peelHitbox = [68, 83, -1, 13]; // minx, maxx, miny, maxy
/** Mouse coords. */
const mXY = [0, 0];
/** Flag to let other peels move cbx only after it has moved on its own. */
let cbxTickled = false;
/** Active object that's being dragged. */
let dragged;
let throttle = false;


///// ELEMENT REFS /////
const peelEl = document.getElementById('peel0');
const peelLayerEl = document.getElementById('peel-layer');
const trashEl = document.getElementById('trashcan');
const unsubCbxEl = document.getElementById('unsub-cbx');
const unsubBtnEl = document.getElementById('unsub-btn');


///// MAIN /////
movePeelToCheckbox(peelEl); // original peel already exists out of window, sets it loc to cbx
peelEl.addEventListener('mousemove', mmPeel);
peelEl.addEventListener('mousedown', mdPeel);
peelEl.addEventListener('dragstart', e => { dragged = e.target; });
createOtherPeels();

/** Trigger the banana cascade on mouseenter on div outer. */
document.getElementById('outer').addEventListener('mouseenter', () => {
  if (!bananaCascade) {
    bananaCascade = true;
    trashEl.classList.remove('hidden');

    for (let i = 1; i <= peelCount; i++) { // throw the others in  
      const p = document.getElementById('peel' + i);
      movePeel(p, true);
    }
  }
});


/**  mouseenter on checkbox, moves cbx if peel's not discarded. */
unsubCbxEl.addEventListener('mouseenter', (e) => {
  if (!peelRip) {
    if (!cbxTickled) {
      cbxTickled = true;
      unsubCbxEl.classList.add('checkbox-unchained');
    }
    moveCbx();

    if (peelDuped) {
      peelDuped = false;
      peelEl.style.width = '0px';
      movePeelToCheckbox(peelEl);
      return;
    }

    peelEl.style.width = peelLen + 'px'; // recall peel
    peelEl.style.left = e.screenX - peelLen / 2 + 'px'; // center peel on mouse rather than cbx
    peelEl.style.top = e.screenY - 2 * peelH + 'px'; // center peel on mouse rather than cbx
    peelEl.style.transform = `rotate(${Math.random()}turn)`;

    setTimeout(() => {  // send peel behind cbx if mouse near peel
      checkDupe(peelEl.getBoundingClientRect(), mXY);
      if (!peelDuped) {
        movePeelToCheckbox(peelEl);
        peelEl.style.width = '0px';
      }
    }, dupePeriod);
  }
});


/** Toggle unsub button on checkbox tick. */
unsubCbxEl.addEventListener('change', () => {
  unsubCbxEl.checked
    ? (unsubBtnEl.disabled = false)
    : (unsubBtnEl.disabled = true);
});


/** *click* event on unsub button. */
unsubBtnEl.addEventListener('click', () => { fin(); });


/** Track mouse coords (to check if mouse is near when cbx is triggered). */
document.body.addEventListener('mousemove', (e) => {
  mXY[0] = e.clientX;
  mXY[1] = e.clientY;
});

// Drag events.
trashEl.addEventListener('dragenter', () => { trashEl.classList.add('wiggle'); });
trashEl.addEventListener('dragover', (e) => { e.preventDefault(); });
trashEl.addEventListener('dragleave', () => { trashEl.classList.remove('wiggle'); });


/** Remove peel from DOM on *drag drop*. */
trashEl.addEventListener('drop', (e) => {
  trashEl.classList.remove('wiggle');
  if (dragged) {
    if (dragged == peelEl) {  // if the original peel's dropped, destroy rest, enable cbx
      peelRip = true;
      peelEl.classList.add('hidden');
      trashEl.classList.add('hidden');
      unsubCbxEl.classList.remove('checkbox-unchained');
      setTimeout(() => {
        peelEl.style.width = '0px';
        movePeelToCheckbox(peelEl);
      }, 1000);
      removeAllPeels();
      // for (let i = 1; i <= peelCount; i++) {  // destroy remaining peels
      //   const el = document.getElementById('peel' + i);
      //   if (el) {
      //     el.style.transition = '1000ms';
      //     movePeel(el, true);
      //     el.style.width = '0px';
      //     setTimeout(() => { el.remove(); }, 1000);
      //   }
      // }
      return;
    }
    dragged.remove();
  }
});


/** Crates other peels. */
function createOtherPeels() {
  for (let i = 1; i <= peelCount; i++) {
    const img = document.createElement('img');
    img.id = 'peel' + i;
    img.src = peelURL;
    img.classList.add('peel');
    peelLayerEl.appendChild(img);
    img.addEventListener('mousemove', mmPeel);
    img.addEventListener('mousedown', mdPeel);
    img.addEventListener('dragstart', e => { dragged = e.target; });
    img.addEventListener('dragend', e => { dragged = undefined; });
  }
}


/** *mousedown* on peels, move peel if click's not on stalk. */
function mdPeel(e) {
  if ( // hit stalk
    e.offsetX > peelHitbox[0] &&
    e.offsetX < peelHitbox[1] &&
    e.offsetY > peelHitbox[2] &&
    e.offsetY < peelHitbox[3]
  ) {
    console.log('Hit!');
  } else {
    e.preventDefault();
    movePeel(e.target, true);
  }
}


/** *mousemove* on peels, moves peels to a new loc if movement is too fast. */
function mmPeel(e) {
  if (throttle) return;
  throttle = true;
  setTimeout(() => (throttle = false), 20);

  const movement = Math.abs(e.movementX) + Math.abs(e.movementY);
  if (movement >= peelSlipThreshold) movePeel(e.target, true);
}


/** Move given peel to a random location within window. */
function movePeel(el, rotate = false) {
  const range = [window.innerWidth - peelLen * 1.1, window.innerHeight - peelLen];
  const newLoc = [rng(0, range[0]), rng(0, range[1])];
  el.style.left = newLoc[0] + 'px';
  el.style.top = newLoc[1] + 'px';
  if (rotate) {
    const newRot = Math.random() * 10;
    el.style.transform = `rotate(${newRot}turn)`;
  }
  // Move cbx and hide 'da peel' behind cbx if any other peel's slipped
  if (cbxTickled && el != unsubCbxEl) {
    moveCbx();
    setTimeout(() => {
      peelDuped = false;
      movePeelToCheckbox(peelEl);
      peelEl.style.width = '0px';
    }, 100);
  }
}


/** Moves checkbox to a new loc. */
function moveCbx() {
  movePeel(unsubCbxEl);
}


/** Set peel location to the checkbox's. */
function movePeelToCheckbox(el) {
  const cbxdims = unsubCbxEl.getBoundingClientRect();
  el.style.top = cbxdims.top + cbxdims.height / 2 + 'px';
  el.style.left = cbxdims.left + cbxdims.width / 2 + 'px';
  el.style.transform = `rotate(${Math.random() * 10}turn)`;
}

/** Fin or is it? */
function fin() {
  peelDuped = false;
  cbxTickled = false;
  peelRip = false;
  peelEl.classList.remove('hidden');
  trashEl.classList.remove('hidden');
  unsubCbxEl.checked = false;
  unsubBtnEl.disabled = true;
  peelCount *= 2;
  createOtherPeels();
  setTimeout(() => {
    for (let i = 1; i <= peelCount; i++) { // throw the others in  
      const p = document.getElementById('peel' + i);
      movePeel(p, true);
    }
  }, 200);
}


/**
 * Sets *peelDuped* to *false* if mouse is not located near the peel after moving cbx.
 * @param {*} rect DOMRect object (of the peel)
 * @param {*} xy xy coords of mouse (2d array)
 */
function checkDupe(rect, xy) {
  if (
    xy[0] < rect.left ||
    xy[0] > rect.right ||
    xy[1] < rect.top ||
    xy[1] > rect.bottom
  )
    peelDuped = true;
  else
    peelDuped = false;
}

/** Remove all aux peels. */
function removeAllPeels() {
  for (let i = 1; i <= peelCount; i++) {
    const el = document.getElementById('peel' + i);
    if (el) {
      el.style.transition = '1000ms';
      movePeel(el, true);
      el.style.width = '0px';
      setTimeout(() => { el.remove(); }, 1000);
    }
  }
}

/** Inclusive integer rng. */
function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


