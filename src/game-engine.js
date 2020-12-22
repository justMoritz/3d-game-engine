var gameEngineJS = (function(){

  var nRenderMode = 2;

  var eScreen;
  var eDebugOut;

  var nScreenWidth = 240;
  var nScreenHeight = 60;

  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.15;
  var fPlayerA = 1.5;

  var nDegrees = 0;


  var fFOV = Math.PI / 2.25; // (Math.PI / 4.0 originally)
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

  var nJumptimer = 0;

  var fLooktimer = 0;


  var nMapHeight = 16;
  var nMapWidth = 16;
  var map = "";


  // █
  // ▓
  // ▒
  // ░


  var _assetFetcher = function(inputSource, callback){
    inputSource = "assets/" + inputSource;
    var asset = '';
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
      if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
        asset = xmlhttp.responseText;
        callback(asset);
      }
    };
    xmlhttp.open("GET", inputSource ,true);
    xmlhttp.send();
  };


  var _assetLoader = function(levelFile, callback){
    var levelData   = '';

    _assetFetcher(levelFile, function(loadedLevel){
      levelData = loadedLevel;
      callback(levelData);
    });
  }


  var _setGlobalAssets = function(level, callback){

    // parses map
    map = level;
    var mapAmountOfRows = level.split(/\r\n|\r|\n/).length; // count every whitespace
    var mapWithOutWhitespaces = level.replace(/\s/g,''); // remove every whitespace
    var mapAmountOfCols = mapWithOutWhitespaces.length / mapAmountOfRows; // count across

    // set global assets
    map = mapWithOutWhitespaces;
    nMapWidth = mapAmountOfCols;
    nMapHeight = mapAmountOfRows;

    // start the game already
    callback();
  };


  /**
   * Loads
   * @param  {[string]} level The Level file
   * @return {[type]}       [description]
   */
  var _loadLevel = function(level){

    var levelstring = level.replace(".map", "");

    var loadScriptAsync = function loadScriptAsync(uri, levelstring) {
      return new Promise(function (resolve, reject) {
        var tag = document.createElement('script');
        tag.src = "assets/" + uri;
        tag.id = levelstring;
        tag.async = true;

        tag.onload = function () {
          resolve();
        };

        document.getElementById("map").src = "assets/" + level;
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      });
    };

    var scriptLoaded = loadScriptAsync(level, levelstring);

    scriptLoaded.then(function(){
        map = window[levelstring].map;
        nMapHeight = window[levelstring].nMapHeight;
        nMapWidth = window[levelstring].nMapWidth;
        console.log(map);
    });


    // pauses, then starts the game loop
    _testScreenSizeAndStartTheGame();
    window.addEventListener('resize', function(){
      clearInterval(gameRun);
      _testScreenSizeAndStartTheGame();
    });

    // // loads assets for textures and map
    // _assetLoader(level, function(level){

    //   // when loaded, make sense of the data receieved
    //   _setGlobalAssets(level, function(){

    //     // when made sense of, start rendering loop
    //     // main();
    //     _testScreenSizeAndStartTheGame();
    //     window.addEventListener('resize', function(){
    //       clearInterval(gameRun);
    //       _testScreenSizeAndStartTheGame();
    //     });
    //   });
    // });
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
  var _getSamplePixel = function(texture, x, y, scaleFactor){
    // _debugOutput( texture );

    if( texture == 'DIRECTIONAL' ){
      // Different Texture based on viewport
      if( nDegrees > 0 && nDegrees < 180 ){
        texture = textures['W']['S'];
      }else{
        texture = textures['W']['N'];
      }
    }

    scaleFactor = scaleFactor || 2;

    x = scaleFactor * x%1;
    y = scaleFactor * y%1;

    var sampleX = Math.floor(texWidth*x);
    var sampleY = Math.floor(texHeight*y);

    var samplePosition = (texWidth*(sampleY)) + sampleX;

    if( x < 0 || x > texWidth || y < 0 || y > texHeight ){
      return '+';
    }else{
      return texture[samplePosition];
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
      var evenIndex = Math.floor(i * interval + interval / 2);
      result.push(allItems[evenIndex]);
    }

    return result;
  }


  // gonna leave the console for errors, logging seems to kill performance
  var _debugOutput = function(input){
    eDebugOut.innerHTML = input;
  };


  // returns true every a-th interation of b
  var _everyAofB = function(a, b){
    return ( a && (a % b === 0));
  }


  var _printFiller = function(number){
    var pix = '';
    for(var i=0; i<number; i++){
      pix += '.';
    }
    return pix;
  };


  // lookup table “for fine-control” or “for perfomance”
  // …(but really because I suuuuuuck at logic [apparently] )
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



  var _printCompositPixel = function(oInput, oOverlay, index){
    var sOutput = '';
    // if oOverlay !0, appends it to the output instead
    if( oOverlay && oOverlay[index] != 0){
      sOutput += oOverlay[index];
    }else{
      sOutput += oInput[index];
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


      // sOutput.push( _printFiller( fLookModifier ) );
      for(var i=0; i<fLookModifier; i++){
        sOutput.push( '.' );
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
          // don't print
        }else{
          // print
          sOutput.push( _printCompositPixel(oInput, oOverlay, globalPrintIndex) );
        }

        globalPrintIndex++;
      } // end for(rpix

      // sOutput += row;
      // sOutput += '&nbsp;&nbsp;fLooktimer:&nbsp;';
      // sOutput += Math.round(fLooktimer);
      // sOutput += '&nbsp;&nbsp;_skipEveryXrow:&nbsp;';
      // sOutput += Math.round( _skipEveryXrow(fLooktimer) );
      // sOutput += '&nbsp;&nbsp;fLookModifier:&nbsp;';
      // sOutput += Math.round( fLookModifier );
      // sOutput += '&nbsp;&nbsp;NeverMoreThan:&nbsp;';
      // sOutput += neverMoreThan;
      // sOutput += '&nbsp;&nbsp;';


      // sOutput.push( _printFiller( fLookModifier ) );
      for(var i=0; i<fLookModifier; i++){
        sOutput.push( '.' );
      }


      // sOutput.push( '<br>' );
    } // end for(row

    return sOutput;
    // eTarget.innerHTML = sOutput;
  };


  var _fDrawFrame = function(screen, overlayscreen){
    var frame = _fPrepareFrame(screen, overlayscreen);

    // _debugOutput( frame.length );

    var sOutput = '';


    // // loops through each pixel and appends it to the output
    // for(var i = 0; i < frame.length; i++){
    //   // H blank based on screen-width
    //   if(i % (nScreenWidth) == 0){
    //     sOutput += '<br>';
    //   }
    //   sOutput += frame[i];
    // }


    // interates over each row again, and omits the first and last 30 pixels, to disguise the skewing!
    var printIndex = 0;
    var removePixels = 29;
    for(var row = 0; row < nScreenHeight; row++){
      for(var pix = 0; pix < nScreenWidth; pix++){

        // H-blank based on screen-width
        if(printIndex % (nScreenWidth) == 0){
          sOutput += '<br>';
        }

        if( pix < removePixels ){
          sOutput += '';
        }
        else if( pix > nScreenWidth-removePixels ){
          sOutput += '';
        }
        else{
          sOutput += frame[printIndex];
        }

        printIndex++;
      }
    }




    eScreen.innerHTML = sOutput;

  };




  // various shaders for walls, ceilings, objects
  // _renderHelpers
  //
  // each texture has 4 values: 3 hues plus black
  // each value can be rendered with 5 shades (4 plus black)
  var _rh = {

    shades: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`.',

    renderWall: function(j, fDistanceToWall, sWallDirection, pixel){

      var fill = '';

      var b100 = '&#9608;';
      var b75  = '&#9619;';
      var b50  = '&#9618;';
      var b25  = '&#9617;';
      var b0   = '&nbsp;';

      // var b100 = _rh.shades[1];
      // var b75  = _rh.shades[8];
      // var b50  = _rh.shades[17];
      // var b25  = _rh.shades[22];
      // // var b0   = _rh.shades[24];

      if( sWallDirection === 'N' || sWallDirection === 'S' ){

        if(fDistanceToWall < fDepth / 5.5 ){   // 4

          if( pixel === '#' ){
            fill = b100;
          }else if( pixel === '7' ){
            fill = b75;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b50;
          }else{
            fill = b25;
          }

        }
        else if(fDistanceToWall < fDepth / 3.66 ){    // 3

          if( pixel === '#' ){
            fill = b75;
          }else if( pixel === '7' ){
            fill = b50;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 2.33 ){    // 2

          if( pixel === '#' ){
            fill = b50;
          }else if( pixel === '7' ){
            fill = b25;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 1 ){    // 1

          if( pixel === '#' ){
            fill = b25;
          }else if( pixel === '7' ){
            fill = b25;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else{
          fill = '&nbsp;';
        }
      }

      // walldirection W/E
      else{

        if(fDistanceToWall < fDepth / 5.5 ){   // 4

          if( pixel === '#' ){
            fill = b75;
          }else if( pixel === '7' ){
            fill = b50;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 3.66 ){    // 3

          if( pixel === '#' ){
            fill = b50;
          }else if( pixel === '7' ){
            fill = b50;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 2.33 ){    // 2

          if( pixel === '#' ){
            fill = b50;
          }else if( pixel === '7' ){
            fill = b25;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b25;
          }else{
            fill = b0;
          }

        }
        else if(fDistanceToWall < fDepth / 1 ){    // 1

          if( pixel === '#' ){
            fill = b25;
          }else if( pixel === '7' ){
            fill = b25;
          }else if( pixel === '*' || pixel === 'o'){
            fill = b0;
          }else{
            fill = b0;
          }

        }
        else{
          fill = '&nbsp;';
        }
      }

      return fill;

    },

    // figures out shading for given section
    renderSolidWall: function(j, fDistanceToWall, isBoundary){
      var fill = '&#9617;';

      if(fDistanceToWall < fDepth / 6.5 ){   // 4
        fill = '&#9608;';
      }
      else if(fDistanceToWall < fDepth / 4.66 ){    // 3
        fill = '&#9619;';
      }
      else if(fDistanceToWall < fDepth / 3.33 ){    // 2
        fill = '&#9618;';
      }
      else if(fDistanceToWall < fDepth / 1 ){    // 1
        fill = '&#9617;';
      }else{
        fill = '&nbsp;';
      }

      if( isBoundary ){
        if(fDistanceToWall < fDepth / 6.5 ){   // 4
          fill = '&#9617;';
        }
        else if(fDistanceToWall < fDepth / 4.66 ){    // 3
          fill = '&#9617;';
        }
        else if(fDistanceToWall < fDepth / 3.33 ){    // 2
          fill = '&nbsp;';
        }
        else if(fDistanceToWall < fDepth / 1 ){    // 1
          fill = '&nbsp;';
        }else{
          fill = '&nbsp;';
        }
      }

      return fill;
    },

    // shading and sectionals for gate
    renderGate: function(j, fDistanceToWall, nDoorFrameHeight){
      var fill = "X";
      if( j < nDoorFrameHeight){

        if(fDistanceToWall < fDepth / 4){
          fill = '&boxH;';
        }
        else{
          fill = '=';
        }

      }else{

        if(fDistanceToWall < fDepth / 4){
          fill = '&boxV;';
        }
        else{
          fill = '|';
        }
      }
      return fill;
    },

    renderFloor: function(j){
      var fill = '`';

      // draw floor, in different shades
      b = 1 - (j -nScreenHeight / 2) / (nScreenHeight / 2);
      b = 1 - (j -nScreenHeight / (2- fLooktimer*0.15)) / (nScreenHeight / (2 - fLooktimer*0.15));

      if(b < 0.25){
        fill = 'x';
      }else if(b < 0.5){
        fill = '=';
      }else if(b < 0.75){
        fill = '-';
      }else if(b < 0.9){
        fill = '`';
      }else{
        fill = '&nbsp;';
      }

      return fill;
    },

    renderCeiling: function(j){
      var fill = '`';

      // draw floor, in different shades
      b = 1 - (j -nScreenHeight / 2) / (nScreenHeight / 2);
      if(b < 0.25){
        fill = '`';
      }else if(b < 0.5){
        fill = '-';
      }else if(b < 0.75){
        fill = '=';
      }else if(b < 0.9){
        fill = 'x';
      }else{
        fill = '#';
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
          clearInterval(gameRun);
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

    // mouse
    mouse: function(){
      var fMouseLookFactor = 0.002;

      eScreen.onclick = function(){

        eScreen.classList.add('nomouse');

        document.body.requestPointerLock();
        document.onmousemove = function (e) {

          // look left/right
          fPlayerA   += ( (e.movementX*fMouseLookFactor) || (e.mozMovementX*fMouseLookFactor) || (e.webkitMovementX*fMouseLookFactor) || 0);

          // look up/down (with bounds)
          var fYMoveFactor = ( (e.movementY*0.05) || (e.mozMovementY*0.05) || (e.webkitMovementY*0.05) || 0);

          // if the looktimer is negative (looking down), increase the speed
          if( fLooktimer < 0 ){
            fYMoveFactor = fYMoveFactor*4;
          }

          // the reason for the increased speed is that looking “down” becomes expotentially less,
          // so we are artificially increasing the down-factor. It's a hack, but it works okay!
          fLooktimer -= fYMoveFactor;
          if( fLooktimer > nLookLimit*0.7 || fLooktimer < -nLookLimit*2 ){
            fLooktimer += fYMoveFactor;
          }

          _debugOutput(fLooktimer)

        }
      };
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

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bStrafeRight){
        fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bMoveForward){
        fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }

      if(bMoveBackward){
        fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
          fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * fMoveFactor;
        }
      }
    },
  };

  var gameRun;

  var animationTimer = 0;

  /**
   * The basic game loop
   */
  var main = function(){
    gameRun = setInterval(gameLoop, 33);
    function gameLoop(){

      animationTimer++;
      if(animationTimer > 15){
        animationTimer = 0;
      }

      _moveHelpers.move();

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


      // holds the frames we're going to send to the renderer
      var screen = [];
      var overlayscreen = []


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

        var sWalltype = '#';
        var sObjectType = '0';

        var fEyeX = Math.cos(fRayAngle); // I think this determines the line the testing travels along
        var fEyeY = Math.sin(fRayAngle);

        var fSampleX = 0.0;
        var sWallDirection = 'N';

        var nRayLength = 0.0;

        /**
         * Ray Casting Loop
         */
        while(!bBreakLoop && nRayLength < fDepth){

          // increment
          nRayLength += 0.1;

          if( !bHitObject ){
            fDistanceToObject += 0.1;
          }
          if( !bHitBackObject ){
            fDistanceToInverseObject += 0.1;
          }
          if( !bHitWall ){
            fDistanceToWall += 0.1;
          }

          // ray position
          var nTestX = parseInt( ((fPlayerX) + fEyeX * nRayLength) );
          var nTestY = parseInt( ((fPlayerY) + fEyeY * nRayLength) );

          // test if ray hits out of bounds
          if(nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight){
            bHitWall = true; // didn't actually, just no wall there
            fDistanceToWall = fDepth;
            bBreakLoop = true;
          }

          // test for objects
          else if(map[nTestY * nMapWidth + nTestX] == 'o' || map[nTestY * nMapWidth + nTestX] == ','){
            bHitObject = true;
            sObjectType = map[nTestY * nMapWidth + nTestX];
          }
          else if(bHitObject == true && map[nTestY * nMapWidth + nTestX] == '.' || bHitObject == true && map[nTestY * nMapWidth + nTestX] == '.'){
            bHitBackObject = true;
          }

          // Test for walls
          else if( map[nTestY * nMapWidth + nTestX] != '.' ){
            bHitWall = true;
            bBreakLoop = true;

            sWalltype = map[nTestY * nMapWidth + nTestX];


            // test found boundries of the wall
            var fBound = 0.01;
            var isBoundary = false;

            var vectorPairList = [];
            for (var tx = 0; tx < 2; tx++) {
              for (var ty = 0; ty < 2; ty++) {
                var vy = parseFloat(nTestY) + ty - fPlayerY;
                var vx = parseFloat(nTestX) + tx - fPlayerX;
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
            // if (Math.acos(vectorPairList[2][1]) < fBound) {
            //   isBoundary = true;
            // }


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

            if( fTestAngle >= -Math.PI * 0.25 && fTestAngle < Math.PI * 0.25 ){
              fSampleX = fTestPointY - parseFloat(nTestY);
              sWallDirection = 'W';
            }
            if( fTestAngle >= Math.PI * 0.25 && fTestAngle < Math.PI * 0.75 ){
              fSampleX = fTestPointX - parseFloat(nTestX);
              sWallDirection = 'N';
            }
            if( fTestAngle < -Math.PI * 0.25 && fTestAngle >= -Math.PI * 0.75 ){
              fSampleX = fTestPointX - parseFloat(nTestX);
              sWallDirection = 'S';
            }
            if( fTestAngle >= Math.PI * 0.75 || fTestAngle < -Math.PI * 0.75 ){
              fSampleX = fTestPointY - parseFloat(nTestY);
              sWallDirection = 'E';
            }

          }
        } // end ray casting loop




            // var nTower   = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall - 2);
            // var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
            // var nFloor   = nScreenHeight - nCeiling;
            // var nDoorFrameHeight = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall + 2);

            // var nObjectCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToInverseObject;
            // var nObjectCeilFG = (nScreenHeight / 2) - nScreenHeight / fDistanceToObject;
            // var nObjectFloor = nScreenHeight - nObjectCeilFG;
            // var nFObjectBackwall = (nScreenHeight / 2) + nScreenHeight / (fDistanceToInverseObject + 0);

            // fLooktimer = -3;
        // at the end of ray casting, we should have the lengths of the rays
        // set to their last value, representing their distances
        // based on the distance to wall, determine how much floor and ceiling to show per column,
        // Adding in the recalc for looking (fLookTimer)
        var nCeiling = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / fDistanceToWall;
        var nFloor   = (nScreenHeight / (2 - fLooktimer*0.15)) + nScreenHeight / fDistanceToWall;
        var nTower   = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall - 2);
        var nDoorFrameHeight = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall + 2);

        // similar operation for objects
        var nObjectCeiling = (nScreenHeight / (2 + fLooktimer*0.15) + fLooktimer) - (nScreenHeight / fDistanceToInverseObject);
        var nObjectCeilFG = (nScreenHeight / (2 + fLooktimer*0.15) +fLooktimer ) - (nScreenHeight / fDistanceToObject);
        var nObjectFloor = nScreenHeight - nObjectCeilFG;
        var nFObjectBackwall = (nScreenHeight / (2 - fLooktimer*0.15) ) + (nScreenHeight / (fDistanceToInverseObject + 0) );



        // recalc if jumping
        if(bJumping || bFalling){
          nCeiling = (nScreenHeight / (2 - nJumptimer*0.15) -(fLooktimer*0.15) ) - nScreenHeight / fDistanceToWall;
          nFloor   = (nScreenHeight / (2 - nJumptimer*0.15) -(fLooktimer*0.15) ) + nScreenHeight / fDistanceToWall;
          nTower   = (nScreenHeight / (2 - nJumptimer*0.15) -(fLooktimer*0.15) ) - nScreenHeight / (fDistanceToWall - 2);
          nDoorFrameHeight = (nScreenHeight / (2 - fLooktimer*0.15) -(fLooktimer*0.15) ) - nScreenHeight / (fDistanceToWall + 2);

          nObjectCeiling = (nScreenHeight / (2 - nJumptimer*0.15) -(fLooktimer*0.15) ) - nScreenHeight / fDistanceToInverseObject;
          nObjectCeilFG = (nScreenHeight / (2 + nJumptimer*0.15) -(fLooktimer*0.15) ) - nScreenHeight / fDistanceToObject;
          nObjectFloor = nScreenHeight - nObjectCeilFG;
          nFObjectBackwall = (nScreenHeight / (2 - nJumptimer*0.15) -(fLooktimer*0.15) ) + nScreenHeight / (fDistanceToInverseObject + 0);
        }

        // Converts player turn position into degrees (used for texturing)
        nDegrees = Math.floor(fPlayerA * (180/Math.PI)) % 360;
        // _debugOutput( nDegrees );


        // draw the columns one screenheight pixel at a time
        // Background Draw

        for(var j = 0; j < nScreenHeight; j++){



          // sky
          if( j < nCeiling){

            // case of tower block (the bit that reaches into the ceiling)
            if(sWalltype == 'T'){
              if( j > nTower ){

                screen[j*nScreenWidth+i] = _rh.renderSolidWall(j, fDistanceToWall, isBoundary);
              }else{
                screen[j*nScreenWidth+i] = '&nbsp;';
              }
            }

            // draw ceiling/sky
            else{
              if(sWalltype == ','){
                screen[j*nScreenWidth+i] = '1';
              }else{
                screen[j*nScreenWidth+i] = '&nbsp;';
              }
            }
          }

          // solid block
          else if( j > nCeiling && j <= nFloor ){

            // Door Walltype
            if(sWalltype == 'X'){
              screen[j*nScreenWidth+i] = _rh.renderGate(j, fDistanceToWall, nDoorFrameHeight);
            }

            // Solid Walltype
            else if(sWalltype != '.' || sWalltype == 'T'){

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

              /**
               * Render Texture Directly
               */
              if( nRenderMode == 1 ){
                screen[j*nScreenWidth+i] = _getSamplePixel(textures[sWalltype]["texture"], fSampleX, fSampleY, textures[sWalltype]["scale"]);
              }

              /**
               * Render Texture with Shading
               */
              if( nRenderMode == 2 ){
                screen[j*nScreenWidth+i] = _rh.renderWall(j, fDistanceToWall, sWallDirection, _getSamplePixel(textures[sWalltype]["texture"], fSampleX, fSampleY, textures[sWalltype]["scale"]));
              }

              /**
               * old, solid-style shading
               */
              if( nRenderMode == 0 ){
                screen[j*nScreenWidth+i] = _rh.renderSolidWall(j, fDistanceToWall, isBoundary);
              }


              /**
               * black lines between blocks
               */
              // if( isBoundary ){
              //   screen[j*nScreenWidth+i] = '&nbsp;';
              // }

            }

            // renders whatever char is on the map as walltype
            else{
              screen[j*nScreenWidth+i] = sWalltype;
            }

          }


          // floor
          else {
            screen[j*nScreenWidth+i] = _rh.renderFloor(j);
          }
        } // end draw column loop


        // Overlay Draw
        for(var y = 0; y < nScreenHeight; y++){

          // sky
          if( y < nObjectCeiling){
            // sky is always 0 on overlayscreen
            overlayscreen[y*nScreenWidth+i] = '0';
          }

          // solid block
          else if( y > nObjectCeiling && y <= nObjectFloor ){

            // Floortile Walltype
            if(sObjectType == 'o'){
              if( y < nFObjectBackwall ){
                overlayscreen[y*nScreenWidth+i] = '0';
              }
              else{
                overlayscreen[y*nScreenWidth+i] = _rh.renderSolidWall(y, fDistanceToObject, isBoundary);
                // overlayscreen[y*nScreenWidth+i] = '&nbsp;';
              }
            }else{
              overlayscreen[y*nScreenWidth+i] = '0';
            }
          }

          // floor
          else {
            // overlayscreen floor is always 0
            overlayscreen[y*nScreenWidth+i] = '0';

          }
        } // end draw column loop

      }  // end column loop



      _fDrawFrame(screen, overlayscreen);
      // _fDrawFrame(overlayscreen, false, eDebugOut);

    }
  };


  // for every row make a nScreenWidth amount of pixels
  var _createTestScreen = function(){
    var sOutput = '';
    for(var i = 0; i < nScreenHeight; i++){
      for(var j = 0; j < nScreenWidth; j++){
        sOutput += '&nbsp;';
      }
      sOutput += '.<br>';
    }
    eScreen.innerHTML = sOutput;
  };


  var nTrymax = 512;
  var _testScreenSizeAndStartTheGame = function(){

    // render a static test screen
    _createTestScreen();

    var widthOfDisplay = eScreen.offsetWidth;
    var heightOfDisplay = eScreen.offsetHeight;

    var widthOfViewport = window.screen.width;
    var heightOfViewport = window.screen.height;

    // check if the amount of pixels to be rendered fit, if not, repeat
    if(widthOfDisplay > widthOfViewport ){
      nScreenWidth = nScreenWidth-1;
      nScreenHeight = nScreenWidth*0.25;

      // try no more than nTrymax times (in case of some error)
      if( nTrymax > 0 ){
        nTrymax--;
        _testScreenSizeAndStartTheGame();
      }

    }
    // if it does, start the game
    else{
      main();
    }
  };


  var init = function( input )
  {
    // prep document
    eScreen = document.getElementById('display');
    eDebugOut = document.getElementById('debug');



    // main();

    _moveHelpers.keylisten();
    _moveHelpers.mouse();


    document.getElementById("solid").addEventListener("click", function(){ nRenderMode = 0 });
    document.getElementById("texture").addEventListener("click", function(){ nRenderMode = 1 });
    document.getElementById("shader").addEventListener("click", function(){ nRenderMode = 2 });


    // change level debug-buttons
    var levelbuttons = document.querySelectorAll(".levelbutton");
    for(var i=0; i < levelbuttons.length; i++){
      levelbuttons[i].addEventListener("click", function(){
        var selectedLevel = this.dataset.levelvalue;

        clearInterval(gameRun);
        _loadLevel(selectedLevel);

      });
    }


    // initial gameload
    _loadLevel('levelfile1.map');

  };


  return{
    init: init,
  }
})();