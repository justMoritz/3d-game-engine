/**
 * FOR TESTING ONLY
 */

// TODO:
// Map into single file
// Texture sampling should work like this:

map = {
  "sector1": [
    [
      [4,2], 
      [5,4], 
      "sector2",
      "#"
    ],     
    [
      [5,4],
      [2,5],
      false,
      "o"
    ],     
    [
      [2, 5],
      [0.5, 4],
      false,
      "#"
    ],     
    [
      [0.5, 4],
      [0.2, 0.2],
      false,
      "#"
    ],     
    [
      [0.2, 0.2],
      [4, 2],
      false,
      "#"
    ]
  ],
  
  "sector2" : [
    [
      [4,2],
      [5,4],
      "sector1",
      "#"
    ],     
    [
      [4,2],
      [6,1],
      false,
      "o"
    ],     
    [
      [6, 1],
      [7, 2.1],
      false,
      "o"
    ],     
    [
      [7, 2.1],
      [5, 4],
      "sector3",
      "Y"
    ]     
  ],
  
  "sector3" : [
    [
      [7, 2.1],
      [5, 4], 
      "sector2",
      "o"
    ],     
    [
      [7,2.1],
      [8,4],
      false,
      "#"
    ],     
    [
      [8, 4],
      [6, 6],
      false,
      "#"
    ],     
    [
      [6, 6],
      [4.5, 5],
      "sector4",
      "#"
    ],     
    [
      [4.5, 5],
      [5, 4],
      false,
      "#"
    ]     
  ],
  "sector4" : [
    [
      [6, 6],
      [4.5, 5],
      "sector3",
      "#"
    ],     
    [
      [6, 6],
      [6, 10],
      false,
      "Y"
    ],     
    [
      [6, 10],
      [4.5, 10],
      "sector5",
      "o"
    ],     
    [
      [4.5, 10],
      [4.5, 5],
      false,
      "o"
    ]        
  ],

  "sector5" : [
    [
      [4.5, 10],
      [6, 10],
      "sector4",
      "#"
    ],     
    [
      [4.5, 10],
      [4.5, 14],
      false,
      "Y"
    ],     
    [
      [4.5, 14],
      [6, 14],
      false,
      "o"
    ],     
    [
      [6, 14],
      [6, 10],
      "sector6",
      "o"
    ]        
  ],

  "sector6" : [
    [
      [6, 14],
      [6, 10],
      "sector5",
      "#"
    ],     
    [
      [6, 10],
      [15, 11],
      false,
      "Y"
    ],     
    [
      [15, 11],
      [15, 14],
      false,
      "o"
    ],     
    [
      [15, 14],
      [6, 14],
      false,
      "o"
    ]        
  ]

  
}




// 2 2 1 // 1
// A: 3.4 X:6 Y:2.7 // 2
// A: 3.4 X:7.7 Y:3.9 // 3

testmap = {
  nMapHeight: 15,
  nMapWidth: 15,
  map: map,
  fPlayerX: 7.7,
  fPlayerY: 3.9,
  fPlayerA: 3.4,
  fDepth: 30,
  startingSector: 'sector3',
};


// Line with two points on the grid system
// a: x=4 y=2
// b: x=5 y=4
testline = [
  [4,2],
  [5,4]
]






var gameEngineJS = (function () {
  

  /**
   * Loads
   */
  var _loadLevel = function () {
    clearInterval(gameRun);

    // updates the level map, dimensions and textures
    oMap = testmap.map;
    nMapHeight = testmap.nMapHeight;
    nMapWidth = testmap.nMapWidth;
    fDepth = testmap.fDepth || fDepth;
    sPlayerSector = testmap.startingSector || startingSector;

    // places the player at the map starting point
    fPlayerX = testmap.fPlayerX;
    fPlayerY = testmap.fPlayerY;
    fPlayerA = testmap.fPlayerA;

    main();
  };



  // TODO:
  function drawSectorInformation(i , fDistanceToWall, sWalltype, sWallDirection, nCeiling, nFloor, fSampleX){
    // draws (into the pixel buffer) each column one screenheight-pixel at a time
    for (var j = 0; j < nScreenHeight; j++) {
        
      // sky
      if (j < nCeiling) {
          screen[j * nScreenWidth + i] = "a";
      }

      // solid block
      else if (j > nCeiling && j <= nFloor) {

        // Render Texture with Shading
        var sPixelToRender = "0";

        // Don't render if Portal
        if(sWallDirection == "X"){
          return
        }
        else{

          // if(i == 300){
          //   console.log(fSampleX);
          // }

          var fSampleY = (j - nCeiling) / (nFloor - nCeiling);
          // var currentPixel = _getSamplePixel( textures["T"], intersection, fSampleY )

          sPixelToRender = _rh.renderWall(
            fDistanceToWall,
            sWallDirection,
            _getSamplePixel( textures[sWalltype], fSampleX, fSampleY, sWallDirection, true)
          );
        }

        // Does not draw out of bounds pixels
        if( fDistanceToWall < fDepth ){
          screen[j * nScreenWidth + i] = sPixelToRender
        }else{
          screen[j * nScreenWidth + i] = "o"
        }
      } // end solid block

      // floor
      else {
        screen[j * nScreenWidth + i] = "f";
      }
    } // end draw column loop
  }




  /**
   * 
   * @param {string} startingSector 
   * @param {*} i 
   * @param {*} fDistanceToWall 
   * @returns 
   */
  function checkSectors( startingSector, i ){

    var sWallDirection = "N";
    var fDistanceToWall;
    
    var currentSector = startingSector;

    // Queue to store sectors to be checked
    var sectorQueue = [currentSector];
    var visitedSectors = {}; // Object to track visited sectors

    while (sectorQueue.length > 0) {
      // Dequeue the first sector from the queue
      currentSector = sectorQueue.shift();

      // Mark the current sector as visited
      visitedSectors[currentSector] = true;

      var sectorWalls = oMap[currentSector]; // the actual sector object from the level file

      // for each wall in a sector
      for( var w = 0; w < sectorWalls.length; w++ ){
        // Calculate if the lines of the current eye-vector and the testline variable above intersect,
        // If so, at which point, and then use the distance between that point and the player position (fPlayerX and fPlayerY)
        // to set the fDistanceToWall variable :) 

        var currentWall = sectorWalls[w];
        var wallSamplePosition = null;
      
        // Check for intersection of current view vector with the wall-vector we are testing
        var intersection = intersectionPoint(
          { x: fPlayerX, y: fPlayerY },
          { x: fPlayerEndX, y: fPlayerEndY },
          { x: currentWall[0][0], y: currentWall[0][1] },
          { x: currentWall[1][0], y: currentWall[1][1] }
        );

        // If there is an intersection, update fDistanceToWall
        if (!isNaN(intersection.x) && !isNaN(intersection.y)) {
          fDistanceToWall = Math.sqrt(
            Math.pow(fPlayerX - intersection.x, 2) +
            Math.pow(fPlayerY - intersection.y, 2)
          );


          // Fisheye correction
          fDistanceToWall *= Math.cos(fAngleDifferences)
          
          // preliminary wall shading:
          if(w % 2 == 0){
            sWallDirection = "S";
          }else{
            sWallDirection = "E";
          }

          // TODO:
          // Wall detection:
          // 1) we know where the wall was hit, this is our x-sampling point
          // 2) we also know the starting and stopping coordinates of the wall
          // 3) we can use the start and end corrdinate of the wall to normalize the sample position
          // 4) Y coordinate stays as is


          // Standard Wall Type
          
          if(currentWall[3] != false){
            sWallType = currentWall[3];
          }


          // if the current sector we are looking at has a portal (currentwall[2] !== false)
          // don't draw that wall
          if(currentWall[2] != false){
            sWallDirection = "X";
            nextSector = currentWall[2];

            // If the next sector hasn't been visited yet, enqueue it for checking
            if (!visitedSectors[nextSector]) {
              sectorQueue.push(nextSector);
            }
          }
          else{

            wallSamplePosition = Math.abs(intersection.x - intersection.y)

            var nCeiling = fscreenHeightFactor - nScreenHeight / fDistanceToWall;
            var nFloor = fscreenHeightFactor + nScreenHeight / fDistanceToWall;
            fDepthBuffer[i] = fDistanceToWall;
          
            drawSectorInformation(i , fDistanceToWall, sWallType, sWallDirection, nCeiling, nFloor, wallSamplePosition)
          }


        }
        
        

      } // end iterate over all walls

    }
  };




  /**
   * The basic game loop
   */
  var main = function () {
    gameRun = setInterval(gameLoop, 33);
    function gameLoop() {

      _moveHelpers.move();

      // normalize player angle
      if (fPlayerA < 0) {
        fPlayerA += PIx2;
      }
      if (fPlayerA > PIx2) {
        fPlayerA -= PIx2;
      }

      /**
       * Drawing related
       */

      

      // Some constants for each loop
      var fPerspectiveCalculation = (2 - nJumptimer * 0.15 - fLooktimer * 0.15);
      fscreenHeightFactor = nScreenHeight / fPerspectiveCalculation;




      // for the length of the screenwidth (one frame)
      // One screen-width-pixel at a time, cast a ray
      for (var i = 0; i < nScreenWidth; i++) {
        // calculates the ray angle into the world space
        // take the current player angle, subtract half the field of view

        // var fDistanceToWall = 0;

              
        // Calculate the direction of the current ray
        var fRayAngle = fPlayerA - fFOV / 2 + (i / nScreenWidth) * fFOV;
        var fEyeX = Math.cos(fRayAngle);
        var fEyeY = Math.sin(fRayAngle);
        var rayLength = fDepth;
        fPlayerEndX = fPlayerX + fEyeX * rayLength;
        fPlayerEndY = fPlayerY + fEyeY * rayLength;


        fAngleDifferences =  fPlayerA - fRayAngle ;
        
        // TODO: reimplement
        // the looking up and down “reverse-fisheyes” the effect. Similar to the skewing of the final image effect,
        // This corrects for this perspective
        // var angleCorrection = (10 - _skipEveryXrow(fLooktimer)) * 0.1; 
        var angleCorrection = 0;

        if( angleCorrection == 1 ){
          angleCorrection = 0;
        }
        fAngleDifferences *= 1- angleCorrection/4;

        // normalize
        if ( fAngleDifferences < 0) {
          fAngleDifferences += PIx2;
        }
        if (fAngleDifferences > PIx2) {
          fAngleDifferences -= PIx2;
        }


        // checks the current sector, and potentially updates the sector the player might be in
        // TODO: Consider not passing fDistanceToWall
        checkSectors(sPlayerSector, i);


      } // end column loop

      _fDrawFrame(screen);
    }
  };

  var init = function (input) {
    // prep document
    eScreen = document.getElementById("display");
    eCanvas = document.getElementById("seconddisplay");
    cCtx    = eCanvas.getContext("2d");
    eDebugOut = document.getElementById("debug");
    eTouchLook = document.getElementById("touchinputlook");
    eTouchMove = document.getElementById("touchinputmove");

    _moveHelpers.keylisten();
    _moveHelpers.mouseinit();
    _moveHelpers.touchinit();

    // initial gameload
    _loadLevel();
  };

  return {
    init: init,
  };
})();