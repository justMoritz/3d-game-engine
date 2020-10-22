var gameEngineJS = (function(){

  var eScreen;
  var eDebugOut;

  var nScreenWidth = 120;
  var nScreenHeight = 40;

  var fPlayerX = 8.0;
  var fPlayerY = 8.0;
  var fPlayerA = 1.15;
  var fPlayerA = 180;

  var nMapHeight = 16;
  var nMapWidth = 16;

  var fFOV = 3.14159 / 4.0;
  var fDepth = 16.0; // viewport depth

  var map = "";
  map += "################";
  map += "#..........#...#";
  map += "#..........#...#";
  map += "#..........#...#";
  map += "#..........#...#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "X..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#........#######";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";


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



  /**
   * The basic game loop
   */
  var main = function()
  {
    setInterval(gameLoop, 33);
    function gameLoop(){

      var screen = [];

      // for the length of the screenwidth (one frame)
      for(var i = 0; i < nScreenWidth; i++){

        // calculates the ray angle into the world space
        // take the current player angle, subtract half the field of view
        // and then chop it up into equal little bits of the screen width (at the current colum)
        var fRayAngle = (fPlayerA - fFOV / 2) + (i / nScreenWidth) * fFOV;

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
        var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
        var nFloor = nScreenHeight - nCeiling;
        var nDoorFrameHeight = (nScreenHeight / 2) - nScreenHeight / (fDistanceToWall + 2);


        // draw the column, one screenheight pixel at a time
        for(var j = 0; j < nScreenHeight; j++){
          if( j < nCeiling){

            // draw ceiling/sky
            screen[j*nScreenWidth+i] = '&nbsp;';
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
            else if(sWalltype == '#'){
              // draw wall, in different shades
              if(fDistanceToWall >= fDepth){
                screen[j*nScreenWidth+i] = '&nbsp;';
              }
              else if(fDistanceToWall < fDepth / 4){
                screen[j*nScreenWidth+i] = '&block;';
              }
              else if(fDistanceToWall < fDepth / 3){
                screen[j*nScreenWidth+i] = '&blk34;';
              }
              else if(fDistanceToWall < fDepth / 2){
                screen[j*nScreenWidth+i] = '&blk12;';
              }
              else{
                screen[j*nScreenWidth+i] = '&blk14;';
              }
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



  var _testCoordinates = function(){
    console.log(map);
    console.log(map[22]);
  };



  var init = function( input )
  {
    // prep document
    eScreen = document.getElementById('display');
    eDebugOut = document.getElementById('debug');


    // rendering loop
    main();


    // Keypress logic is outside our rendering engine
    document.onkeypress = function (e) {
    e = e || window.event;
      // use e.keyCode
      _debugOutput( e.keyCode );

      if(e.keyCode == 97){
        // left arrow (a)
        fPlayerA -= 0.15;
      }
      else if(e.keyCode == 100){
        // right arrow (d)
        fPlayerA += 0.15;
      }
      else if(e.keyCode == 119){
        // forward arrow (w)
        fPlayerX += Math.sin(fPlayerA) + 5.0 * 0.0051;
        fPlayerY += Math.cos(fPlayerA) + 5.0 * 0.0051;

        _debugOutput(
          'PlayerX: ' + Math.sin(fPlayerA) + ' + 5.0 * 0.0051 = ' + (Math.sin(fPlayerA) + 5.0 * 0.0051) + '. Updated X to: ' +fPlayerX + '<br>' +
          'PlayerY: ' + Math.cos(fPlayerA) + ' + 5.0 * 0.0051 = ' + (Math.cos(fPlayerA) + 5.0 * 0.0051) + '. Updated X to: ' +fPlayerY
        );

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] == '#'){
          fPlayerX -= Math.sin(fPlayerA) + 5.0 * 0.0051;
          fPlayerY -= Math.cos(fPlayerA) + 5.0 * 0.0051;
        }

      }
      else if(e.keyCode == 115){
        // backward arrow (s)
        fPlayerX -= Math.sin(fPlayerA) + 5.0 * 0.0051;
        fPlayerY -= Math.cos(fPlayerA) + 5.0 * 0.0051;

        // converts coordinates into integer space and check if it is a wall (#), if so, reverse
        if(map[parseInt(fPlayerY) * nMapWidth + parseInt(fPlayerX)] == '#'){
          fPlayerX -= Math.sin(fPlayerA) + 5.0 * 0.0051;
          fPlayerY -= Math.cos(fPlayerA) + 5.0 * 0.0051;
        }

      }
    };



    // // mousemove logig

    // var oldX = 0, oldY = 0;
    // function captureMouseMove($event){

    //   var directionX = 0, directionY = 0, diffX = 0, diffY = 0;
    //   if ($event.pageX < oldX) {
    //       directionX = "left"
    //       diffX = oldX - $event.pageX;

    //       fPlayerA -= diffX * 0.0005;
    //   } else if ($event.pageX > oldX) {
    //       directionX = "right"
    //       diffX = $event.pageX - oldX;

    //       fPlayerA += diffX * 0.0005;
    //   }

    //   if ($event.pageY < oldY) {
    //       directionY = "top"
    //       diffY = oldY - $event.pageY;
    //       // fPlayerX += Math.sin(fPlayerA) + 5.0 * 0.000051;
    //       // fPlayerY += Math.cos(fPlayerA) + 5.0 * 0.000051;
    //   } else if ($event.pageY > oldY) {
    //       directionY = "bottom";
    //       diffY = $event.pageY - oldY;
    //       // fPlayerX -= Math.sin(fPlayerA) + 5.0 * 0.000051;
    //       // fPlayerY -= Math.cos(fPlayerA) + 5.0 * 0.000051;
    //   }

    //   oldX = $event.pageX;
    //   oldY = $event.pageY;
    // }

    // window.addEventListener('mousemove', captureMouseMove);
  };


  return{
    init: init,
  }
})();
