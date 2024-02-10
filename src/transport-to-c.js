testmap = {
  nMapHeight: 7,
  nMapWidth: 7,
  fPlayerX: 2,
  fPlayerY: 2,
  fPlayerA: 1,
  fDepth: 9,
};


// Line with two points on the grid system
// a: x=4 y=2
// b: x=5 y=4
testline = [
  [4,2],
  [5,4]
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

    /**
     * Drawing related
     */

    // holds the frames we"re going to send to the renderer
    var screen = [];

    // Some constants for each loop
    var fPerspectiveCalculation = (2 - nJumptimer * 0.15 - fLooktimer * 0.15);
    var fscreenHeightFactor = nScreenHeight / fPerspectiveCalculation;


    // for the length of the screenwidth (one frame)
    // One screen-width-pixel at a time, cast a ray
    for (var i = 0; i < nScreenWidth; i++) {
      // calculates the ray angle into the world space
      // take the current player angle, subtract half the field of view
      // and then chop it up into equal little bits of the screen width (at the current colum)
      var fRayAngle = fPlayerA - fFOV / 2 + (i / nScreenWidth) * fFOV; 
      var fDistanceToWall = 0;


      var fEyeX = Math.cos(fRayAngle);
      var fEyeY = Math.sin(fRayAngle);



      
      // TODO:
      // Calculate if the lines of the current eye-vector and the testline variable above intersect,
      // If so, at which point, and then use the distance between that point and the player position (fPlayerX and fPlayerY)
      // to set the fDistanceToWall variable :) 


      



      var nCeiling =
        fscreenHeightFactor - nScreenHeight / fDistanceToWall;
      var nFloor =
        fscreenHeightFactor + nScreenHeight / fDistanceToWall;


      // the spot where the wall was hit
      fDepthBuffer[i] = fDistanceToWall;

      // draws (into the pixel buffer) each column one screenheight-pixel at a time
      for (var j = 0; j < nScreenHeight; j++){
         // I got this code already
      }      

    } // end column loop

    _fDrawFrame(screen);
  }
};
