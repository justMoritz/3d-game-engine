/**
 * Some Performance enhancers:
 *  - cache π, and various calculations involving π
 *    https://stackoverflow.com/questions/8885323/speed-of-the-math-object-in-javascript
 *
 *  - replace parseInt, Math.floor with bitwise NOT operator ~~
 *  - replace parseFloat with bitwise + operator
 *    https://stackoverflow.com/questions/38702724/math-floor-vs-math-trunc-javascript
 *
 *  - TODO: Inline more function calls in high-frequency loops
 *  - TODO: Limit Object Access in high-frequency loops
 */

var gameEngineJS = (function(){

  // constants
  var PI___    = +(Math.PI);
  var PI_0     = 0.0;
  var PIx0_25  = +(PI___ * 0.25);
  var PIx05    = +(PI___ * 0.5);
  var PIx0_75  = +(PI___ * 0.75);
  var PIx1     = PI___;
  var PIx1_5   = +(PI___ * 1.5);
  var PIx2     = +(PI___ * 2.0);
  var I80divPI = (180/PI___)
  var PIdiv4   = PI___ / 4.0

  // setup variables
  var eScreen;
  var eDebugOut;

  var nScreenWidth = 320;
  var nScreenHeight = 80;

  var fFOV = PI___ / 2.25; // (PI___ / 4.0 originally)
  var fDepth = 16.0; // viewport depth
  var nLookLimit = 8;

  var bTurnLeft;
  var bTurnRight;
  var bStrafeLeft;
  var bStrafeRight;
  var bMoveForward;
  var bMoveBackward;
  var bJumping;
  var bFalling;
  var bRunning;
  var bPaused;
  var bPlayerMayMoveForward;

  var nJumptimer = 0;
  var fLooktimer = 0;

  var fDepthBuffer = [];

  // defaults
  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.5;
  var nDegrees = 0;
  var nRenderMode = 2;

  var nMapHeight = 16;
  var nMapWidth = 16;
  var map = "";
  var sLevelstring = "";

  var gameRun;
  var animationTimer = 0;

  // █
  // ▓
  // ▒
  // ░

  var _randomIntFromInterval = function(min, max) { // min and max included
    return ~~(Math.random() * (max - min + 1) + min);
  };


  // generates only pogels that can be placed
  var _generateRandomCoordinates = function(){

    var x = +(_randomIntFromInterval(0, nMapWidth)) + 0;
    var y = +(_randomIntFromInterval(0, nMapHeight)) - 0;

    while( map[ ~~(y) * nMapWidth + ~~(x)] != "." ){
      x = +(_randomIntFromInterval(0, nMapWidth)) + 1;
      y = +(_randomIntFromInterval(0, nMapHeight)) - 1;
    }

    var oCoordinates = {
      "x": x,
      "y": y
    };

    return oCoordinates;
  };


  // generate random Sprites
  var _generateRandomSprites = function( nNumberOfSprites ){
    nNumberOfSprites = nNumberOfSprites || Math.round( nMapWidth * nMapWidth / 15 );
    // generates random Pogels or Obetrls! :oooo
    var oRandomLevelSprites = {};
    for( var m = 0; m < nNumberOfSprites; m++){
      var randAngle = _randomIntFromInterval(0, PIx2);
      var nSpriteRand = _randomIntFromInterval(0,3);
      var randomCoordinates = _generateRandomCoordinates();
      var oRandomSprite = {
          "x": randomCoordinates.x,
          "y": randomCoordinates.y,
          "r": randAngle,
          "name": (nSpriteRand === 1) ? "O" : "P",
          "move": true,
          "speed": _randomIntFromInterval(0, 5) * 0.01,
          "stuckcounter": 0,
      }
      oRandomLevelSprites[m] = oRandomSprite ;
    }
    return oRandomLevelSprites;
  };


  /**
   * Loads
   * @param  {[string]} level The Level file
   * @return {[type]}       [description]
   */
  var _loadLevel = function(level){

    clearInterval(gameRun);

    sLevelstring = level.replace(".map", ""); // sets global string

    var loadScriptAsync = function(uri, sLevelstring) {
      return new Promise(function (resolve, reject) {
        var tag = document.createElement("script");
        tag.src = "assets/" + uri;
        tag.id = sLevelstring;
        tag.async = true;

        tag.onload = function () {
          resolve();
        };

        document.getElementById("map").src = "assets/" + level;
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      });
    };

    var levelLoaded = loadScriptAsync(level, sLevelstring);

    levelLoaded.then(function(){
      // updates the level map and dimensions
      map = window[sLevelstring].map;
      nMapHeight = window[sLevelstring].nMapHeight;
      nMapWidth = window[sLevelstring].nMapWidth;

      // places the player at the map starting point
      fPlayerX = window[sLevelstring].fPlayerX;
      fPlayerY = window[sLevelstring].fPlayerY;
      fPlayerA = window[sLevelstring].fPlayerA;

      // load sprites
      oLevelSprites = window[sLevelstring].sprites;

      if( oLevelSprites == "autogen" ){
        oLevelSprites = _generateRandomSprites();
      }

      document.querySelector("body").style.color = window[sLevelstring].color;
      document.querySelector("body").style.background = window[sLevelstring].background;
    });


    // pauses, then starts the game loop
    _testScreenSizeAndStartTheGame();
    window.addEventListener("resize", function(){
      clearInterval(gameRun);
      _testScreenSizeAndStartTheGame();
    });
  };


  /**
   * Function will get the pixel to be sampled from the sprite
   *
   * @param  {array} texture -     The texture to be sampled
   * @param  {float} x -           The x coordinate of the sample (how much across)
   * @param  {float} y -           The y coordinate of the sample
   * @param  {float} scaleFactor - scales the texture.
   *                               Example: 2 will render twice the resolution
   *                               (texture tiled 4x across one block)
   * @return {string}
   */
  var _getSamplePixel = function(texture, x, y){

    var scaleFactor = texture["scale"]  || defaultTexScale;
    var texWidth    = texture["width"]  || defaultTexWidth;
    var texHeight   = texture["height"] || defaultTexHeight;

    var texpixels = texture["texture"];

    if( texture["texture"] == "DIRECTIONAL" ){
      // Different Texture based on viewport
      if( nDegrees > 0 && nDegrees < 180 ){
        texpixels = texture["S"];
      }else{
        texpixels = texture["N"];
      }
    }

    scaleFactor = scaleFactor || 2;

    x = scaleFactor * x%1;
    y = scaleFactor * y%1;

    var sampleX = ~~(texWidth*x);
    var sampleY = ~~(texHeight*y);

    var samplePosition = (texWidth*(sampleY)) + sampleX;

    if( x < 0 || x > texWidth || y < 0 || y > texHeight ){
      return "+";
    }else{
      return texpixels[samplePosition];
    }
  };


  /**
   * Retrieve a fixed number of elements from an array, evenly distributed but
   * always including the first and last elements.
   *
   * source https://stackoverflow.com/questions/32439437/retrieve-an-evenly-distributed-number-of-elements-from-an-array
   * wow!!!!
   *
   * @param   {Array} items - The array to operate on.
   * @param   {number} n -    The number of elements to extract.
   * @returns {Array}
   */
  // helper function
  function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
  function _evenlyPickItemsFromArray(allItems, neededCount) {
    if (neededCount >= allItems.length) {
      return _toConsumableArray(allItems);
    }

    var result = [];
    var totalItems = allItems.length;
    var interval = totalItems / neededCount;

    for (var i = 0; i < neededCount; i++) {
      var evenIndex = ~~(i * interval + interval / 2);
      result.push(allItems[evenIndex]);
    }

    return result;
  }


  // leaving the console for errors, logging seems to kill performance
  var _debugOutput = function(input){
    eDebugOut.innerHTML = input;
  };


  // returns true every a-th interation of b
  var _everyAofB = function(a, b){
    return ( a && (a % b === 0));
  }


  // lookup-table “for fine-control” or “for perfomance”
  // …(but really because I couldn"t figure out the logic [apparently] )
  var _skipEveryXrow = function(input){
    input = Math.round(input);
    switch( Number(input) ) {
      case 0: return 0; break;
      case 1: return 8; break;
      case 2: return 6; break;
      case 3: return 4; break;
      case 4: return 3; break;
      case 5: return 2; break;
      case 6: return 2; break;
      case 7: return 2; break;
      case 8: return 1; break;

      case -1: return 8; break;
      case -2: return 8; break;
      case -3: return 7; break;
      case -4: return 7; break;
      case -5: return 6; break;
      case -6: return 6; break;
      case -7: return 5; break;
      case -8: return 5; break;
      case -9: return 4; break;
      case -10: return 4; break;
      case -11: return 3; break;
      case -12: return 3; break;
      case -13: return 3; break;
      case -14: return 2; break;
      case -15: return 2; break;
      case -16: return 2; break;

      default:
        return 0;
    }
  };


  /**
   * Determines with Pixels to use, sInput
   * @param  {string} oInput    Main Pixel
   * @param  {string} sOverlay  Overlay Pixel
   * @param  {int} nIndex       Index
   * @return {[string]}         Final Pixel
   */
  var _printCompositPixel = function(sInput, sOverlay, nIndex){
    var sOutput = "";
    // if sOverlay !0, appends it to the output instead
    if( sOverlay && sOverlay[nIndex] != 0){
      sOutput += sOverlay[nIndex];
    }else{
      sOutput += sInput[nIndex];
    }
    return sOutput;
  };


  /**
   * Creates a new array of pixels taking looking up and down into account
   * It returns an array to be rendered later.
   * the aim is to remove the first and last 30 pixels of very row,
   * to obscure the skewing
   */
  var _fPrepareFrame = function(oInput, oOverlay, eTarget){
    var oOverlay = oOverlay || false;
    var eTarget  = eTarget || eScreen;
    var sOutput = [];

    // this is the maximum of variation created by the lookup timer, aka the final lookmodifier value
    var neverMoreThan = Math.round(nScreenHeight / _skipEveryXrow(fLooktimer) - 1);

    // used to skew the image
    var globalPrintIndex = 0;
    var fLookModifier = 0;

    // if looking up, the starting point is the max number of pixesl to indent,
    // which will be decremented, otherwise it remains 0, which will be incremented
    if( fLooktimer > 0 && isFinite(neverMoreThan) ){
      fLookModifier = neverMoreThan;
    }

    // interate each row at a time
    for(var row = 0; row < nScreenHeight; row++){

      // increment the fLookModifier every time it needs to grow (grows per row)
      if ( _everyAofB(row, _skipEveryXrow(fLooktimer)) ) {
        if( fLooktimer > 0 ){ // looking up
          fLookModifier--;
        }else{
          fLookModifier++;
        }
      }

      // print filler pixels
      for(var i=0; i<fLookModifier; i++){
        sOutput.push( "." );
      }

      var toBeRemoved = (2*fLookModifier);
      var removeFrom = [];

      //  make a new array that contains the indices of the elements to print
      // (removes X amount of elements from array)
      var items = [];
      for (var i=0; i<= nScreenWidth; i++) {
        items.push(i);
      }

      // list to be removed from each row:
      // [1,2,3,4,5,6,7,8]
      // [1,2, ,4,5, ,7,8]
      //   [1,2,4,5,7,8]
      removeFrom = _evenlyPickItemsFromArray(items, toBeRemoved);

      // loops through each rows of pixels
      for(var rpix = 0; rpix < nScreenWidth; rpix++){

        // print only if the pixel is in the list of pixels to print
        if( removeFrom.includes(rpix) ){
          // don"t print
        }else{
          // print
          sOutput.push( _printCompositPixel(oInput, oOverlay, globalPrintIndex) );
        }

        globalPrintIndex++;
      } // end for(rpix

      // print filler pixels
      for(var i=0; i<fLookModifier; i++){
        sOutput.push( "." );
      }

    } // end for(row

    return sOutput;
  };


  var _fDrawFrame = function(screen, overlayscreen, target){
    var frame = _fPrepareFrame(screen, overlayscreen);
    var target = target || eScreen;

    var sOutput = "";

    // interates over each row again, and omits the first and last 30 pixels, to disguise the skewing!
    var printIndex = 0;
    var removePixels = nScreenHeight/2;
    for(var row = 0; row < nScreenHeight; row++){
      for(var pix = 0; pix < nScreenWidth; pix++){

        // H-blank based on screen-width
        if(printIndex % (nScreenWidth) == 0){
          sOutput += "<br>";
        }

        if( pix < removePixels ){
          sOutput += "";
        }
        else if( pix > nScreenWidth-removePixels ){
          sOutput += "";
        }
        else{
          sOutput += frame[printIndex];
        }

        printIndex++;
      }
    }
    target.innerHTML = sOutput;
  };


  // various shaders for walls, ceilings, objects
  // _renderHelpers
  //
  // each texture has 4 values: 3 hues plus black
  // each value can be rendered with 5 shades (4 plus black)
  var _rh = {

    renderWall: function(j, fDistanceToWall, sWallDirection, pixel){

      var fill = "";

      var b100 = "&#9608;";
      var b75  = "&#9619;";
      var b50  = "&#9618;";
      var b25  = "&#9617;";
      var b0   = "&nbsp;";

      if( sWallDirection === "N" || sWallDirection === "S" ){

        if(fDistanceToWall < fDepth / 5.5 ){

          if( pixel === "#" ){
            fill = b100;
          }else if( pixel === "7" ){
            fill = b75;
          }else if( pixel === "*" || pixel === "o"){
            fill = b50;
          }else{
            fill = b25;
          }

        }
        else if(fDistanceToWall < fDepth / 3.66 ){

          if( pixel === "#" ){
            fill = b75;
          }else if( pixel === "7" ){
            fill = b50;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 2.33 ){

          if( pixel === "#" ){
            fill = b50;
          }else if( pixel === "7" ){
            fill = b25;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 1 ){

          if( pixel === "#" ){
            fill = b25;
          }else if( pixel === "7" ){
            fill = b25;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else{
          fill = "&nbsp;";
        }
      }

      // walldirection W/E
      else{

        if(fDistanceToWall < fDepth / 5.5 ){

          if( pixel === "#" ){
            fill = b75;
          }else if( pixel === "7" ){
            fill = b50;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 3.66 ){

          if( pixel === "#" ){
            fill = b50;
          }else if( pixel === "7" ){
            fill = b50;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 2.33 ){

          if( pixel === "#" ){
            fill = b50;
          }else if( pixel === "7" ){
            fill = b25;
          }else if( pixel === "*" || pixel === "o"){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 1 ){

          if( pixel === "#" ){
            fill = b25;
          }else if( pixel === "7" ){
            fill = b25;
          }else if( pixel === "*" || pixel === "o"){
            fill = b0;
          }else{
            fill = b0;
          }

        }
        else{
          fill = "&nbsp;";
        }
      }

      return fill;

    },

    // figures out shading for given section
    renderSolidWall: function(j, fDistanceToWall, isBoundary){
      var fill = "&#9617;";

      if(fDistanceToWall < fDepth / 6.5 ){
        fill = "&#9608;";
      }
      else if(fDistanceToWall < fDepth / 4.66 ){
        fill = "&#9619;";
      }
      else if(fDistanceToWall < fDepth / 3.33 ){
        fill = "&#9618;";
      }
      else if(fDistanceToWall < fDepth / 1 ){
        fill = "&#9617;";
      }else{
        fill = "&nbsp;";
      }

      if( isBoundary ){
        if(fDistanceToWall < fDepth / 6.5 ){
          fill = "&#9617;";
        }
        else if(fDistanceToWall < fDepth / 4.66 ){
          fill = "&#9617;";
        }
        else if(fDistanceToWall < fDepth / 3.33 ){
          fill = "&nbsp;";
        }
        else if(fDistanceToWall < fDepth / 1 ){
          fill = "&nbsp;";
        }else{
          fill = "&nbsp;";
        }
      }

      return fill;
    },

    // shading and sectionals for gate
    renderGate: function(j, fDistanceToWall, nDoorFrameHeight){
      var fill = "X";
      if( j < nDoorFrameHeight){

        if(fDistanceToWall < fDepth / 4){
          fill = "&boxH;";
        }
        else{
          fill = "=";
        }

      }else{

        if(fDistanceToWall < fDepth / 4){
          fill = "&boxV;";
        }
        else{
          fill = "|";
        }
      }
      return fill;
    },

    renderFloor: function(j){
      var fill = "`";

      // draw floor, in different shades
      b = 1 - (j -nScreenHeight / 2) / (nScreenHeight / 2);
      b = 1 - (j -nScreenHeight / (2- fLooktimer*0.15)) / (nScreenHeight / (2 - fLooktimer*0.15));

      if(b < 0.25){
        fill = "x";
      }else if(b < 0.5){
        fill = "=";
      }else if(b < 0.75){
        fill = "-";
      }else if(b < 0.9){
        fill = "`";
      }else{
        fill = "&nbsp;";
      }

      return fill;
    },

    renderCeiling: function(j){
      var fill = "`";

      // draw ceiling, in different shades
      b = 1 - (j -nScreenHeight / 2) / (nScreenHeight / 2);
      if(b < 0.25){
        fill = "`";
      }else if(b < 0.5){
        fill = "-";
      }else if(b < 0.75){
        fill = "=";
      }else if(b < 0.9){
        fill = "x";
      }else{
        fill = "#";
      }

      return fill;
    },
  };


  // keyboard and mouse
  var _moveHelpers = {

    // keystroke listening engine
    keylisten: function(){

      window.onkeydown = function(e) {

        // _debugOutput(e.which);

        if (e.which == 80) { // p
          if( bPaused ){
            _testScreenSizeAndStartTheGame();
            bPaused = false;
          }else{
            clearInterval(gameRun);
            bPaused = true;
          }
        }
        if (e.which == 16) { // shift
          bRunning = true;
        }
        if (e.which == 32) { // space
          bJumping = true;
        }
        if (e.which == 65) { // a
          bStrafeLeft = true;
        }
        if (e.which == 68) { // d
          bStrafeRight = true;
        }
        if (e.which == 81 || e.which == 37) { // q or left
          bTurnLeft = true;
        }
        if (e.which == 69 || e.which == 39) { // e or right
          bTurnRight = true;
        }
        if (e.which == 87 || e.which == 38) { // w or up
          bMoveForward = true;
        }
        if (e.which == 83 || e.which == 40) { // s or down
          bMoveBackward = true;
        }
      };

      window.onkeyup = function(e) {

        if (e.which == 16) { // shift
          bRunning = false;
        }
        if (e.which == 32) { // space
          bJumping = false;
          bFalling = true;
        }
        if (e.which == 65) { // a
          bStrafeLeft = false;
        }
        if (e.which == 68) { // d
          bStrafeRight = false;
        }
        if (e.which == 81 || e.which == 37) { // q or left
          bTurnLeft = false;
        }
        if (e.which == 69 || e.which == 39) { // e or right
          bTurnRight = false;
        }
        if (e.which == 87 || e.which == 38) { // w or up
          bMoveForward = false;
        }
        if (e.which == 83 || e.which == 40) { // s or down
          bMoveBackward = false;
        }
      };
    },

    //
    //
    /**
     * Y-Movement
     * @param  {float}  fMoveInput   the movement from touch or mouse-input
     * @param  {float}  fMoveFactor  factor by which to multiply the recieved input
     *
     * Ultimately modifies the `fLooktimer` variable, which is global :)
     */
    yMoveUpdate: function(fMoveInput, fMoveFactor ){
      // look up/down (with bounds)
      var fYMoveBy = fMoveInput * fMoveFactor;

      // if the looktimer is negative (looking down), increase the speed
      if( fLooktimer < 0 ){
        fYMoveBy = fYMoveBy*4;
      }

      // the reason for the increased speed is that looking “down” becomes expotentially less,
      // so we are artificially increasing the down-factor. it's a hack, but it works okay!
      fLooktimer -= fYMoveBy;
      if( fLooktimer > nLookLimit*0.7 || fLooktimer < -nLookLimit*2 ){
        fLooktimer += fYMoveBy;
      }
    },

    mouseLook: function(){
      var fMouseLookFactor = 0.002;

      document.body.requestPointerLock();
      document.onmousemove = function (e) {

        // look left/right
        fPlayerA   += ( (e.movementX*fMouseLookFactor) || (e.mozMovementX*fMouseLookFactor) || (e.webkitMovementX*fMouseLookFactor) || 0);

        // look up and down
        _moveHelpers.yMoveUpdate( ( e.movementY || e.mozMovementY || e.webkitMovementY || 0), 0.05 );
      }
    },

    // mouse
    mouseinit: function(){
      touchinputlook.onclick = _moveHelpers.mouseLook;
      touchinputmove.onclick = _moveHelpers.mouseLook;
    },

    // holds and tracks touch-inputs
    oTouch: {
      move: {
        x: 0,
        y: 0,
        bFirstTouch: true,
      },
      look: {
        x: 0,
        y: 0,
        bFirstTouch: true,
      },
    },

    /**
     * Calculates the difference between touch events fired
     * @param  {object} prev  information about the state
     * @param  {event}  e     the event
     * @return {object}       x and y coordinates
     */
    touchCalculate: function(prev, e){
      var oDifference = {};

      // fetch and compare touch-points
      // always [0] because no multitouch
      var fInputX = e.changedTouches[0].clientX;
      var fInputY = e.changedTouches[0].clientY;

      var differenceX = fInputX - prev.x;
      var differenceY = fInputY - prev.y;

      prev.x = fInputX;
      prev.y = fInputY;

      oDifference = {
        x: differenceX,
        y: differenceY,
      };

      return oDifference;
    },

    // initialize the touch listeners for walk and move areas
    touchinit: function(){

      // look (left hand of screen)
      eTouchLook.addEventListener("touchmove", function(e){

        // fetches differences from input
        var oDifferences = _moveHelpers.touchCalculate( _moveHelpers.oTouch.look, e);

        // makes sure no crazy
        if( oDifferences.x < 10 && oDifferences.x > -10 ){
          _moveHelpers.oTouch.look.bFirstTouch = false;
        }

        if( !_moveHelpers.oTouch.look.bFirstTouch ){

          // left and right
          fPlayerA += oDifferences.x * 0.005;

          // up and down
          _moveHelpers.yMoveUpdate(oDifferences.y, 0.1);
        }
      });

      // reset look
      eTouchLook.addEventListener("touchend", function(){
        _moveHelpers.oTouch.look.x = 0;
        _moveHelpers.oTouch.look.y = 0;
        _moveHelpers.oTouch.look.bFirstTouch = true;
      });

      // move (right hand of screen)
      eTouchMove.addEventListener("touchmove", function(e){
        var oDifferences = _moveHelpers.touchCalculate( _moveHelpers.oTouch.move, e);

        // makes sure no crazy
        if( oDifferences.x < 10 && oDifferences.x > -10 ){
          _moveHelpers.oTouch.move.bFirstTouch = false;
        }

        // first touch will be a huge difference, that"s why we only move after the first touch
        if( !_moveHelpers.oTouch.move.bFirstTouch ){

          // walk
          fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * oDifferences.x * 0.05;
          fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * oDifferences.x * 0.05;

          // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
          if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
            _moveHelpers.checkExit();
            fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * oDifferences.x * 0.05;
            fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * oDifferences.x * 0.05;
          }

          // strafe
          fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * -oDifferences.y * 0.05;
          fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * -oDifferences.y * 0.05;

          // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
          if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
            _moveHelpers.checkExit();
            fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * -oDifferences.y * 0.05;
            fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * -oDifferences.y * 0.05;
          }
        }
      });

      // reset move
      eTouchMove.addEventListener("touchend", function(){
        _moveHelpers.oTouch.move.x = 0;
        _moveHelpers.oTouch.move.y = 0;
        _moveHelpers.oTouch.move.bFirstTouch = true;
      });

    },

    checkExit: function(){
      // if we hit an exit
      if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] == "X"){
        _loadLevel( window[sLevelstring].exitsto );
      }
    },

    // called once per frame, handles movement computation
    move: function(){

      if(bTurnLeft){
        fPlayerA -= 0.05;
      }

      if(bTurnRight){
        fPlayerA += 0.05;
      }

      var fMoveFactor = 0.1;
      if(bRunning){
        fMoveFactor = 0.2;
      }

      if(bStrafeLeft){
        fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
          _moveHelpers.checkExit();
          fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bStrafeRight){
        fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
          _moveHelpers.checkExit();
          fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bMoveForward && bPlayerMayMoveForward){
        fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
          _moveHelpers.checkExit();
          fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bMoveBackward){
        fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if(map[~~(fPlayerY) * nMapWidth + ~~(fPlayerX)] != "."){
          _moveHelpers.checkExit();
          fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

    },
  };


  /**
   * Function that handles movement of all sprites
   */
  var _moveSprites = function(){

    // for each sprite object
    for(var si=0; si < Object.keys(oLevelSprites).length; si++ ){
      var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];

      // if the sprite"s move flag is set
      if( sprite["move"] ){
        // var fMovementSpeed = 0.01;
        var fMovementSpeed = sprite["speed"] || 0.03;

        // move the sprite along it's radiant line
        sprite["x"] = +(sprite["x"]) + +(Math.cos(sprite["r"])) * fMovementSpeed;
        sprite["y"] = +(sprite["y"]) + +(Math.sin(sprite["r"])) * fMovementSpeed;

        // collision coordinates (attempting to center sprite)
        var fCollideY = +(sprite["y"]) - 0.65; // 0.5
        var fCollideX = +(sprite["x"]) + 0.125; // 0.25

        var fCollideY2 = +(sprite["y"]) + 0.425; // 0.25
        var fCollideX2 = +(sprite["x"]) - 0.65; //0.5

        if( map[ ~~(fCollideY) * nMapWidth + ~~(fCollideX)] != "." || map[ ~~(fCollideY2) * nMapWidth + ~~(fCollideX2)] != "." ){

          sprite["stuckcounter"]++;

          // // reverse last movement
          sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * fMovementSpeed*2;
          sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * fMovementSpeed*2;


          // // repeat may help unstuck sprites
          // sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * fMovementSpeed;
          // sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * fMovementSpeed;
          // sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * fMovementSpeed;
          // sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * fMovementSpeed;


          // change the angle and visible angle
          sprite["r"] = (+(sprite["r"]) + PIx1_5 ) % PIx2; // TODO: sometimes buggie

          // if sprite keeps getting stuck, shove it outta there
          if( sprite["stuckcounter"] > 10 ){
            sprite["stuckcounter"] = 0;
            sprite["r"] = 0.5
            sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * 0.5;
            sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * 0.5;

            // sprite["move"]  = false;
            // sprite["x"]  = 0;
            // sprite["7"]  = 0;

          }
        }

        // if sprite is close to the player, and facing the player, turn around
        if( sprite["z"] < 1 && sprite["a"] !== "B" ){
          sprite["r"] = (+(sprite["r"]) + PIx1_5 ) % PIx2;
        }
        // if player hits sprite, prevent moving
        if( sprite["z"] < 0.75 ){
          bPlayerMayMoveForward = false;
        }else{
          bPlayerMayMoveForward = true;
        }

        // TODO: sprites hitting each other
        // for(var sj=0; sj < Object.keys(oLevelSprites).length; sj++ ){
        //   var jsprite = oLevelSprites[Object.keys(oLevelSprites)[sj]];
        //   if( jsprite["z"] - sprite["z"] > 2 ){
        //     jsprite["r"] = (+(sprite["r"]) + PIx1_5 ) % PIx2;
        //   }
        // }

      } // end if sprite move
    }
  };


  /**
   * Sorts List
   */
  function _sortSpriteList( b, a ) {
    if ( a["z"] < b["z"] ){
      return -1;
    }
    if ( a["z"] > b["z"] ){
      return 1;
    }
    return 0;
  }


  /**
   * Sorts the Sprite list based on distance from the player
   */
  var _updateSpriteBuffer = function(){

    // calculates the distance to the player
    for(var si=0; si < Object.keys(oLevelSprites).length; si++ ){
      var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];

      // the distance between the sprite and the player
      var fDistance = Math.hypot(sprite["x"]-fPlayerX, sprite["y"]-fPlayerY);

      sprite["z"] = fDistance;
    }

    // converts array of objects to list
    var newList = [];
    for(var sj=0; sj < Object.keys(oLevelSprites).length; sj++ ){
      newList.push(oLevelSprites[Object.keys(oLevelSprites)[sj]]);
    }

    // sorts the list
    newList = newList.sort( _sortSpriteList );

    // make object from array again
    oLevelSprites = {};
    for(var sk=0; sk < Object.keys(newList).length; sk++ ){
      oLevelSprites[sk] = newList[sk]
    }
  };


  /**
   * The basic game loop
   */
  var main = function(){
    gameRun = setInterval(gameLoop, 33);
    function gameLoop(){

      /**
       * Game-function related
       */

      animationTimer++;
      if(animationTimer > 15){
        animationTimer = 0;
      }

      _updateSpriteBuffer();
      _moveSprites();


      /**
       * Player-movement related
       */

      _moveHelpers.move();

      // normalize player angle
      if (fPlayerA < 0){
        fPlayerA += PIx2;
      }
      if (fPlayerA > PIx2){
        fPlayerA -= PIx2;
      }

      // allows jumping for only a certain amount of time
      if(bJumping){
        nJumptimer++
      }
      if( nJumptimer > 6 ){
        bFalling = true;
        bJumping = false;
        nJumptimer = 6;
      }

      // falling back down after jump
      if(bFalling){
        nJumptimer--;
      }
      if( nJumptimer < 1 ){
        bFalling = false;
      }


      /**
       * Drawing related
       */


      // holds the frames we"re going to send to the renderer
      var screen = [];
      var spritescreen = [];
      var overlayscreen = [];


      // Converts player turn position into degrees (used for texturing)
      nDegrees = ~~( fPlayerA * I80divPI) % 360;


      // for the length of the screenwidth (one frame)
      for(var i = 0; i < nScreenWidth; i++){

        // calculates the ray angle into the world space
        // take the current player angle, subtract half the field of view
        // and then chop it up into equal little bits of the screen width (at the current colum)
        var fRayAngle = (fPlayerA - fFOV / 1.8) + (i / nScreenWidth) * fFOV;

        var bBreakLoop = false;

        var fDistanceToWall = 0;
        var fDistanceToObject = 0;
        var fDistanceToInverseObject = 0;

        var bHitWall = false;

        var bHitObject = false;
        var bHitBackObject = false;

        var sWalltype = "#";
        var sObjectType = "0";

        var fEyeX = Math.cos(fRayAngle); // I think this determines the line the testing travels along
        var fEyeY = Math.sin(fRayAngle);

        var fSampleX = 0.0;
        var sWallDirection = "N";

        var nRayLength = 0.0;

        // var nGrainControl = 0.1;
        var nGrainControl = 0.05;

        /**
         * Ray Casting Loop
         */
        while(!bBreakLoop && nRayLength < fDepth){

          // increment
          nRayLength += nGrainControl;

          if( !bHitObject ){
            fDistanceToObject += nGrainControl;
          }
          if( !bHitBackObject ){
            fDistanceToInverseObject += nGrainControl;
          }
          if( !bHitWall ){
            fDistanceToWall += nGrainControl;
          }

          // ray position
          var nTestX = ~~( ((fPlayerX) + fEyeX * nRayLength) );
          var nTestY = ~~( ((fPlayerY) + fEyeY * nRayLength) );

          // test if ray hits out of bounds
          if(nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight){
            bHitWall = true; // didn"t actually, just no wall there
            fDistanceToWall = fDepth;
            bBreakLoop = true;
          }

          // test for objects
          else if(map[nTestY * nMapWidth + nTestX] == "o" || map[nTestY * nMapWidth + nTestX] == ","){
            bHitObject = true;
            sObjectType = map[nTestY * nMapWidth + nTestX];
          }
          else if(bHitObject == true && map[nTestY * nMapWidth + nTestX] == "." || bHitObject == true && map[nTestY * nMapWidth + nTestX] == "."){
            bHitBackObject = true;
          }

          // Test for walls
          else if( map[nTestY * nMapWidth + nTestX] != "." ){
            bHitWall = true;
            bBreakLoop = true;

            sWalltype = map[nTestY * nMapWidth + nTestX];


            // test found boundries of the wall
            var fBound = 0.01;
            var isBoundary = false;

            var vectorPairList = [];
            for (var tx = 0; tx < 2; tx++) {
              for (var ty = 0; ty < 2; ty++) {
                var vy = +(nTestY) + ty - fPlayerY;
                var vx = +(nTestX) + tx - fPlayerX;
                var d = Math.sqrt(vx*vx + vy*vy);

                var dot = (fEyeX * vx / d) + (fEyeY * vy / d);
                vectorPairList.push([d, dot]);
              }
            }

            vectorPairList.sort((a, b) => {
              return a[0] - b[0];
            })

            if (Math.acos(vectorPairList[0][1]) < fBound) {
              isBoundary = true;
            }
            if (Math.acos(vectorPairList[1][1]) < fBound) {
              isBoundary = true;
            }


            // 1u wide cell into quarters
            var fBlockMidX = (nTestX) + 0.5;
            var fBlockMidY = (nTestY) + 0.5;


            // using the distance to the wall and the player angle (Eye Vectors)
            // to determine the collusion point
            var fTestPointX = fPlayerX + fEyeX * fDistanceToWall;
            var fTestPointY = fPlayerY + fEyeY * fDistanceToWall;


            // now we have the location of the middle of the cell,
            // and the location of point of collision, work out angle
            var fTestAngle = Math.atan2( (fTestPointY - fBlockMidY), (fTestPointX - fBlockMidX) )
            // rotate by pi over 4


            if( fTestAngle >= -PIx0_25 && fTestAngle < PIx0_25 ){
              fSampleX = fTestPointY - +(nTestY);
              sWallDirection = "W";
            }
            if( fTestAngle >= PIx0_25 && fTestAngle < PIx0_75 ){
              fSampleX = fTestPointX - +(nTestX);
              sWallDirection = "N";
            }
            if( fTestAngle < -PIx0_25 && fTestAngle >= -PIx0_75 ){
              fSampleX = fTestPointX - +(nTestX);
              sWallDirection = "S";
            }
            if( fTestAngle >= PIx0_75 || fTestAngle < -PIx0_75 ){
              fSampleX = fTestPointY - +(nTestY);
              sWallDirection = "E";
            }

          }
        } // end ray casting loop


        // at the end of ray casting, we should have the lengths of the rays
        // set to their last value, representing their distances
        // based on the distance to wall, determine how much floor and ceiling to show per column,
        // Adding in the recalc for looking (fLookTimer) and jumping (nJumptimer)
        // // var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
        // // var nCeiling = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / fDistanceToWall;
        var nCeiling = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) - nScreenHeight / fDistanceToWall;
        var nFloor   = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) + nScreenHeight / fDistanceToWall;

        // similar for towers and gates
        var nTower   = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall - 2);
        var nDoorFrameHeight = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall + 2);

        // similar operation for objects
        var nObjectCeiling = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) - nScreenHeight / fDistanceToObject;
        var nObjectFloor = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) + nScreenHeight / fDistanceToObject;
        var nFObjectBackwall = (nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15) ) + (nScreenHeight / (fDistanceToInverseObject + 0) ); // 0 makes the object flat, higher the number, the higher the object :)


        // the spot where the wall was hit
        fDepthBuffer[i] = fDistanceToWall;


        // draw the columns one screenheight-pixel at a time
        for(var j = 0; j < nScreenHeight; j++){

          // sky
          if( j < nCeiling){

            // case of tower block (the bit that reaches into the ceiling)
            if(sWalltype == "T"){
              if( j > nTower ){

                var fSampleY = ( (j - nCeiling + 6) / (nFloor - nCeiling + 6) );

                // screen[j*nScreenWidth+i] = _rh.renderSolidWall(j, fDistanceToWall, isBoundary);
                screen[j*nScreenWidth+i] = _rh.renderWall(j, fDistanceToWall, sWallDirection, _getSamplePixel(textures[sWalltype], fSampleX, fSampleY));
              }else{
                screen[j*nScreenWidth+i] = "&nbsp;";
              }
            }

            // draw ceiling/sky
            else{
              if(sWalltype == ","){
                screen[j*nScreenWidth+i] = "1";
              }else{
                screen[j*nScreenWidth+i] = "&nbsp;";
              }
            }
          }

          // solid block
          else if( j > nCeiling && j <= nFloor ){

            // Door Walltype
            if(sWalltype == "X"){
              screen[j*nScreenWidth+i] = _rh.renderGate(j, fDistanceToWall, nDoorFrameHeight);
            }

            // Solid Walltype
            else if(sWalltype != "." || sWalltype == "T"){

              var fSampleY = ( (j - nCeiling) / (nFloor - nCeiling) );

              /**
               * animation timer example
               */
              // if( animationTimer < 5 ){
              //   screen[j*nScreenWidth+i] = _getSamplePixel(texture, fSampleX, fSampleY);
              // }else if( animationTimer >= 5 && animationTimer < 10 ){
              //   screen[j*nScreenWidth+i] = _getSamplePixel(texture2, fSampleX, fSampleY);
              // }else if( animationTimer >= 10 ){
              //   screen[j*nScreenWidth+i] = _getSamplePixel(texture3, fSampleX, fSampleY);
              // }


              // Render Texture Directly
              if( nRenderMode == 1 ){
                screen[j*nScreenWidth+i] = _getSamplePixel(textures[sWalltype], fSampleX, fSampleY);
              }


              // Render Texture with Shading
              if( nRenderMode == 2 ){
                screen[j*nScreenWidth+i] = _rh.renderWall(j, fDistanceToWall, sWallDirection, _getSamplePixel(textures[sWalltype], fSampleX, fSampleY));
              }


              // old, solid-style shading
              if( nRenderMode == 0 ){
                screen[j*nScreenWidth+i] = _rh.renderSolidWall(j, fDistanceToWall, isBoundary);
              }
            }

            // render whatever char is on the map as walltype
            else{
              screen[j*nScreenWidth+i] = sWalltype;
            }
          } // end solid block


          // floor
          else {
            screen[j*nScreenWidth+i] = _rh.renderFloor(j);
          }
        } // end draw column loop


        // Object-Draw (removed overlayscreen)
        for(var y = 0; y < nScreenHeight; y++){
          if( y > nObjectCeiling && y <= nObjectFloor ){
            if(sObjectType == "o"){
              if( y >=  nFObjectBackwall ){
                screen[y*nScreenWidth+i] = _rh.renderSolidWall(y, fDistanceToObject, isBoundary);
              }
            }
          }
        } // end draw column loop
      }  // end column loop



      // draw sprites
      for(var si=0; si < Object.keys(oLevelSprites).length; si++ ){

        // the sprite in the level-side
        var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];

        // reference to the global-side sprite
        var currentSpriteObject = allSprites[sprite["name"]];


        // can object be seen?
        var fVecX = sprite["x"] - fPlayerX;
        var fVecY = sprite["y"] - fPlayerY;
        var fDistanceFromPlayer = Math.sqrt(fVecX*fVecX + fVecY*fVecY);

        // calculate angle between sprite and player, to see if in fov
        var fEyeX = Math.cos(fPlayerA);
        var fEyeY = Math.sin(fPlayerA);

        var fSpriteAngle = Math.atan2(fVecY, fVecX) - Math.atan2(fEyeY, fEyeX) ;
        if (fSpriteAngle < -PI___){
          fSpriteAngle += PIx2;
        }
        if (fSpriteAngle > PI___){
          fSpriteAngle -= PIx2;
        }

        var bInPlayerView = Math.abs(fSpriteAngle) < fFOV / 2;
        // var bInPlayerView = true;


        // only proceed if sprite is visible
        if( bInPlayerView && fDistanceFromPlayer >= 0.5 ){

          // very similar operation to background floor and ceiling.
          // Sprite height is default 1, but we can adjust with the factor passed in the sprite object/
          var fSpriteCeiling = +(nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) - nScreenHeight / (+(fDistanceFromPlayer) ) * currentSpriteObject["hghtFctr"];
          var fSpriteFloor = +(nScreenHeight / ((2 - nJumptimer*0.15) - fLooktimer*0.15)) + nScreenHeight / (+(fDistanceFromPlayer) );

          var fSpriteCeiling = Math.round(fSpriteCeiling);
          var fSpriteFloor = Math.round(fSpriteFloor);

          var fSpriteHeight = fSpriteFloor - fSpriteCeiling;
          var fSpriteAspectRatio = +(currentSpriteObject["height"]) / +(currentSpriteObject["width"] * currentSpriteObject["aspctRt"]);
          var fSpriteWidth = fSpriteHeight / fSpriteAspectRatio;
          var fMiddleOfSprite = (0.5 * (fSpriteAngle / (fFOV / 2.0)) + 0.5) * +(nScreenWidth);

          // The angle the sprite is facing relative to the player
          var fSpriteBeautyAngle = fPlayerA - sprite["r"] + PIdiv4;
          // normalize
          if (fSpriteBeautyAngle < 0){
            fSpriteBeautyAngle += PIx2;
          }
          if (fSpriteBeautyAngle > PIx2){
            fSpriteBeautyAngle -= PIx2;
          }

          // loops through the sprite pixels
          for(var sx = 0; sx < fSpriteWidth; sx++ ){
            for(var sy = 0; sy < fSpriteHeight; sy++){

              // sample sprite
              var fSampleX = sx / fSpriteWidth;
              var fSampleY = sy / fSpriteHeight;

              var sSamplePixel = "";

              // var sSpAngle = false;
              var sAnimationFrame = false;

              // animation-cycle available, determine the current cycle
              // TODO: randomize cycle position
              if( sprite["move"] && "walkframes" in currentSpriteObject ){
                if( animationTimer < 5 ){
                  sAnimationFrame = "W1";
                }else if( animationTimer >= 5 && animationTimer < 10 ){
                  sAnimationFrame = "W2";
                }else if( animationTimer >= 10 ){
                  sAnimationFrame = false;
                }
              }

              // sample-angled glyph is available
              if( "angles" in currentSpriteObject ){

                if( fSpriteBeautyAngle >= PI_0 && fSpriteBeautyAngle < PIx05 ){
                  sprite["a"] = "B";
                }
                else if( +(fSpriteBeautyAngle) >= +(PIx05) && +(fSpriteBeautyAngle) < +(PIx1) ){
                  sprite["a"] = "L";
                }
                else if( +(fSpriteBeautyAngle) >= +(PIx1) && +(fSpriteBeautyAngle) < +(PIx1_5) ){
                  sprite["a"] = "F";
                }
                else if( +(fSpriteBeautyAngle) >= +(PIx1_5) && +(fSpriteBeautyAngle) < +(PIx2) ){
                  sprite["a"] = "R";
                }
              }


              // check if object has both, angles, or animations
              if( sprite["a"] && sAnimationFrame ){
                sSamplePixel = _getSamplePixel(currentSpriteObject["angles"][sprite["a"]][sAnimationFrame], fSampleX, fSampleY);
              }
              else if( sprite["a"] ){
                sSamplePixel = _getSamplePixel(currentSpriteObject["angles"][sprite["a"]], fSampleX, fSampleY);
              }
              else if( sAnimationFrame ){
                sSamplePixel = _getSamplePixel(currentSpriteObject[sAnimationFrame], fSampleX, fSampleY);
              }
              else{
                // if not, use basic sprite
                sSamplePixel = _getSamplePixel(currentSpriteObject, fSampleX, fSampleY);
              }


              // assign based on render mode
              if( nRenderMode == 2 || nRenderMode == 0 ){
                sSpriteGlyph = _rh.renderWall( j, fDistanceFromPlayer, "W", sSamplePixel );
              }
              else{
                sSpriteGlyph = sSamplePixel;
              }


              var nSpriteColumn = ~~((fMiddleOfSprite + sx - (fSpriteWidth / 2)));

              if (nSpriteColumn >= 0 && nSpriteColumn < nScreenWidth){
                // only render the sprite pixel if it is not a . or a space, and if the sprite is far enough from the player
                if (sSpriteGlyph != "." && sSpriteGlyph != "&nbsp;" && fDepthBuffer[nSpriteColumn] >= fDistanceFromPlayer ){

                  // render pixels to screen
                  var yccord = fSpriteCeiling + sy;
                  var xccord = nSpriteColumn;
                  screen[ yccord*nScreenWidth + xccord ] = sSpriteGlyph;
                  fDepthBuffer[nSpriteColumn] = fDistanceFromPlayer;
                }
              }
            }
          }
        } // end if

        // player was hit
        else{
          // clearInterval(gameRun);
        }

      }

      _fDrawFrame(screen, false);

    }
  };


  // for every row make a nScreenWidth amount of pixels
  var _createTestScreen = function(){
    var sOutput = "";
    for(var i = 0; i < nScreenHeight; i++){
      for(var j = 0; j < nScreenWidth; j++){
        sOutput += "&nbsp;";
      }
      sOutput += "<br>";
    }
    eScreen.innerHTML = sOutput;
  };


  var _getWidth = function() {
    if (self.innerWidth) {
      return self.innerWidth;
    }
    if (document.documentElement && document.documentElement.clientWidth) {
      return document.documentElement.clientWidth;
    }
    if (document.body) {
      return document.body.clientWidth;
    }
  };


  var _getHeight = function() {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  };


  var nTrymax = 512;
  var _testScreenSizeAndStartTheGame = function(){

    // render a static test screen
    _createTestScreen();

    var widthOfDisplay   = eScreen.offsetWidth;
    var widthOfViewport  = _getWidth();
    var heightOfViewPort = _getHeight();
    var viewPortAspect   = heightOfViewPort / widthOfViewport;

    // check if the amount of pixels to be rendered fit, if not, repeat
    if(widthOfDisplay > widthOfViewport + 120){
      nScreenWidth = nScreenWidth - 1;
      // nScreenHeight = nScreenWidth * 0.22


      // try no more than nTrymax times (in case of some error)
      if( nTrymax > 0 ){
        nTrymax--;
        _testScreenSizeAndStartTheGame();
      }else{
        _debugOutput("Trymax exceeded");
      }

    }
    // if it does, set aspect-ratio-based height
    // and start the game
    else{
      var fAdjustedAspectRatio = viewPortAspect/2.82;
      _debugOutput( fAdjustedAspectRatio );

      if( fAdjustedAspectRatio < 0.266 ){
        fAdjustedAspectRatio = 0.266;
      }

      nScreenHeight = nScreenWidth * fAdjustedAspectRatio;
      main();
    }
  };


  var init = function( input )
  {
    // prep document
    eScreen = document.getElementById("display");
    eScreen2 = document.getElementById("seconddisplay");
    eDebugOut = document.getElementById("debug");
    eTouchLook = document.getElementById("touchinputlook");
    eTouchMove = document.getElementById("touchinputmove");

    _moveHelpers.keylisten();
    _moveHelpers.mouseinit();
    _moveHelpers.touchinit();

    // TODO: move to in-game menu
    document.getElementById("solid").addEventListener("click", function(){ nRenderMode = 0 });
    document.getElementById("texture").addEventListener("click", function(){ nRenderMode = 1 });
    document.getElementById("shader").addEventListener("click", function(){ nRenderMode = 2 });

    // initial gameload
    _loadLevel("levelfile1.map");
  };


  return{
    init: init,
  }
})();