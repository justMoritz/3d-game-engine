function checkSector( currentSector, i , fDistanceToWall, sWalltype, sWallDirection){

  var nextSector = false;
  
  // for each wall in a sector
  for( var w = 0; w < currentSector.length; w++ ){
    // Calculate if the lines of the current eye-vector and the testline variable above intersect,
    // If so, at which point, and then use the distance between that point and the player position (fPlayerX and fPlayerY)
    // to set the fDistanceToWall variable :) 

    var currentWall = currentSector[w];

  
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


    // if the current sector we are looking at has a portal (currentwall[2] !== false)
    // don't draw that wall
    if(currentWall[2] != false){
      sWallDirection = "W";
      nextSector = currentWall[2];
      break;
      // console.log(  )
    }
      // and then (recusively?) check that new sector
      // read what other sector we need to draw after that
    }
    

    var nCeiling =
      fscreenHeightFactor - nScreenHeight / fDistanceToWall;
    var nFloor =
      fscreenHeightFactor + nScreenHeight / fDistanceToWall;


    // the spot where the wall was hit
    fDepthBuffer[i] = fDistanceToWall;

    drawSectorInformation(i , fDistanceToWall, sWalltype, sWallDirection, nCeiling, nFloor)

  } // end iterate over all walls
  
  if(nextSector && currentSector != window[nextSector]){
    checkSector(window[nextSector], i, fDistanceToWall, sWalltype, sWallDirection);
  }

  return nextSector;
};


sector1 = [
  // s1 wall 0
  [
    [4,2], // point 1
    [5,4], // point 2
    'sector2'
  ],     
  // s1 wall 1
  [
    [5,4],
    [2,5],
    false
  ],     
  // s1 wall 2
  [
    [2, 5],
    [0.5, 4],
    false
  ],     
  // s1 wall 3
  [
    [0.5, 4],
    [0.2, 0.2],
    false
  ],     
  // s1 wall 4
  [
    [0.2, 0.2],
    [4, 2],
    false
  ],
]

// s1_wall_0 needs to be a portal to
// s2_wall_0

sector2 = [
  // s2 wall 0
  [
    [4,2], // point 1
    [5,4], // point 2
    'sector1'
  ],     
  // s2 wall 1
  [
    [4,2],
    [6,1],
    false
  ],     
  // s2 wall 2
  [
    [6, 1],
    [7, 2.1],
    false
  ],     
  // s2 wall 3
  [
    [7, 2.1],
    [5, 4],
    'sector3'
  ],     
]

sector3 = [
  // s3 wall 0
  [
    [7, 2.1], // point 1
    [5, 4], // point 2
    'sector2',
  ],     
  // s3 wall 1
  [
    [7,2.1],
    [8,4],
    false
  ],     
  // s3 wall 2
  [
    [8, 4],
    [6, 6],
    false
  ],     
  // s3 wall 3
  [
    [6, 6],
    [4.5, 5],
    false
  ],     
  // s3 wall 4
  [
    [4.5, 5],
    [5, 4],
    false
  ],     
]




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

    // Some constants for each loop
    var fPerspectiveCalculation = (2 - nJumptimer * 0.15 - fLooktimer * 0.15);
    fscreenHeightFactor = nScreenHeight / fPerspectiveCalculation;


    // for the length of the screenwidth (one frame)
    // One screen-width-pixel at a time, cast a ray
    for (var i = 0; i < nScreenWidth; i++) {
      // calculates the ray angle into the world space
      // take the current player angle, subtract half the field of view

      var fDistanceToWall = 0;
      var sWalltype = "#";
      var sWallDirection = "N";

            
      // Calculate the direction of the current ray
      var fRayAngle = fPlayerA - fFOV / 2 + (i / nScreenWidth) * fFOV;
      var fEyeX = Math.cos(fRayAngle);
      var fEyeY = Math.sin(fRayAngle);
      var rayLength = fDepth;
      fPlayerEndX = fPlayerX + fEyeX * rayLength;
      fPlayerEndY = fPlayerY + fEyeY * rayLength;


      fAngleDifferences =  fPlayerA - fRayAngle ;
      
      checkSector(sector1, i, fDistanceToWall, sWalltype, sWallDirection);

    } // end column loop

    _fDrawFrame(screen);
  }
};
