var gameEngineJS = (function(){

  var eScreen;
  var eDebugOut;

  var nScreenWidth = 120;
  var nScreenHeight = 40;

  // var nScreenWidth = 180;
  // var nScreenHeight = 60;

  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.15;
  var fPlayerA = 1.5;

  var nMapHeight = 16;
  var nMapWidth = 16;

  var fFOV = 3.14159 / 4.0;
  var fDepth = 16.0; // viewport depth


  var bTurnLeft;
  var bTurnRight;
  var bStrafeLeft;
  var bStrafeRight;
  var bMoveForward;
  var bMoveBackward;
  var bJumping;
  var bFalling;

  var nJumptimer = 0;


  var bLookUp;
  var bLookDown;

  var fLooktimer = 0;


  var map = "";
  map += "#############..#";
  map += "#...........#..#";
  map += "#...T.......#..#";
  map += "#...T.......#..#";
  map += "#...T..........#";
  map += "#...T........o.#";
  map += "#...T........o.#";
  map += "#.....###....o.#";
  map += "#......##....o.#";
  map += "#..............#";
  map += "#.......########";
  map += "#..............#";
  map += "#..ooooooo.....#";
  map += "#..............#";
  map += "#....T.T....#..#";
  map += "######X#....#..#";


  // gonna leave the console for errors, logging seems to kill performance
  var _debugOutput = function(input){
    eDebugOut.innerHTML = input;
  };


  // renderer
  var _fDrawFrame = function(oInput, oOverlay, eTarget){
    var oOverlay = oOverlay || false;
    var eTarget  = eTarget || eScreen;
    var sOutput = '';

    // loops through each pixel of the background (oInput)
    // and appends it to the output
    for(var i = 0; i < oInput.length; i++){

      // insert H blank based on screen-width
      if(i % nScreenWidth == 0){
        sOutput += '<br>';
      }

      // if oOverlay !0, appends it to the output instead
      if( oOverlay && oOverlay[i] != 0){
        sOutput += oOverlay[i];
      }else{
        sOutput += oInput[i];
      }
    }

    eTarget.innerHTML = sOutput;
  };


  // various shaders for walls, ceilings, objects
  // _renderHelpers
  var _rh = {

    // figures out shading for given section
    renderSolidWall: function(j, fDistanceToWall, isBoundary){
      var fill = '&#9617;';

      if(fDistanceToWall < fDepth / 5.5 ){   // 4
        fill = '&#9608;';
      }
      else if(fDistanceToWall < fDepth / 3.66 ){    // 3
        fill = '&#9619;';
      }
      else if(fDistanceToWall < fDepth / 2.33 ){    // 2
        fill = '&#9618;';
      }
      else if(fDistanceToWall < fDepth / 1 ){    // 1
        fill = '&#9617;';
      }else{
        fill = '&nbsp;';
      }

      if( isBoundary ){
        if(fDistanceToWall < fDepth / 5.5 ){   // 4
          fill = '&#9617;';
        }
        else if(fDistanceToWall < fDepth / 3.66 ){    // 3
          fill = '&#9617;';
        }
        else if(fDistanceToWall < fDepth / 2.33 ){    // 2
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

    renderObject: function(j, fDistanceToWall){
      var fill = '&nbsp;'
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

        // if (e.which == 82) { // r
        //   bLookUp = true;
        // }
        // if (e.which == 70) { // f
        //   bLookDown = true;
        // }
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

        // if (e.which == 82) { // r
        //   bLookUp = false;
        // }
        // if (e.which == 70) { // f
        //   bLookDown = false;
        // }
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

    // mouse (experimental API)
    mouse: function(){
      var fMouseLookFactor = 0.002;

      document.body.onclick = function(){

        document.body.requestPointerLock();
        document.onmousemove = function (e) {

          // look left/right
          fPlayerA   += ( (e.movementX*fMouseLookFactor) || (e.mozMovementX*fMouseLookFactor) || (e.webkitMovementX*fMouseLookFactor) || 0);

          // look up/down (with bounds)
          var fYMoveFactor = ( (e.movementY*0.05) || (e.mozMovementY*0.05) || (e.webkitMovementY*0.05) || 0);
          fLooktimer -= fYMoveFactor;
          if( fLooktimer > 8 || fLooktimer < -8 ){
            fLooktimer += fYMoveFactor;
          }

          _debugOutput( fLooktimer );

          // on click hide curser
          // document.body.onclick = document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock;
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

      if(bStrafeLeft){
        // forward arrow (w)
        fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bStrafeRight){
        // forward arrow (w)
        fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bMoveForward){
        // forward arrow (w)
        fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bMoveBackward){
        // backward arrow (s)
        fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }
    },
  };


  /**
   * The basic game loop
   */
  var main = function(){
    setInterval(gameLoop, 33);
    function gameLoop(){

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

      // if( bLookUp ){
      //   fLooktimer += 0.5;
      // }
      // else if( bLookDown ){
      //   fLooktimer -= 0.5;
      // }


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

        var nRayLength = 0.0;

        /**
         * Ray Casting Loop
         */
        while(!bBreakLoop && nRayLength < fDepth){

          // increment
          nRayLength +=0.1;

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
          else if(map[nTestY * nMapWidth + nTestX] == '#' || map[nTestY * nMapWidth + nTestX] == 'X' || map[nTestY * nMapWidth + nTestX] == 'T'){
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

          }
        } // end ray casting loop

        // at the end of ray casting, we should have the lengths of the rays
        // set totheir last value, representing their distances


        // based on the distance to wall, determine how much floor and ceiling to show per column,
        var nTower   = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall - 2);
        var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
        var nFloor   = nScreenHeight - nCeiling;
        var nDoorFrameHeight = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall + 2);

        // similar operation for objects
        var nObjectCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToInverseObject;
        var nObjectCeilFG = (nScreenHeight / 2) - nScreenHeight / fDistanceToObject;
        var nObjectFloor = nScreenHeight - nObjectCeilFG;
        var nFObjectBackwall = (nScreenHeight / 2) + nScreenHeight / (fDistanceToInverseObject + 0);



        // recalc for looking
        nCeiling = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / fDistanceToWall;
        nFloor   = (nScreenHeight / (2 - fLooktimer*0.15)) + nScreenHeight / fDistanceToWall;
        nTower   = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall - 2);
        nDoorFrameHeight = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / (fDistanceToWall + 2);

        nObjectCeiling = (nScreenHeight / (2 - fLooktimer*0.15)) - nScreenHeight / fDistanceToInverseObject;
        nObjectCeilFG = (nScreenHeight / (2 + fLooktimer*0.15)) - nScreenHeight / fDistanceToObject;
        nObjectFloor = nScreenHeight - nObjectCeilFG;
        nFObjectBackwall = (nScreenHeight / (2 - fLooktimer*0.15)) + nScreenHeight / (fDistanceToInverseObject + 0);



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
            else if(sWalltype == '#' || sWalltype == 'T'){
              screen[j*nScreenWidth+i] = _rh.renderSolidWall(j, fDistanceToWall, isBoundary);
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


  var init = function( input )
  {
    // prep document
    eScreen = document.getElementById('display');
    eDebugOut = document.getElementById('debug');


    // rendering loop
    main();

    _moveHelpers.keylisten();
    _moveHelpers.mouse();
  };


  return{
    init: init,
  }
})();
