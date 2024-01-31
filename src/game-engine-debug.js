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
  var bJumping;
  var bFalling;
  var bOnObject;
  var bRunning;
  var bPaused;
  var bPlayerMayMoveForward = true;

  var nJumptimer = 0;
  var fLooktimer = 0;
  var fAngleDifferences;

  var fDepthBuffer = [];
  var fDepthBufferO = [];

  // defaults
  var fPlayerX = 14.0;
  var fPlayerY = 1.0;
  var fPlayerA = 1.5;
  var nDegrees = 0;

  var nMapHeight = 16;
  var nMapWidth = 16;
  var map = "";
  var sLevelstring = "";
  var oLevelTextures = false;
  var sCeiling = false;

  var gameRun;
  var animationTimer = 0;

  // █
  // ▓
  // ▒
  // ░

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

    // // pauses, then starts the game loop
    // _testScreenSizeAndStartTheGame();
    // window.addEventListener("resize", function () {
    //   clearInterval(gameRun);
    //   _testScreenSizeAndStartTheGame();
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
  var _getSamplePixel = function (texture, x, y) {
    var scaleFactor = texture["scale"] || defaultTexScale;
    var texWidth = texture["width"] || defaultTexWidth;
    var texHeight = texture["height"] || defaultTexHeight;

    // TODO: Let's make this the default, and have the texture pass fault for legacy implementations
    var noColor = texture["noColor"] || false;
    
    // console.log(noColor);

    var texpixels = texture["texture"];

    if (texture["texture"] == "DIRECTIONAL") {
        // Different Texture based on viewport
        if (nDegrees > 0 && nDegrees < 180) {
            texpixels = texture["S"];
        } else {
            texpixels = texture["N"];
        }
    }

    scaleFactor = scaleFactor || 2;
    
    x = (scaleFactor * x) % 1;
    y = (scaleFactor * y) % 1;

    var sampleX = ~~(texWidth * x);
    var sampleY = ~~(texHeight * y);

    var samplePosition = texWidth * sampleY + sampleX;
    var samplePosition2 = (texWidth * sampleY + sampleX) * 2;

    var currentColor;
    var currentPixel;

    // return ["#", "b"]; // TODO: Remove — Debugger, check if sampler is the issue (doesn't look like it)

    if (x < 0 || x > texWidth || y < 0 || y > texHeight) {
      return "+";
    } else {
      
      if( noColor ){
        currentPixel = texpixels[samplePosition];
        currentColor = 'm';
      }else{
        currentPixel = texpixels[samplePosition2];
        currentColor = texpixels[samplePosition2+1];
      }
  
      return [currentPixel, currentColor];
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


  /**
   * CURRENTLY NOT USED, BUT MIGHT BE USEFUL FOR UI TYPE ELEMENTS LATER
   * Determines with Pixels to use, sInput
   * @param  {string} oInput    Main Pixel
   * @param  {string} sOverlay  Overlay Pixel
   * @param  {int} nIndex       Index
   * @return {[string]}         Final Pixel
   */
  var _printCompositPixel = function (sInput, sOverlay, nIndex) {
    var sOutput = "";
    // if sOverlay !0, appends it to the output instead
    if (sOverlay && sOverlay[nIndex] != 0) {
      sOutput += sOverlay[nIndex];
    } else {
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
  var _fPrepareFrame = function (oInput, eTarget) {
    var eTarget = eTarget || eScreen;
    var sOutput = [];

    // this is the maximum of variation created by the lookup timer, aka the final look-modifier value
    var neverMoreThan = Math.round(
      nScreenHeight / _skipEveryXrow(fLooktimer) - 1
    );

    // used to skew the image
    var globalPrintIndex = 0;
    var fLookModifier = 0;

    // if looking up, the starting point is the max number of pixesl to indent,
    // which will be decremented, otherwise it remains 0, which will be incremented
    if (fLooktimer > 0 && isFinite(neverMoreThan)) {
      fLookModifier = neverMoreThan;
    }

    // iterate each row at a time
    for (var row = 0; row < nScreenHeight; row++) {
      // increment the fLookModifier every time it needs to grow (grows per row)
      if (_everyAofB(row, _skipEveryXrow(fLooktimer))) {
        if (fLooktimer > 0) {
          // looking up
          fLookModifier--;
        } else {
          fLookModifier++;
        }
      }

      // print filler pixels
      for (var i = 0; i < fLookModifier; i++) {
        sOutput.push(".");
      }

      var toBeRemoved = 2 * fLookModifier;
      var removeFrom = [];

      //  make a new array that contains the indices of the elements to print
      // (removes X amount of elements from array)
      var items = [];
      for (var i = 0; i <= nScreenWidth; i++) {
        items.push(i);
      }

      // list to be removed from each row:
      // [1,2,3,4,5,6,7,8]
      // [1,2, ,4,5, ,7,8]
      //   [1,2,4,5,7,8]
      removeFrom = _evenlyPickItemsFromArray(items, toBeRemoved);

      // loops through each rows of pixels
      for (var rpix = 0; rpix < nScreenWidth; rpix++) {
        // print only if the pixel is in the list of pixels to print
        if (removeFrom.includes(rpix)) {
          // don"t print
        } else {
          // print
          sOutput.push( oInput[globalPrintIndex] );
          // sOutput.push(_printCompositPixel(oInput, oOverlay, globalPrintIndex));
        }

        globalPrintIndex++;
      } // end for(rpix

      // print filler pixels
      for (var i = 0; i < fLookModifier; i++) {
        sOutput.push(".");
      }
    } // end for(row

    return sOutput;
  };

  var _drawToCanvas = function ( pixels, removePixels ) {
    // Assuming your canvas has a width and height
    // canvas.width = nScreenWidth - removePixels/2;
    // _debugOutput( eCanvas.width );

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
    var frame = _fPrepareFrame(screen);
    var target = target || eScreen;

    var sOutput = "";
    var sCanvasOutput = "";

    // interates over each row again, and omits the first and last 30 pixels, to disguise the skewing!
    var printIndex = 0;
    var removePixels = nScreenHeight / 2;

    
    for (var row = 0; row < nScreenHeight; row++) {
      for (var pix = 0; pix < nScreenWidth; pix++) {
        // H-blank based on screen-width
        if (printIndex % nScreenWidth == 0) {
          sOutput += "<br>";
        }

        if (pix < removePixels) {
          sOutput += "";
          sCanvasOutput += "4";
        } else if (pix > nScreenWidth - removePixels) {
          sOutput += "";
          sCanvasOutput += "4";
        } else {
          sOutput += frame[printIndex];
          sCanvasOutput += frame[printIndex];
        }

        printIndex++;
      }
    }
    target.innerHTML = sOutput;
    _drawToCanvas( sCanvasOutput, removePixels );
  };



  // various shaders for walls, ceilings, objects
  // _renderHelpers
  //
  // each texture has 4 values: 3 hues plus black
  // each value can be rendered with 5 shades (4 plus black)
  var _rh = {
    // The 4 color values for these start at this point in the array  
    colorReferenceTable:{
      m: ['1', '2', '3', '4'],
      b: ['a', 'b', 'c', 'd'],
      p: ['e', 'f', 'g', 'h'],
      r: ['i', 'j', 'k', 'l'],
      o: ['m', 'n', 'o', 'p'],
      g: ['q', 'r', 's', 't'],
      t: ['u', 'v', 'w', 'x'],
    },
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
    renderWall: function (fDistanceToWall, sWallDirection, pixelArray) {

      var pixel = pixelArray[0];
      var color = pixelArray[1] || 'm';

      // console.log( color )

      // There are 4 lightness values in each color
      // This assigns the appropriate color value to the current pixel

      var b255 = "4";
      var b100 = _rh.colorReferenceTable[color][3];
      var b75  = _rh.colorReferenceTable[color][2];
      var b50  = _rh.colorReferenceTable[color][1];
      var b25  = _rh.colorReferenceTable[color][0];
      var b0   = "0";

      var fDepthRatio1 = fDepth / 5.5;
      var fDepthRatio2 = fDepth /3.66;
      var fDepthRatio3 = fDepth /2.33;

      // Set default fill value
      let fill = b0;

      
      // "&#9109;"; // ⎕
      
      // var b0   = ".";
      // var b20  = "&#9617;"; // ░
      // var b40  = "&#9618;"; // ▒
      // var b60  = "&#9618;"; // ▒
      // var b80  = "&#9619;"; // ▓
      // var b100 = "&#9608;"; // █

      // TODO: (maybe) Convert to lookuptable?

      // Controls the depth shading
      switch (sWallDirection) {
        // Sprites and voxels
        case "V":
          if (fDistanceToWall < fDepthRatio1) {
            if (pixel === "#")fill = b100;
            else if (pixel === "7") fill = b75;
            else if (pixel === "*" ) fill = b50;
            else if (pixel === "o") fill = b25;
            else fill = b25;
          } else if (fDistanceToWall < fDepthRatio2) {
            if (pixel === "#") fill = b75;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" ) fill = b25;
            else if (pixel === "o") fill = b25;
            else fill = b0;
          } else if (fDistanceToWall < fDepthRatio3) {
            if (pixel === "#") fill = b75;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b25;
          } else if (fDistanceToWall < fDepth) {
            if (pixel === "#") fill = b50;
            else if (pixel === "7") fill = b25;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b0;
          }
          break;

        // North/South direction
        case "N":
        case "S":
          if (fDistanceToWall < fDepthRatio1) {
            if (pixel === "#")fill = b100;
            else if (pixel === "7") fill = b75;
            else if (pixel === "*" ) fill = b50;
            else if (pixel === "o") fill = b25;
            else fill = b25;
          } else if (fDistanceToWall < fDepthRatio2) {
            if (pixel === "#") fill = b100;
            else if (pixel === "7") fill = b75;
            else if (pixel === "*" ) fill = b50;
            else if (pixel === "o") fill = b25;
            else fill = b25;
          } else if (fDistanceToWall < fDepthRatio3) {
            if (pixel === "#") fill = b75;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b25;
          } else if (fDistanceToWall < fDepth) {
            if (pixel === "#") fill = b50;
            else if (pixel === "7") fill = b25;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b0;
          }
          break;

        // West/East direction
        case "W":
        case "E":
          if (fDistanceToWall < fDepthRatio1) {
            if (pixel === "#")fill = b75;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" ) fill = b50;
            else if ( pixel === "o") fill = b25;
            else fill = b0;
          } else if (fDistanceToWall < fDepthRatio2) {
            if (pixel === "#") fill = b75;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" ) fill = b25;
            else if (pixel === "o") fill = b25;
            else fill = b0;
          } else if (fDistanceToWall < fDepthRatio3) {
            if (pixel === "#") fill = b50;
            else if (pixel === "7") fill = b50;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b0;
          } else if (fDistanceToWall < fDepth) {
            if (pixel === "#") fill = b25;
            else if (pixel === "7") fill = b25;
            else if (pixel === "*" || pixel === "o") fill = b25;
            else fill = b0;
          }
          break;
      
      }


      return fill;
    },
    renderWallDebug: function (fDistanceToWall, sWallDirection, pixelArray) {
      // Set default fill value
      let fill = "a";
      // Controls the depth shading
      switch (sWallDirection) {
        // Sprites and voxels
        case "V":
        case "N":
        case "S":
          fill = 'f';
          break;
        case "W":
        case "E":
          fill = 'm';
          break;
      }
      return fill;
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

      // if(bOnObject){
      //   fYMoveBy /= 4;
      // }
    
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

    // mouse
    mouseinit: function () {
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

    // initialize the touch listeners for walk and move areas
    touchinit: function () {
      // look (left hand of screen)
      eTouchLook.addEventListener("touchmove", function (e) {
        // fetches differences from input
        var oDifferences = _moveHelpers.touchCalculate(
          _moveHelpers.oTouch.look,
          e
        );

        // makes sure no crazy
        if (oDifferences.x < 10 && oDifferences.x > -10) {
          _moveHelpers.oTouch.look.bFirstTouch = false;
        }

        if (!_moveHelpers.oTouch.look.bFirstTouch) {
          // left and right
          fPlayerA += oDifferences.x * 0.005;

          // up and down
          _moveHelpers.yMoveUpdate(oDifferences.y, 0.1);
        }
      });

      // reset look
      eTouchLook.addEventListener("touchend", function () {
        _moveHelpers.oTouch.look.x = 0;
        _moveHelpers.oTouch.look.y = 0;
        _moveHelpers.oTouch.look.bFirstTouch = true;
      });

      // move (right hand of screen)
      eTouchMove.addEventListener("touchmove", function (e) {
        var oDifferences = _moveHelpers.touchCalculate(
          _moveHelpers.oTouch.move,
          e
        );

        // makes sure no crazy
        if (oDifferences.x < 10 && oDifferences.x > -10) {
          _moveHelpers.oTouch.move.bFirstTouch = false;
        }

        // first touch will be a huge difference, that"s why we only move after the first touch
        if (!_moveHelpers.oTouch.move.bFirstTouch) {
          // walk
          fPlayerX -=
            (Math.sin(fPlayerA) + 5.0 * 0.0051) * oDifferences.x * 0.05;
          fPlayerY +=
            (Math.cos(fPlayerA) + 5.0 * 0.0051) * oDifferences.x * 0.05;

          // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
            _moveHelpers.checkExit();
            fPlayerX +=
              (Math.sin(fPlayerA) + 5.0 * 0.0051) * oDifferences.x * 0.05;
            fPlayerY -=
              (Math.cos(fPlayerA) + 5.0 * 0.0051) * oDifferences.x * 0.05;
          }

          // strafe
          fPlayerX +=
            (Math.cos(fPlayerA) + 5.0 * 0.0051) * -oDifferences.y * 0.05;
          fPlayerY +=
            (Math.sin(fPlayerA) + 5.0 * 0.0051) * -oDifferences.y * 0.05;

          // converts coordinates into integer space and check if it is a wall (!.), if so, reverse
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] != ".") {
            _moveHelpers.checkExit();
            fPlayerX -=
              (Math.cos(fPlayerA) + 5.0 * 0.0051) * -oDifferences.y * 0.05;
            fPlayerY -=
              (Math.sin(fPlayerA) + 5.0 * 0.0051) * -oDifferences.y * 0.05;
          }
        }
      });

      // reset move
      eTouchMove.addEventListener("touchend", function () {
        _moveHelpers.oTouch.move.x = 0;
        _moveHelpers.oTouch.move.y = 0;
        _moveHelpers.oTouch.move.bFirstTouch = true;
      });
    },

    checkExit: function () {
      // if we hit an exit
      if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] == "X") {
        _loadLevel(window[sLevelstring].exitsto);
      }
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
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] == "," && (bJumping || bFalling || bOnObject) ) {
            bOnObject = true;
          }else{
            _moveHelpers.checkExit();
            fPlayerX -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
            fPlayerY += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          }
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
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] == "," && (bJumping || bFalling || bOnObject) ) {
            bOnObject = true;
          }else{
            _moveHelpers.checkExit();
            fPlayerX += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
            fPlayerY -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          }
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
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] == "," && (bJumping || bFalling || bOnObject) ) {
            bOnObject = true;
          }else{
            _moveHelpers.checkExit();
            fPlayerX -= (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
            fPlayerY -= (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          }
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
          if (map[~~fPlayerY * nMapWidth + ~~fPlayerX] == "," && (bJumping || bFalling || bOnObject) ) {
            bOnObject = true;
          }else{
            _moveHelpers.checkExit();
            fPlayerX += (Math.cos(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
            fPlayerY += (Math.sin(fPlayerA) + 5.0 * 0.0051) * fMoveFactor;
          }
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

        var fSampleX = 0.0;
        var sWallDirection = "N";

        var fRayLength = 0.0;

        // The smaller, the finer, and slower. 
        var fGrainControl = 0.01;

        var prevColumnChar = ".";
        var nextColumnChar = ".";

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

          var testXr = Math.round(fPlayerX + fEyeX * fRayLength); //  2.7 + (-0.4774170385358938) * 1.2400000000000009 = 2.108002872215491  ,rounded is 2
          var testYr = Math.round(fPlayerY + fEyeY * fRayLength); //  2.8 + (0.8786768298502111) * 1.2400000000000009  = 3.889559269014263  ,rounded is 4

          var testXd = Math.floor(fPlayerX + fEyeX * fRayLength); 
          var testYd = Math.floor(fPlayerY + fEyeY * fRayLength); 

          var testXf = fPlayerX + fEyeX * fRayLength; //  2.7 + (-0.4774170385358938) * 1.2400000000000009 = 2.108002872215491
          var testYf = fPlayerY + fEyeY * fRayLength; //  2.8 + (0.8786768298502111) * 1.2400000000000009  = 3.889559269014263


          // Define a small offset value
          var offset = 0.001; // Adjust this value as needed
          // Calculate the ray's position with the offset
          var rayPosX = fPlayerX + fEyeX * fRayLength + offset;
          var rayPosY = fPlayerY + fEyeY * fRayLength + offset;
          // Round the ray's position to the nearest integer
          var testXc = ~~(rayPosX);
          var testYc = ~~(rayPosY);


          // Coordinates of all neighboring cells
          var currentCell  = testYn  * nMapWidth + testXn ; // 3 * 7 + 2 = 23
          var currentCellR = testYr * nMapWidth + testXr; // 4 * 7 + 2 = 30
          var currentCellD = testYd * nMapWidth + testXd; 
          var currentCellF = testYf  * nMapWidth + testXf ; // 3.889559269014263 * 7 + 2.108002872215491 = 29.33491775531533
          var currentCellC = testYc  * nMapWidth + testXc ; 
          

          // use these as text coordinates
          // STANDARD
          // var useThisAsCurrentCell = currentCell;
          // nTestX = testXn;
          // nTestY = testYn;

          // // ROUNDED
          // var useThisAsCurrentCell = currentCellR;
          // nTestX = testXr;
          // nTestY = testYr;


          // // ROUNDED DOWN
          // var useThisAsCurrentCell = currentCellD;
          // nTestX = testXd;
          // nTestY = testYd;

          // FLOATING POINT CALC
          // var useThisAsCurrentCell = ~~currentCellF;
          // nTestX = ~~testXf;
          // nTestY = ~~testYf;

          // CHATTY
          var useThisAsCurrentCell = currentCellC;
          nTestX = testXc;
          nTestY = testYc;

          
          // TODO: DEBUG
          // console.log(i);
          // if(i = 239){
          //   console.log( `Ray Length: ${fRayLength}` ); // often comes out to undefined?? // DEBUG
          //   console.log( `  Array-offset ${nTestY * nMapWidth + nTestX}` );
          //   console.log( `  Glyph: ${map[nTestY * nMapWidth + nTestX]}` ); // often comes out to undefined?? // DEBUG
          //   // it looks like the problem is the angle. The way the angle is calculated, it “misses” blocks close at their edge. 
          //   // I think it's either a matter of rounding up or down, not yet sure which, and some sort of logic associated with it
          //   // Maybe remember if we hit a block already, check to the left and right of that block as well? Something like that
          // }

          // Fails at line 239 with the following output:
          // Ray Length: 1.2400000000000009
          // game-engine-debug.js?v=0.2.0:1223   Array-offset 31
          // game-engine-debug.js?v=0.2.0:1224   Glyph: C
          
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
            if (fTestAngle >= PIx0_25 && fTestAngle < PIx0_75) {
              fSampleX = fTestPointX - +nTestX;
              sWallDirection = "N";
            }
            if (fTestAngle < -PIx0_25 && fTestAngle >= -PIx0_75) {
              fSampleX = fTestPointX - +nTestX;
              sWallDirection = "S";
            }
            if (fTestAngle >= PIx0_75 || fTestAngle < -PIx0_75) {
              fSampleX = fTestPointY - +nTestY;
              sWallDirection = "E";
            }
          } 
          // END TEST FOR WALLS

        
        } /** End Ray Casting Loop **/


        // TODO: DEBUG   for debugging
        // This determines in test.map, where we miss a wall
        // if(fDistanceToWall == "9"){
        //   console.log(i);
        // }
        // (in test.map, screen-line 240 bounds, i.e. never a block)
        // console.log(`${fDistanceToWall} (Distance)`);
        // console.log(`    At angle ${ fRayAngle }, X: ${fEyeX}, Y: ${fEyeY}`);


        // at the end of ray casting, we should have the lengths of the rays
        // set to their last value, representing their distances.
        // Based on the distance to wall, determine how much floor and ceiling to show per column,
        // Adding in the recalc for looking (fLookTimer) and jumping (nJumptimer)
        // // var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
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
              var fSampleY = (j - nCeiling) / (nFloor - nCeiling);

              // Render Texture with Shading
              var sPixelToRender = "0";

              // Standard Textures
              if (sWalltype == "#") {
                
                if(sWallDirection == "N" || sWallDirection == "S"){
                  sPixelToRender = "a"
                }else{
                  sPixelToRender = "b"
                }
              }else{
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

            // render whatever char is on the map as walltype
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
    _moveHelpers.mouseinit();
    _moveHelpers.touchinit();

    // initial gameload
    _loadLevel("test.map");
  };

  return {
    init: init,
  };
})();