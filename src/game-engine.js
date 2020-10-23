var gameEngineJS = (function(){

  var eScreen;
  var eDebugOut;

  var nScreenWidth = 120;
  var nScreenHeight = 40;

  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.15;
  var fPlayerA = 0;

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

  var nJumptimer = 0;


  var map = "";
  map += "#############..#";
  map += "#...........#..#";
  map += "#...........#..#";
  map += "#...........#..#";
  map += "#########...#..#";
  map += "#..............#";
  map += "#..............#";
  map += "#.....####.....#";
  map += "#......##......#";
  map += "#..............#";
  map += "#.......########";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#####TXT....#..#";


  // gonna leave the console for errors,
  // console logging in fps seems to kill performance
  var _debugOutput = function(input){
    eDebugOut.innerHTML = input;
  };


  /**
   * Renderer
   */
  var _fDrawFrame = function(oInput)
  {
    var sOutput = '';

    // loops through each pixel and appends it to the output
    for(var i = 0; i < oInput.length; i++){

      // insert H blank based on screen-width
      if(i % nScreenWidth == 0){
        sOutput += '<br>';
      }
      sOutput += oInput[i];
    }
    eScreen.innerHTML = sOutput;
  };


  // figures out shading for given section
  var _renderSolidWall = function(j, fDistanceToWall){
    var fill = '&#9617;';


    if(fDistanceToWall < fDepth / 4 ){
      fill = '&#9608;';
    }
    else if(fDistanceToWall < fDepth / 3 ){
      fill = '&#9619;';
    }
    else if(fDistanceToWall < fDepth / 2 ){
      fill = '&#9618;';
    }
    else if(fDistanceToWall < fDepth / 1 ){
      fill = '&#9617;';
    }else{
      fill = '&nbsp;';
    }

    return fill;
  };



  var _moveHelpers = {

    listen: function(){

      window.onkeydown = function(e) {

        _debugOutput(e.which);

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

        if (e.which == 32) { // space
          bJumping = false;
          nJumptimer = 0;
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


    // called once per frame, handles movement computation
    move: function(){
      if(bTurnLeft){
        fPlayerA -= 0.05;
      }

      if(bTurnRight){
        fPlayerA += 0.05;
      }

      if(bStrafeRight){
        // forward arrow (w)
        fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bStrafeLeft){
        // forward arrow (w)
        fPlayerX -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bMoveForward){
        // forward arrow (w)
        fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }

      if(bMoveBackward){
        // backward arrow (s)
        fPlayerX -= ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        fPlayerY -= ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] != '.'){
          fPlayerX += ( Math.sin(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
          fPlayerY += ( Math.cos(fPlayerA) + 5.0 * 0.0051 ) * 0.1;
        }
      }
    },
  };



  /**
   * The basic game loop
   */
  var main = function()
  {
    setInterval(gameLoop, 33);
    function gameLoop(){

      _moveHelpers.move();

      // allows jumping for only a certain amount of time
      if(bJumping){
        nJumptimer++
        _debugOutput(nJumptimer);
      }
      if( nJumptimer > 5 ){
        bJumping = false;
      }


      // holds the frame we're going to send to the renderer
      var screen = [];

      // for the length of the screenwidth (one frame)
      for(var i = 0; i < nScreenWidth; i++){

        // calculates the ray angle into the world space
        // take the current player angle, subtract half the field of view
        // and then chop it up into equal little bits of the screen width (at the current colum)
        var fRayAngle = (fPlayerA - fFOV / 1.8) + (i / nScreenWidth) * fFOV;

        var fDistanceToWall = 0;
        var bHitWall = false;
        var sWalltype = '#';

        var fEyeX = Math.sin(fRayAngle); // unit vector for way in player space
        var fEyeY = Math.cos(fRayAngle); // I think this determines the line the testing travels along

        while(!bHitWall && fDistanceToWall < fDepth){
          fDistanceToWall += 0.1;

          var nTestX = parseInt( ((fPlayerX) + fEyeX * fDistanceToWall) );
          var nTestY = parseInt( ((fPlayerY) + fEyeY * fDistanceToWall) );

          // test if Ray is out of bounds
          if(nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight){
            bHitWall = true;
            // TODO: Figure out why this didn't work
            fDistanceToWall = fDepth;
          }else{
            // Ray is in the bounds, so let's see if the ray cell wall is a block.
            // We are actually testing if we DIDN't hit an empty space
            // This code effectively converts our position in 3D space into
            // 2D coordinates (because the map is stored in a 2D array)
            if(map[nTestY * nMapWidth + nTestX] !== '.'){
              bHitWall = true;

              // we are writing what kind of block was detected into the walltype variable.
              // This will take on '#' or 'X', or whatever is not '.'
              sWalltype = map[nTestY * nMapWidth + nTestX];

              // Exp: fDistanceToWall will retain it's distance value;
              // It was incremented above.
            }
          }
        } // end angle loop


        // based on the distance to wall, determine how much floor and ceiling to show per column,
        // or, to put in another way, how big or small to paint the rendered wall per column

        var nTower = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall - 2);
        var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
        var nFloor = nScreenHeight - nCeiling;
        var nDoorFrameHeight = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall + 2);


        if(bJumping){
          nCeiling = (nScreenHeight / (2 - nJumptimer*0.15)) - nScreenHeight / fDistanceToWall;
          nFloor = (nScreenHeight / (2 - nJumptimer*0.15)) + nScreenHeight / fDistanceToWall;
          nTower = (nScreenHeight / (2 - nJumptimer*0.15)) - nScreenHeight / (fDistanceToWall - 2);
        }


        // draw the column, one screenheight pixel at a time
        // j is equivalent to y
        // i is equivalent to x
        for(var j = 0; j < nScreenHeight; j++){

          if( j < nCeiling){

            // case of tower block
            if(sWalltype == 'T'){
              if( j > nTower ){
                screen[j*nScreenWidth+i] = _renderSolidWall(j, fDistanceToWall);
              }else{
                screen[j*nScreenWidth+i] = '&nbsp;';
              }
            }

            // draw ceiling/sky
            else{
              screen[j*nScreenWidth+i] = '&nbsp;';
            }
          }
          else if( j > nCeiling && j <= nFloor ){

            // Door Walltype
            if(sWalltype == 'X'){
              if( j < nDoorFrameHeight){
                screen[j*nScreenWidth+i] = '&boxH;';
              }else{

                if(fDistanceToWall < fDepth / 4){
                  screen[j*nScreenWidth+i] = '&boxV;';
                }
                else{
                  screen[j*nScreenWidth+i] = '|';
                }
              }
            }
            // Solid Walltype
            else if(sWalltype == '#' || sWalltype == 'T'){
              // draw wall, in different shades
              screen[j*nScreenWidth+i] = _renderSolidWall(j, fDistanceToWall);
            }
            // renders whatever char is on the map as walltype
            else{
              screen[j*nScreenWidth+i] = sWalltype;
            }
          }
          else{

            // draw floor, in different shades
            b = 1 - (j -nScreenHeight / 2) / (nScreenHeight / 2);
            if(b < 0.25){
              screen[j*nScreenWidth+i] = 'x';
            }else if(b < 0.5){
              screen[j*nScreenWidth+i] = '=';
            }else if(b < 0.75){
              screen[j*nScreenWidth+i] = '-';
            }else if(b < 0.9){
              screen[j*nScreenWidth+i] = '`';
            }else{
              screen[j*nScreenWidth+i] = ' ';
            }
          }
        } // end draw column loop

      }  // end column loop

      _fDrawFrame(screen);

    }
  };


  var init = function( input )
  {
    // prep document
    eScreen = document.getElementById('display');
    eDebugOut = document.getElementById('debug');


    // rendering loop
    main();

    _moveHelpers.listen();
  };


  return{
    init: init,
  }
})();
