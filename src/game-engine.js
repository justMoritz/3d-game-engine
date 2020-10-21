var gameEngineJS = (function(){

  var eScreen;
  var eDebugOut;

  var nScreenWidth = 120;
  var nScreenHeight = 40;

  var fPlayerX = 8.0;
  var fPlayerY = 8.0;
  var fPlayerA = 0.0;

  var nMapHeight = 16;
  var nMapWidth = 16;

  var fFOV = 3.14159 / 3.0;
  var fDepth = 16.0; // viewport depth

  var map = "";
  map += "################";
  map += "#..............#";
  map += "#..............#";
  map += "#..........#...#";
  map += "#..........#...#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#.......########";
  map += "#..............#";
  map += "#..............#";
  map += "################";


  // gonna leave the console for errors,
  // console logging in fps seems to kill performance
  var _debugOutput = function(input){
    eDebugOut.innerHTML = input;
  };



  var _fDrawFrame = function(oInput)
  {
    var sOutput = '';
    // loops through each pixel and appends it to the output
    for(var i = 0; i < oInput.length; i++){
      // H blank based on screen-width
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
    // setInterval(gameLoop, 33);
    setInterval(gameLoop, 66);
    function gameLoop(){

      var screen = [];

      // for the length of the screenwidth (one frame)
      for(var i = 0; i < nScreenWidth; i++){

        // calculates the ray angle into the world space
        // take the current player angle, subtract half the field of view
        // and then chopping it up into little bits of the screen width (at the current colum)
        var fRayAngle = (fPlayerA - fFOV / 2) + (i / nScreenWidth) * fFOV;

        var fDistanceToWall = 0;
        var bHitWall = false;

        var fEyeX = Math.sin(fRayAngle); // unit vector for way in player space
        var fEyeY = Math.cos(fRayAngle); // I think this determines the line the testing travels along

        while(!bHitWall && fDistanceToWall < fDepth){
          fDistanceToWall += 0.1;

          var nTestX = parseInt( (parseInt(fPlayerX) + fEyeX * fDistanceToWall) );
          var nTestY = parseInt( (parseInt(fPlayerY) + fEyeY * fDistanceToWall) );

          // test if Ray is out of bounds
          if(nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight){
            bHitWall = true;
            // TODO: Figure out why this didn't work
            // fDistanceToWall = fDepth;
          }else{
            // Ray is in the bounds, so let's see if the ray cell wall is a block, however it works.
            // converts our position in 3D space into 2D (because the map is stored in a 2D array)
            if(map[nTestY * nMapWidth + nTestX == '#']){
              bHitWall = true;

              // Exp: fDistanceToWall will retain it's distance value;
            }
          }
        } // end angle loop


        // based on the distance to wall, determine how much floor and ceiling to show per column,
        // or, to put in another way, how big or small to paint the rendered wall
        var nCeiling = (nScreenHeight / 2.0) - nScreenHeight / fDistanceToWall;
        var nFloor = nScreenHeight - nCeiling;

        // &block;
        // &blk34;
        // &blk12;
        // &blk14;

        var nShade = '&nbsp;';


        // draw the column, one screenheight pixel at a time
        for(var j = 0; j < nScreenHeight; j++){
          if( j < nCeiling){
            // draw ceiling/sky
            screen[j*nScreenWidth+i] = '&nbsp;';
          }
          else if( j > nCeiling && j <= nFloor ){
            // draw wall


            if(fDistanceToWall < fDepth / 4){
              screen[j*nScreenWidth+i] = '&block;';
            }else if(fDistanceToWall < fDepth / 3){
              screen[j*nScreenWidth+i] = '&blk34;';
            }else if(fDistanceToWall < fDepth / 2){
              screen[j*nScreenWidth+i] = '&blk12;';
            }else{
              screen[j*nScreenWidth+i] = '&blk14;';
            }

          }
          else{
            // draw floor
            screen[j*nScreenWidth+i] = '.';
          }
        }



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
        fPlayerA -= 0.2;
      }
      else if(e.keyCode == 100){
        // right arrow (d)
        fPlayerA += 0.2;
      }
      else if(e.keyCode == 119){
        // forward arrow (w)
        fPlayerX += Math.sin(fPlayerA) + 0.2;
        fPlayerY += Math.cos(fPlayerA) + 0.2;
      }
      else if(e.keyCode == 115){
        // backward arrow (s)
        fPlayerX -= Math.sin(fPlayerA) + 0.2;
        fPlayerY -= Math.cos(fPlayerA) + 0.2;
      }
    };



    // _testCoordinates();
  };


  return{
    init: init,
  }
})();


// ░
// ▒
// ▓
// █ &blk34;


// ▄
// ■
// ▀