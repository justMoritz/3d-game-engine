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
 * 
 * 
 * TODO: Performance DROPS SIGNIFICANTLY when one is close to a color-sprite!! 
 *         Possibly too many lookups?
 */

function approximatelyEqual(a, b, epsilon) {
  return Math.abs(a - b) < epsilon;
}

var epsilon = 0.0001;

var gameEngineJS = (function () {
  // constants
  var PI___ = +Math.PI;
  var PI_0 = 0.0;
  var PIx0_25 = +(PI___ * 0.25);
  var PIx05 = +(PI___ * 0.5);
  var PIx0_75 = +(PI___ * 0.75);
  var PIx1 = PI___;
  var PIx1_5 = +(PI___ * 1.5);
  var PIx2 = +(PI___ * 2.0);
  var I80divPI = 180 / PI___;
  var PIdiv4 = PI___ / 4.0;

  // setup variables
  var eScreen;
  var eCanvas;
  var cCtx;
  var eDebugOut;

  var nScreenWidth = 420;
  var nScreenHeight = 120;

  // var fFOV = PI___ / 1.4; // (PI___ / 4.0 originally)
  var fFOV = PI___ / 1.8; // (PI___ / 4.0 originally)
  var fDepth = 16.0; // viewport depth
  var nLookLimit = 8;

  var bTurnLeft;
  var bTurnRight;
  var bStrafeLeft;
  var bStrafeRight;
  var bMoveForward;
  var bMoveBackward;
  var bRunning;
  var bPaused;
  var bPlayerMayMoveForward = true;

  var nJumptimer = 0;
  var fLooktimer = 0;

  var fDepthBuffer = [];

  // defaults
  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.5;

  var nMapHeight = 16;
  var nMapWidth = 16;
  var map = "";
  var sLevelstring = "";

  var gameRun;


  var _randomIntFromInterval = function (min, max) {
    // min and max included
    return ~~(Math.random() * (max - min + 1) + min);
  };

  // generates only pogels that can be placed
  var _generateRandomCoordinates = function () {
    var x = +_randomIntFromInterval(0, nMapWidth) + 0;
    var y = +_randomIntFromInterval(0, nMapHeight) - 0;

    while (map[~~y * nMapWidth + ~~x] != ".") {
      x = +_randomIntFromInterval(0, nMapWidth) + 1;
      y = +_randomIntFromInterval(0, nMapHeight) - 1;
    }

    var oCoordinates = {
      x: x,
      y: y,
    };

    return oCoordinates;
  };

  // generate random Sprites
  var _generateRandomSprites = function (nNumberOfSprites) {
    nNumberOfSprites =
      nNumberOfSprites || Math.round((nMapWidth * nMapWidth) / 15);
    // generates random Pogels or Obetrls! :oooo
    var oRandomLevelSprites = {};
    for (var m = 0; m < nNumberOfSprites; m++) {
      var randAngle = _randomIntFromInterval(0, PIx2);
      var nSpriteRand = _randomIntFromInterval(0, 3);
      var randomCoordinates = _generateRandomCoordinates();
      var oRandomSprite = {
        x: randomCoordinates.x,
        y: randomCoordinates.y,
        r: randAngle,
        name: nSpriteRand === 1 ? "O" : "P",
        move: true,
        speed: _randomIntFromInterval(0, 5) * 0.01,
        stuckcounter: 0,
      };
      oRandomLevelSprites[m] = oRandomSprite;
    }
    return oRandomLevelSprites;
  };

  /**
   * Loads
   * @param  {[string]} level The Level file
   * @return {[type]}       [description]
   */
  var _loadLevel = function (level) {
    clearInterval(gameRun);

    sLevelstring = level.replace(".map", ""); // sets global string

    var loadScriptAsync = function (uri, sLevelstring) {
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

    levelLoaded.then(function () {
      // updates the level map, dimensions and textures
      map = window[sLevelstring].map;
      nMapHeight = window[sLevelstring].nMapHeight;
      nMapWidth = window[sLevelstring].nMapWidth;
      fDepth = window[sLevelstring].fDepth || fDepth;
      oLevelTextures = window[sLevelstring].textures || false;
      sCeiling = window[sLevelstring].ceiling || false;

      // places the player at the map starting point
      fPlayerX = window[sLevelstring].fPlayerX;
      fPlayerY = window[sLevelstring].fPlayerY;
      fPlayerA = window[sLevelstring].fPlayerA;

      // load sprites
      oLevelSprites = window[sLevelstring].sprites;

      if (oLevelSprites == "autogen") {
        oLevelSprites = _generateRandomSprites();
      }

      document.querySelector("body").style.color = window[sLevelstring].color;
      document.querySelector("body").style.background =
        window[sLevelstring].background;
    });

    main();

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
  function _toConsumableArray(arr) {
    return (
      _arrayWithoutHoles(arr) ||
      _iterableToArray(arr) ||
      _unsupportedIterableToArray(arr) ||
      _nonIterableSpread()
    );
  }
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
  var _debugOutput = function (input) {
    eDebugOut.innerHTML = input;
  };

  // returns true every a-th interation of b
  var _everyAofB = function (a, b) {
    return a && a % b === 0;
  };

  // lookup-table “for fine-control” or “for perfomance”
  // …(but really because I couldn"t figure out the logic [apparently] )
  var _skipEveryXrow = function (input) {
    input = Math.round(input);
    switch (Number(input)) {
      case 0:
        return 0;
        break;
      case 1:
        return 8;
        break;
      case 2:
        return 6;
        break;
      case 3:
        return 4;
        break;
      case 4:
        return 3;
        break;
      case 5:
        return 2;
        break;
      case 6:
        return 2;
        break;
      case 7:
        return 2;
        break;
      case 8:
        return 1;
        break;

      case -1:
        return 8;
        break;
      case -2:
        return 8;
        break;
      case -3:
        return 7;
        break;
      case -4:
        return 7;
        break;
      case -5:
        return 6;
        break;
      case -6:
        return 6;
        break;
      case -7:
        return 5;
        break;
      case -8:
        return 5;
        break;
      case -9:
        return 4;
        break;
      case -10:
        return 4;
        break;
      case -11:
        return 3;
        break;
      case -12:
        return 3;
        break;
      case -13:
        return 3;
        break;
      case -14:
        return 3;
        break;
      case -15:
        return 3;
        break;
      case -16:
        return 2;
        break;

      default:
        return 0;
    }
  };

  // This is a better version, but it's been optimized into a bit of a black box now
  var _skipEveryXrowBB = function (input) {
    input = input | 0; // Equivalent to Math.round(input)
  
    if (input === 0 || input > 8 || input < -16) {
      return 0;
    }
  
    if (input >= 1) {
      return Math.max(1, (8 / input + 0.5) | 0);
    }
  
    // For negative values
    return Math.max(2, (8 / (Math.abs(input) + 1) + 0.5) | 0);
  };


  var _drawToCanvas = function ( pixels ) {
    // Assuming your canvas has a width and height

    eCanvas.width = nScreenWidth;
    eCanvas.height = nScreenHeight;
    
    // Create an ImageData object with the pixel data
    var imageData = cCtx.createImageData(nScreenWidth, nScreenHeight);
        
    // Convert values to shades of colors
    for (var i = 0; i < pixels.length; i++) {
      var pixelValue = pixels[i];
      var color = _rh.pixelLookupTable[pixelValue] || [0, 0, 0]; // Default to black if not found
      imageData.data[i * 4] = color[0]; // Red 
      imageData.data[i * 4 + 1] = color[1]; // Green 
      imageData.data[i * 4 + 2] = color[2]; // Blue 
      imageData.data[i * 4 + 3] = 255; // Alpha 
    }
    // Use putImageData to draw the pixels onto the canvas
    cCtx.putImageData(imageData, 0, 0);
  }

  var _fDrawFrame = function (screen, target) {
    var frame = screen
    var target = target || eScreen;

    var sOutput = "";
    var sCanvasOutput = "";

    // interates over each row again, and omits the first and last 30 pixels, to disguise the skewing!
    var printIndex = 0;

    for (var row = 0; row < nScreenHeight; row++) {
      for (var pix = 0; pix < nScreenWidth; pix++) {
        // H-blank based on screen-width
        if (printIndex % nScreenWidth == 0) {
          sOutput += "<br>";
        }
        sOutput += frame[printIndex];
        sCanvasOutput += frame[printIndex];
        printIndex++;
      }
    }
    target.innerHTML = sOutput;
    _drawToCanvas( sCanvasOutput );
  };



  // various shaders for walls, ceilings, objects
  // _renderHelpers
  var _rh = {
    // the color values
    pixelLookupTable: {
      0: [0, 0, 0], // Black
      1: [66, 66, 66], // 4 Grey Values
      2: [133, 133, 133],
      3: [200, 200, 200],
      4: [255, 255, 255], // White
      a: [32, 24, 136], // 4 Blues
      b: [32, 56, 232],
      c: [88, 144, 248],
      d: [192, 208, 248],
      e: [136, 0, 112], // 4 pinks (consider replacing with orange/brown)
      f: [184, 0, 184],
      g: [240, 120, 248],
      h: [248, 192, 248],
      i: [160, 0, 0], // 4 reds
      j: [216, 40, 66],
      k: [248, 112, 96],
      l: [248, 184, 176],
      m: [114, 64, 7], // 4 oranges (really yellow)
      n: [136, 112, 0],
      o: [199, 178, 28],
      p: [220, 206, 112],
      q: [0, 80, 0], // 4 greens
      r: [0, 168, 0], 
      s: [72, 216, 72],
      t: [168, 240, 184],
      u: [24, 56, 88], // 4 teals
      v: [0, 128, 136],
      w: [0, 232, 217],
      x: [152, 248, 240],
      // Add more entries as needed
    },
  };

  // keyboard and mouse
  var _moveHelpers = {
    // keystroke listening engine
    keylisten: function () {
      window.onkeydown = function (e) {
        // _debugOutput(e.which);

        if (e.which == 80) {
          // p
          if (bPaused) {
            _testScreenSizeAndStartTheGame();
            bPaused = false;
          } else {
            clearInterval(gameRun);
            bPaused = true;
          }
        }
        if (e.which == 16) {
          // shift
          bRunning = true;
        }
        if (e.which == 32) {
          // space
          bJumping = true;
        }
        if (e.which == 65) {
          // a
          bStrafeLeft = true;
        }
        if (e.which == 68) {
          // d
          bStrafeRight = true;
        }
        if (e.which == 81 || e.which == 37) {
          // q or left
          bTurnLeft = true;
        }
        if (e.which == 69 || e.which == 39) {
          // e or right
          bTurnRight = true;
        }
        if (e.which == 87 || e.which == 38) {
          // w or up
          bMoveForward = true;
        }
        if (e.which == 83 || e.which == 40) {
          // s or down
          bMoveBackward = true;
        }
      };

      window.onkeyup = function (e) {
        if (e.which == 16) {
          // shift
          bRunning = false;
        }
        if (e.which == 32) {
          // space
          bJumping = false;
          bFalling = true;
        }
        if (e.which == 65) {
          // a
          bStrafeLeft = false;
        }
        if (e.which == 68) {
          // d
          bStrafeRight = false;
        }
        if (e.which == 81 || e.which == 37) {
          // q or left
          bTurnLeft = false;
        }
        if (e.which == 69 || e.which == 39) {
          // e or right
          bTurnRight = false;
        }
        if (e.which == 87 || e.which == 38) {
          // w or up
          bMoveForward = false;
        }
        if (e.which == 83 || e.which == 40) {
          // s or down
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
    yMoveUpdate: function (fMoveInput, fMoveFactor) {
      // look up/down (with bounds)
      var fYMoveBy = fMoveInput * fMoveFactor;
    
      // if the looktimer is negative (looking down), increase the speed exponentially
      if (fLooktimer < 0) {
        fYMoveBy = fYMoveBy * Math.pow(1.2, -fLooktimer);
      }else{
        fYMoveBy = fYMoveBy * Math.pow(1.2, fLooktimer);
      }

      // Update the looktimer
      fLooktimer -= fYMoveBy;
    
      // Check and adjust boundaries
      if (fLooktimer > nLookLimit * 0.7 || fLooktimer < -nLookLimit * 2) {
        fLooktimer += fYMoveBy;
      }
    },
    

    mouseLook: function () {
      var fMouseLookFactor = 0.002;

      document.body.requestPointerLock();
      document.onmousemove = function (e) {
        // look left/right
        fPlayerA +=
          e.movementX * fMouseLookFactor ||
          e.mozMovementX * fMouseLookFactor ||
          e.webkitMovementX * fMouseLookFactor ||
          0;

        // look up and down
        _moveHelpers.yMoveUpdate(
          e.movementY || e.mozMovementY || e.webkitMovementY || 0,
          0.05
        );
      };
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
    touchCalculate: function (prev, e) {
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


    // called once per frame, handles movement computation
    move: function () {
      if (bTurnLeft) {
        fPlayerA -= 0.05;
      }

      if (bTurnRight) {
        fPlayerA += 0.05;
      }

      var fMoveFactor = 0.1;
      if (bRunning) {
        fMoveFactor = 0.2;
      }

      if (bStrafeLeft) {
        fPlayerX += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        fPlayerY -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
          fPlayerX -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          fPlayerY += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        }else{
          bOnObject = false;
          bFalling = true;
        }
      }

      if (bStrafeRight) {
        fPlayerX -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        fPlayerY += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
          fPlayerX += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          fPlayerY -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        }else{
          bOnObject = false;
          bFalling = true;
        }
      }

      if (bMoveForward && bPlayerMayMoveForward) {
        fPlayerX += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        fPlayerY += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
          fPlayerX -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          fPlayerY -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        }else{
          bOnObject = false;
          bFalling = true;
        }
      }

      if (bMoveBackward) {
        fPlayerX -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        fPlayerY -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;

        // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
        if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
          fPlayerX += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          fPlayerY += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
        }else{
          bOnObject = false;
          bFalling = true;
        }
      }
    },
  };

  /**
   * The basic game loop
   */
  var main = function () {
    gameRun = setInterval(gameLoop, 33);
    function gameLoop() {

      /**
       * Player-movement related
       */
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
        var fRayAngle = fPlayerA - fFOV / 2 + (i / nScreenWidth) * fFOV; // = 2.068509080159083
        var bBreakLoop = false;
        var fDistanceToWall = 0;
        var bHitWall = false;
        var sWalltype = "#";

        var fEyeX = Math.cos(fRayAngle); // = -0.4774170385358938
        var fEyeY = Math.sin(fRayAngle); // = 0.8786768298502111

        var sWallDirection = "N";

        var fRayLength = 0.0;

        // The smaller, the finer, and slower. 
        var fGrainControl = 0.01;

        /**
         * Ray Casting Loop
         */
        while (!bBreakLoop && fRayLength < fDepth) {
        
          // increment
          fRayLength += fGrainControl;
          // fRayLength = Math.round(fRayLength * 100) / 100
 
          if (!bHitWall) {  
            fDistanceToWall = fRayLength;
          }
          
          // ray position
          var testXn = ~~(fPlayerX + fEyeX * fRayLength); //  2.7 + (-0.4774170385358938) * 1.2400000000000009 = 2.108002872215491  ~~ is 2
          var testYn = ~~(fPlayerY + fEyeY * fRayLength); //  2.8 + (0.8786768298502111) * 1.2400000000000009  = 3.889559269014263  ~~ is 3

          // Coordinates of all neighboring cells
          var currentCell  = testYn  * nMapWidth + testXn ;
          // use these as text coordinates
          // STANDARD
          var useThisAsCurrentCell = currentCell;
          nTestX = ~~(fPlayerX + fEyeX * fRayLength);
          nTestY = ~~(fPlayerY + fEyeY * fRayLength);

          
          // test if ray hits out of bounds
          if (
            nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight
          ) {
            bHitWall = true; // didn't actually, just no wall there
            fDistanceToWall = fDepth;
            bBreakLoop = true;
            
          }
          // TEST FOR WALLS
          else if (map[useThisAsCurrentCell] != ".") {
            bHitWall = true;
            bBreakLoop = true;

            sWalltype = map[useThisAsCurrentCell];

            // 1u wide cell into quarters
            var fBlockMidX = nTestX + 0.5;
            var fBlockMidY = nTestY + 0.5;

            // using the distance to the wall and the player angle (Eye Vectors)
            // to determine the collusion point
            var fTestPointX = fPlayerX + fEyeX * fDistanceToWall;
            var fTestPointY = fPlayerY + fEyeY * fDistanceToWall;

            // now we have the location of the middle of the cell,
            // and the location of point of collision, work out angle
            var fTestAngle = Math.atan2(
              fTestPointY - fBlockMidY,
              fTestPointX - fBlockMidX
            );
            

            // rotate by pi over 4
            if (fTestAngle >= -PIx0_25 && fTestAngle < PIx0_25) {
              fSampleX = fTestPointY - +nTestY;
              sWallDirection = "W";
            }
            else if (fTestAngle >= PIx0_25 && fTestAngle < PIx0_75) {
              fSampleX = fTestPointX - +nTestX;
              sWallDirection = "N";
            }
            else if (fTestAngle < -PIx0_25 && fTestAngle >= -PIx0_75) {
              fSampleX = fTestPointX - +nTestX;
              sWallDirection = "S";
            }
            else if (fTestAngle >= PIx0_75 || fTestAngle < -PIx0_75) {
              fSampleX = fTestPointY - +nTestY;
              sWallDirection = "E";
            }

            if(i > 60 && i < 70){
              console.log(`${sWallDirection}  ${i} : Angle: ${fTestAngle}`);
            }
          } 
          // END TEST FOR WALLS

        
        } /** End Ray Casting Loop **/

        var nCeiling =
          fscreenHeightFactor - nScreenHeight / fDistanceToWall;
        var nFloor =
          fscreenHeightFactor + nScreenHeight / fDistanceToWall;


        // the spot where the wall was hit
        fDepthBuffer[i] = fDistanceToWall;

        // draw the columns one screenheight-pixel at a time
        for (var j = 0; j < nScreenHeight; j++) {
          
          // sky
          if (j < nCeiling) {
              screen[j * nScreenWidth + i] = "0";
          }

          // solid block
          else if (j > nCeiling && j <= nFloor) {

            // Solid Walltype
            if (sWalltype != ".") {

              // Render Texture with Shading
              var sPixelToRender = "0";

              // Standard Textures
              if (sWalltype == "#") {
                if(sWallDirection == "N"){
                  sPixelToRender = "a"
                }
                else if(sWallDirection == "S"){
                  sPixelToRender = "b"
                }
                else if(sWallDirection == "E"){
                  sPixelToRender = "p"
                }
                else{
                  sPixelToRender = "q"
                }
              }
              else{
                sPixelToRender = "h"
              }

              // Does not draw out of bounds pixels
              if( fDistanceToWall < fDepth ){
                // Updates the screen with the pixel
                screen[j * nScreenWidth + i] = sPixelToRender
              }else{
                screen[j * nScreenWidth + i] = "o"
              }
            }
            else {
              screen[j * nScreenWidth + i] = "0";
            }
          } // end solid block

          // floor
          else {
            screen[j * nScreenWidth + i] = "f";
          }
        } // end draw column loop
  
      } // end column loop

      _fDrawFrame(screen);
    }
  };

  // for every row make a nScreenWidth amount of pixels
  var _createTestScreen = function () {
    var sOutput = "";
    for (var i = 0; i < nScreenHeight; i++) {
      for (var j = 0; j < nScreenWidth; j++) {
        sOutput += "0";
      }
      sOutput += "<br>";
    }
    eScreen.innerHTML = sOutput;
  };

  var _getWidth = function () {
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

  var _getHeight = function () {
    return Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
  };

  var nTrymax = 512;
  var _testScreenSizeAndStartTheGame = function () {
    // render a static test screen
    _createTestScreen();

    var widthOfDisplay = eScreen.offsetWidth;
    var widthOfViewport = _getWidth();
    var heightOfViewPort = _getHeight();
    var viewPortAspect = heightOfViewPort / widthOfViewport;

    // check if the amount of pixels to be rendered fit, if not, repeat
    if (widthOfDisplay > widthOfViewport + 120) {
      nScreenWidth = nScreenWidth - 1;
      // nScreenHeight = nScreenWidth * 0.22

      // try no more than nTrymax times (in case of some error)
      if (nTrymax > 0) {
        nTrymax--;
        _testScreenSizeAndStartTheGame();
      } else {
        _debugOutput("Trymax exceeded");
      }
    }
    // if it does, set aspect-ratio-based height
    // and start the game
    else {
      var fAdjustedAspectRatio = viewPortAspect / 2.82;
      // _debugOutput(fAdjustedAspectRatio);

      if (fAdjustedAspectRatio < 0.266) {
        fAdjustedAspectRatio = 0.266;
      }

      nScreenHeight = nScreenWidth * fAdjustedAspectRatio;
      main();
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

    // initial gameload
    _loadLevel("test.map");
  };

  return {
    init: init,
  };
})();