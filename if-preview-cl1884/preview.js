// instantiate non-editable labAd.preview properties

// array of objects with details on supported conditions
labAd.preview.conditions = [];
// index of currently displayed condition
labAd.preview.conditionsIndex = 0;
// currently selected mode:  null = unset, 'layout' (colored divs) or 'overlay' for images
labAd.preview.mode =  null;
// device sizes supported for each mode
labAd.preview.sizes = {
  layout:['sm','md', 'lg', 'xl'],
  overlay:['sm', 'lg']
};


// Init Methods
labAd.preview.init = function() {
  try {
    logTime('labAd.preview.init');
    // get preview mode from hash or default to overlay
    labAd.preview.mode = (labAd.test.HashParts[5] != undefined) ? labAd.test.HashParts[5] : 'o';
    labAd.preview.mode = (labAd.preview.mode === 'o') ? 'overlay' : 'layout';

    // get adCond based on cnd and dynght values. Needed earlier than normal since it's used to determine initial ui overlay img to display.
    // NOTE: to simulate #adstest and follow naming convention, preview.adCond has '+' delimiter instead of '-'
    labAd.preview.adCond = labAd.macros.cnd + '+' + labAd.macros.dynght;

    // HTML: get refs to main preview containers.
    // Main container divs are opacity 0 or display:none until preview images have preloaded
    labAd.els.previewMain = document.getElementById('previewMainContainer');
    labAd.els.previewAlt = document.getElementById('previewAltContainer');

    // HTML: append markup to support either overlay (images) or layout (boxes) depending on sz from hash
    if (labAd.preview.mode === 'overlay') {
      labAd.preview.initOverlayMode();
    } else { // use previewAppLayout and children
      labAd.preview.initLayoutMode();
    }

    // Process Preview Images: test conditions are extracted from images where the id value begins with "ui-".
    // All img.src values need to be adjusted for selected device size.
    labAd.preview.images.forEach(function(img){
      // split img.src into array so parts can be used to adjust size and generate condition nav details
      var aSrc = img.src.split('-');
      // create object from array indices and id
      var iProps = {sz: aSrc[0], type: aSrc[1], condName:'', condValue:'', id: img.id};
        // size - adjust size and update src if needed
        if (iProps.sz != 'all' && iProps.sz != labAd.deviceSize) {
          // adjust to match device size
          iProps.sz = labAd.deviceSize;
          // re-assemble src value with updated size value
          aSrc[0] = iProps.sz;
          img.src = aSrc.join('-');
        }

        // populate labAd.preview.conditions for imgs where type = ui
        if (iProps.type === 'ui') {
          // create new array from everything after sz & type
          var aLabel = aSrc.slice(2);
          // condName - convert each word in array to uppercase & remove file extension
          aLabel.forEach(function(word){
            // remove file extension if present by finding the dot and removing everything after it
            var dotSpot = word.indexOf('.');
            if (dotSpot != -1) {
              word = word.substring(0, dotSpot);
            }
            // capitalize the word and add to condName string
            iProps.condName += word.charAt(0).toUpperCase() + word.slice(1) + ' ';
          });
          // condValue - trim the 'ui-' prefix to leave the adstest cond value
          iProps.condValue = img.id.substring(3);
          // save entire object for use in Cond Nav
          labAd.preview.conditions.push(iProps);
        }
    });

    // HTML: append previewAdContainer to rightCol and move labAdDiv there
    labAd.els.previewColRight = document.getElementById('previewColRight');
    // create container for labAdDiv in preview context - needed for abs position
    labAd.els.previewAd = document.createElement('div');
    labAd.els.previewAd.id = 'previewAdContainer';
    labAd.els.previewAd.className = labAd.deviceSize + ' ' + labAd.preview.mode;
    labAd.els.previewColRight.appendChild(labAd.els.previewAd);
    // move labAdDiv to previewAdContainer in right column
    labAd.els.previewAd.appendChild(labAd.els.labAdDiv);

  ////////////////////////////////////////////////////////////////
  // 2: create global admob object with dispatchAppEvent method //
  ////////////////////////////////////////////////////////////////
    admob = {
      events:{
        dispatchAppEvent: function(sEventName, sData){
          // this method will be called more than once per ad impression. Example: adIM and adBg/adBgVid.
          labAd.log({label: 'admob.dispatchAppEvent: '+ sEventName, detail: sData, type: 'log' });
          // apply bg based on app event called
          if (sEventName === 'adBgIntF') {
            // place adBg image in rightCol - places BG image or video into new structure.
            labAd.els.previewBg = document.createElement('img');
            labAd.els.previewBg.id = 'previewBg';
            labAd.els.previewBg.className = labAd.deviceSize + ' ' + labAd.preview.mode;
            labAd.els.previewColRight.appendChild(labAd.els.previewBg);
            // Convert string data back to object to since apps will also have to parse. This should help catch any JSON errors.
            var oData = JSON.parse(sData);
            labAd.els.previewBg.src = oData.baseURL + oData.imgID;
          }
          if (sEventName === 'adBgVidIntF') {
            // place video element in previewAdContainer with adBgVid as src
            labAd.els.previewBgVid = document.createElement('video');
            labAd.els.previewBgVid.id = 'previewBg';
            labAd.els.previewBgVid.className = labAd.deviceSize + ' ' + labAd.preview.mode;
            labAd.els.previewBgVid.loop = true;
            labAd.els.previewBgVid.autoplay = true; // NOTE: video autoplay blocked in Chrome
            labAd.els.previewBgVid.muted = true;
              labAd.els.previewBgVid.playsinline = true;
              labAd.els.previewBgVid.setAttribute('webkit-playsinline', 'webkit-playsinline')
            labAd.els.previewBgVid.controls = false;
            labAd.els.previewBgVid.src = labAd.appBgVid.vidURL;
            labAd.els.previewColRight.appendChild(labAd.els.previewBgVid);
            // when BG vid is ready to start playing
            labAd.els.previewBgVid.oncanplay = function(){
              labAd.log({label: 'BG video ', detail: 'oncanplay fired.', type: 'log' });
              // set timer to stop BG vid playback after 24 seconds to match the app
              setTimeout(function(){
                labAd.els.previewBgVid.pause();
                labAd.log({label: 'BG video ', detail: 'playback stopped after 24 seconds.', type: 'log' });
              }, 23000);
              // remove oncanplay handler to prevent multiple fires
              labAd.els.previewBgVid.oncanplay = null;
          }
        }
      }
      }
    };

    // Init Form Controls //
    labAd.preview.initForm();

    // Preload Preview Images //
    labAd.preview.imgPreload();

    // Resume ad display routine
    initDisplay(labAd.adCond);

    labAd.log({label: 'labAd.preview.init completed: '+labAd.preview, detail: admob, type: 'log' });
  } catch (err) {
    labAd.log({label: 'labAd.preview.init error: ', detail: err, type: 'error', isFatal: true });
  }
}

labAd.preview.initCondNav = function(){
  try {
    // sets the condition nav value & index to match the value from test hash
    labAd.preview.conditions.forEach(function(o, i){
      // check to see which index matches the currently selected condition
      if(o.condValue === labAd.preview.adCond){
        // set current index
        labAd.preview.conditionsIndex = i;
        // if match is found, apply condName to text field
        labAd.els.txtCondName = document.getElementById('txtCondName');
        labAd.els.txtCondName.innerHTML = o.condName;
        // add condition status text
        document.getElementById('previewFormConditionIndex').innerHTML = (i+1) + ' / ' + labAd.preview.conditions.length;
      }
    });
    // Cond Nav Buttons
    labAd.els.btnNextCond = document.getElementById('btnNextCond');
    labAd.els.btnPrevCond = document.getElementById('btnPrevCond');
    labAd.els.btnNextCond.onclick = function(evt){
      labAd.preview.conditionsIndex ++;
      labAd.preview.conditionChange(labAd.preview.conditionsIndex);
    }
    labAd.els.btnPrevCond.onclick = function(evt){
      labAd.preview.conditionsIndex --;
      labAd.preview.conditionChange(labAd.preview.conditionsIndex);
    }

    labAd.log({label: 'labAd.preview.initCondNav ', detail: {cond:labAd.els.txtCondName.innerText, index:labAd.preview.conditionsIndex}, type: 'log' });
  } catch (err) {
    labAd.log({label: 'labAd.preview.initCondNav error: ', detail: err, type: 'error', isFatal: false });
  }
}

labAd.preview.initForm = function() {
  logTime('labAd.preview.initForm');
  try {
    // Dynamic Advertiser Name
    labAd.els.previewFormClientName = document.getElementById('previewFormClientName');
    labAd.els.previewFormClientName.innerHTML = labAd.els.previewFormClientName.innerHTML = labAd.meta.advertiser + '<br>' + labAd.meta.product;

    // Device Size Radio Buttons //
    function radioChangeHandler(event) {
      labAd.preview.sizeChange(this.value);
    }

    // register onchange handlers
    var radios = document.querySelectorAll('input[type=radio][name="deviceSize"]');
    Array.prototype.forEach.call(radios, function(radio) {
       radio.addEventListener('change', radioChangeHandler);
    });

    // set checked radio based on deviceSize - if possible (layout mode has 2 sizes not supported by radios)
    if (labAd.deviceSize === 'lg') {
      document.querySelector('#deviceLarge').checked = true;
    } else if (labAd.deviceSize === 'sm') {
      document.querySelector('#deviceSmall').checked = true;
    }

    // build conditions navigation
    labAd.preview.initCondNav();
    // register kbd shortcuts
    labAd.preview.initKeyboardShortcuts();

    labAd.log({label: 'labAd.preview.initForm ', detail: 'labAd.preview.initForm', type: 'log' });
  } catch (err) {
    labAd.log({label: 'labAd.preview.initForm error: ', detail: err, type: 'error', isFatal: false });
  }
}

labAd.preview.initKeyboardShortcuts = function(){
  try {
    // Register kbd shortcuts
    document.onkeyup = function(e) {
      var key = e.which || e.keyCode;
      // console.log(key, e);
      if (e.shiftKey && key == 37) { // ArrowLeft = prev cond
        labAd.preview.conditionsIndex --;
        labAd.preview.conditionChange(labAd.preview.conditionsIndex);
      } else if (e.shiftKey && key == 38) { // ArrowUp = increase device size
        labAd.preview.sizeChange('up');
      } else if (e.shiftKey && key == 39) { // ArrowRight = next cond
        labAd.preview.conditionsIndex ++;
        labAd.preview.conditionChange(labAd.preview.conditionsIndex);
      } else if (e.shiftKey && key == 40) { // ArrowDown = decrease device size
        labAd.preview.sizeChange('down');
      } else if (e.ctrlKey && e.shiftKey && key == 77) { // Ctrl+Shift+M = toggle preview mode
        labAd.preview.modeChange();
      } else if (labAd.preview.mode === 'overlay' && e.ctrlKey && e.shiftKey && (key == 68 || key == 84)) { // Ctrl+Shift+T = toggle device
        labAd.preview.deviceToggle();
      } else if (e.shiftKey && key == 191) { // ? = display list of shortcuts
        var kbd = 'Keyboard Shortcuts Available\n'
        kbd += '-------------------------------------------\n'
        kbd += '\n'
        kbd += 'Shift + ? = Show kbd shortcuts\n'
        kbd += '\n\n'
        kbd += 'Shift + &rarr; = Next Condition\n'
        kbd += '\n'
        kbd += 'Shift + &larr; = Previous Condition\n'
        kbd += '\n\n'
        kbd += 'Shift + &uarr; = Size Up\n'
        kbd += '\n'
        kbd += 'Shift + &darr; = Size Down\n'
        kbd += '\n\n'
        kbd += 'Shift + Ctrl + M = Toggle Preview Mode\n';
        kbd += '\n'
        kbd += 'Shift + Ctrl + T = Toggle Device Overlay\n\n\n';
        // use helper function to decode special chars (arrows) so they can be displayed in alert
        var decoded = labAd.preview.htmlDecode(kbd);
        alert(decoded);
      }
    };

  } catch (err) {
    labAd.log({label: 'labAd.preview.initKeyboardShortcuts error: ', detail: err, type: 'error', isFatal: false });
  }
}

labAd.preview.initLayoutMode = function() {
	try {
    labAd.els.previewAppLayout = document.getElementById('previewAppLayout');
    labAd.els.previewAppLayout.className = labAd.deviceSize;

    // apply deviceSize className to child elements for this mode
    var previewAppChildEls = labAd.els.previewAppLayout.querySelectorAll('div');
    labAd.preview.setChildClass(previewAppChildEls);

    labAd.log({label: 'labAd.preview.initLayoutMode ', detail: 'success!', type: 'log' });
	} catch (err) {
		labAd.log({label: 'labAd.preview.initLayoutMode error: ', detail: err, type: 'error', isFatal: false });
	}
}

labAd.preview.initOverlayMode = function() {
	try {
    labAd.els.previewAppOverlay = document.getElementById('previewAppOverlay');
    labAd.els.previewAppOverlay.className = labAd.deviceSize;
    labAd.els.previewDeviceOverlay = document.getElementById('previewDeviceOverlay');
    labAd.els.previewDeviceOverlay.style.display = 'block';
    labAd.els.previewUiOverlay = document.getElementById('previewUiOverlay');

    // apply deviceSize className to child elements for this mode
    var previewAppChildEls = labAd.els.previewAppOverlay.querySelectorAll('div');
    labAd.preview.setChildClass(previewAppChildEls);

    // Toggle Device: visibility via Shift+D or hidden button covering top 100px
    labAd.preview.deviceToggle = function(){
      if (labAd.els.previewDeviceOverlay.style.display == 'block') {
        labAd.els.previewDeviceOverlay.style.display = 'none';
      } else {
        labAd.els.previewDeviceOverlay.style.display = 'block';
      }
    };

    // Toggle btn handler
    labAd.els.previewDeviceToggleBtn = document.getElementById('previewDeviceToggleBtn');
    labAd.els.previewDeviceToggleBtn.onclick = labAd.preview.deviceToggle;

    labAd.log({label: 'labAd.preview.initOverlayMode ', detail: 'success!', type: 'log' });
	} catch (err) {
		labAd.log({label: 'labAd.preview.initOverlayMode error: ', detail: err, type: 'error', isFatal: false });
	}
}

// Other methods
labAd.preview.conditionChange = function(n){
  // adjust index if new value is too high or too low
  var maxCond = labAd.preview.conditions.length-1;
  if (n > maxCond) {
    n = 0;
  }else if (n < 0) {
    n = maxCond;
  }
  // save adjusted index value
  labAd.preview.conditionsIndex = n;
  // get condition at new index
  var newCond = labAd.preview.conditions[labAd.preview.conditionsIndex];
  labAd.els.txtCondName.innerHTML = newCond.condName;

  // update location hash parts using condValue
  labAd.test.HashParts[1] = labAd.preview.conditions[labAd.preview.conditionsIndex].condValue.split('+')[0];
  labAd.test.HashParts[2] = labAd.preview.conditions[labAd.preview.conditionsIndex].condValue.split('+')[1];

  // set new hash value and reload page
  window.location.hash = labAd.test.HashParts.join('+');
  window.location.reload();
}

labAd.preview.htmlDecode = function (html) {
  // helper function to decode special chars for display in alert
  var div = document.createElement("div");
  div.innerHTML = html;
  return div.childNodes[0].nodeValue;
}

labAd.preview.imgPreload = function(){
  logTime('labAd.preview.imgPreload');
  try {
    // labAd.preview.imgPreload defines images to load for current mode
    var aPreviewImages = [];
    if (labAd.preview.mode === 'overlay') {
      // add ALL preview images for overlay mode
      labAd.preview.images.forEach(function(img){
        // prepend img.src with img.dir value so its requested from the correct directory
        img.src = labAd.preview.dirs[img.dir] + img.src;
        aPreviewImages.push(img);
      })
    } else if (labAd.preview.mode === 'layout') {
      // add ONLY logo for layout mode
      var logo = labAd.preview.images[0];
      logo.src = labAd.preview.dirs[logo.dir] + logo.src;
      aPreviewImages.push(logo);
    }
    // create batch loading object defining what to load, now long to wait and what to do on success/failure.
    var imgBatch = {
      name: 'previewImages',         // label this batch of imgs. Use camelCase. Avoid dashes, dots, etc.
      imgs: aPreviewImages,            // array of img names
      maxLoadTime: 3000,// how long to wait for everything to load
      cbSuccess: function(){ // callback function to execute once everything loads
        // apply loaded images to DOM elements
        aPreviewImages.forEach(function(img){
          if (img.id === 'logo') {
            document.getElementById('previewFormLogo').src = img.src;
            document.getElementById('previewAltLogo').src = img.src;
          } else if (img.id === 'device') {
            labAd.els.previewDeviceOverlay.style.backgroundImage = 'url("'+ img.src +'")';
          }else if (img.id === 'ui-'+ labAd.preview.adCond){
            labAd.els.previewUiOverlay.style.backgroundImage = 'url("'+ img.src +'")';
          }
        });

        // apply 'preview' class which makes main container visible
        labAd.els.previewMain.className = 'preview ' + labAd.deviceSize;
        labAd.els.previewAlt.className = 'preview ' + labAd.deviceSize;
        labAd.log({label: 'labAd.preview.imgPreload success', detail: aPreviewImages, type: 'log' });
      },
      cbFail: function(){ // callback function to execute on timeout or error
        labAd.log({label: 'labAd.preview.imgPreload failed', detail: aPreviewImages, type: 'error', isFatal:true });
      }
    };

    // load the batch
    imgBatchLoad(imgBatch);

    labAd.log({label: 'labAd.preview.imgPreload ', detail: imgBatch, type: 'log' });
  } catch (err) {
    labAd.log({label: 'labAd.preview.imgPreload error: ', detail: err, type: 'error', isFatal: false });
  }
}

labAd.preview.modeChange = function(){
  if (labAd.preview.mode === 'overlay') {
    labAd.test.HashParts[5] = 'l';
  } else {
    labAd.test.HashParts[5] = 'o';
    // also need to adjust sz when switching to overlay mode since some sizes are not supported
    if (labAd.deviceSize != 'lg' || labAd.deviceSize != 'sm') {
      labAd.test.HashParts[3] = 'lg';
    }
  }
  // set new hash value and reload page
  window.location.hash = labAd.test.HashParts.join('+');
  window.location.reload();
}

labAd.preview.setChildClass = function(nodeList){
  try {
    // add deviceSize as className to all members of nodeList
    nodeList.forEach(function(previewEl){
      previewEl.className = labAd.deviceSize;
    });

    labAd.log({label: 'labAd.preview.setChildClass ', detail: nodeList, type: 'log' });
  } catch (err) {
    labAd.log({label: 'labAd.preview.setChildClass error: ', detail: err, type: 'error', isFatal: false });
  }
}

labAd.preview.sizeChange = function(sz){
  if (sz === 'up' || sz === 'down') {
    var curSize = labAd.test.HashParts[3];
    var curIndex = 0;
    var maxIndex = labAd.preview.sizes[labAd.preview.mode].length -1;
    // find the current index for the mode
    labAd.preview.sizes[labAd.preview.mode].forEach(function(size,index){
      if (size === curSize) {
        curIndex = index;
      }
    });
    // adjust curIndex based on direction
    if (sz === 'up') {
      curIndex++;
    } else {
      curIndex--;
    }
    // adjust if new index falls outside max/min
    if (curIndex > maxIndex) {
      curIndex = 0;
    }else if(curIndex < 0){
      curIndex = maxIndex;
    }
    //  set the new size
    sz = labAd.preview.sizes[labAd.preview.mode][curIndex];
  }

  // update HashParts with new sz = 3rd position
  labAd.test.HashParts[3] = sz;
  // set new hash value and reload page
  window.location.hash = labAd.test.HashParts.join('+');
  window.location.reload();
}
