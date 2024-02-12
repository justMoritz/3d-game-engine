/**
 * Some Performance enhancers:
 *  - cache π, and various calculations involving π
 *    https://stackoverflow.com/questions/8885323/speed-of-the-math-object-in-javascript
 *
 *  - replace parseInt, Math.floor with bitwise NOT operator ~~
 *  - replace parseFloat with bitwise + operator
 *    https://stackoverflow.com/questions/38702724/math-floor-vs-math-trunc-javascript
 *
 *  - MAYBE: Inline more function calls in high-frequency loops
 *  - MAYBE: Limit Object Access in high-frequency loops
 * 
 * 
 * TODO: Performance DROPS SIGNIFICANTLY when one is close to a color-sprite!! 
 *         Possibly too many lookups?
 */

// TODO: I'm dumb... level-side texture-overrides need to happen at level load, not texture lookup X/

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
    var PIdiv2 = PI___ / 2;
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


        // merges potential level-side textures into the global textures object
        var oLevelTextures = window[sLevelstring].textures || false;
        for (let key in oLevelTextures) {
          if (window[sLevelstring].textures.hasOwnProperty(key)) {
            if (!textures.hasOwnProperty(key)) {
              // If the key is not present in obj1, add it
              textures[key] = oLevelTextures[key];
            } else {
              // If the key is present in obj1, override it
              textures[key] = oLevelTextures[key];
            }
          }
        }


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
     * @param  {object/string} texture -      EITHER: 
     *                                          A complete texture object to be sampled, 
     *                                        OR: 
     *                                          the name of the texture key in either the global
     *                                          / level-side side texture object
     * @param  {float} x -                    The x coordinate of the sample (how much across)
     * @param  {float} y -                    The y coordinate of the sample
     * @param  {string} walldir (optional) -  Direction of cell for different textures per object
     * @return {string}
     */
    var _getSamplePixel = function (texture, x, y, walldir, debug) {

      // Init
      var walldir = walldir || false;

      if(debug){
        // console.log(textures)
        // console.log(texture.sides)
      }
    
      // check if an override for the standard textname exists in the level file
      if( walldir && texture.sides !== undefined ){
        texture = texture.sides[walldir]
      }

      // defaults
      var scaleFactor = texture["scale"] || defaultTexScale;
      var texWidth = texture["width"] || defaultTexWidth;
      var texHeight = texture["height"] || defaultTexHeight;
      var noColor = texture["noColor"] || false;
      
  
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
  
      renderFloor: function (j) {
        var fill = "`";
  
        // b = 1 - (j - nScreenHeight / 2) / (nScreenHeight / 2);
  
        // draw floor, in different shades
        b = 1 - (j - nScreenHeight / (2 - nJumptimer * 0.15 - fLooktimer * 0.15))  / (nScreenHeight / (2 - nJumptimer * 0.15 - fLooktimer * 0.15) );
  
        if (b < 0.25) {
          fill = "t";
        } else if (b < 0.5) {
          fill = "s";
        } else if (b < 0.75) {
          fill = "r";
        } else if (b < 0.9) {
          fill = "q";
        } else {
          fill = "v";
        }
  
        return fill;
      },
  
      renderObjectTop: function (j) {
        var fill = "`";
        
        // draw floor, in different shades
        b = 1 -
          (j - nScreenHeight / (2 - fLooktimer * 0.15)) /
            (nScreenHeight / (2 - fLooktimer * 0.15));
  
        if (b < 0.25) {
          fill = "a";
        } else if (b < 0.5) {
          fill = "a";
        } else if (b < 0.75) {
          fill = "b";
        } else if (b < 0.9) {
          fill = "b";
        } else {
          fill = "d";
        }
  
        return fill;
      },
  
      renderCeiling: function (j) {
        var fill = "`";
  
        // draw ceiling, in different shades
        b = 1 - (j - nScreenHeight / 2) / (nScreenHeight / 2);
        if (b < 0.25) {
          fill = "`";
        } else if (b < 0.5) {
          fill = "-";
        } else if (b < 0.75) {
          fill = "=";
        } else if (b < 0.9) {
          fill = "x";
        } else {
          fill = "#";
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
     * Function that handles movement of all sprites
     */
    var _moveSprites = function () {
      // for each sprite object
      for (var si = 0; si < Object.keys(oLevelSprites).length; si++) {
        var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];
  
        // if the sprite"s move flag is set
        if (sprite["move"]) {
          // var fMovementSpeed = 0.01;
          var fMovementSpeed = sprite["speed"] || 0.03;
  
          // move the sprite along it's radiant line
          sprite["x"] = +sprite["x"] + +Math.cos(sprite["r"]) * fMovementSpeed;
          sprite["y"] = +sprite["y"] + +Math.sin(sprite["r"]) * fMovementSpeed;
  
          // collision coordinates (attempting to center sprite)
          var fCollideY = +sprite["y"] - 0.65; // 0.5
          var fCollideX = +sprite["x"] + 0.125; // 0.25
  
          var fCollideY2 = +sprite["y"] + 0.425; // 0.25
          var fCollideX2 = +sprite["x"] - 0.65; //0.5
  
          if (
            map[~~fCollideY * nMapWidth + ~~fCollideX] != "." ||
            map[~~fCollideY2 * nMapWidth + ~~fCollideX2] != "."
          ) {
            sprite["stuckcounter"]++;
  
            // // reverse last movement
            sprite["x"] =
              +sprite["x"] - +Math.cos(sprite["r"]) * fMovementSpeed * 2;
            sprite["y"] =
              +sprite["y"] - +Math.sin(sprite["r"]) * fMovementSpeed * 2;
  
            // // repeat may help unstuck sprites
            // sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * fMovementSpeed;
            // sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * fMovementSpeed;
            // sprite["x"] = +(sprite["x"]) - +(Math.cos(sprite["r"])) * fMovementSpeed;
            // sprite["y"] = +(sprite["y"]) - +(Math.sin(sprite["r"])) * fMovementSpeed;
  
            // change the angle and visible angle
            sprite["r"] = (+sprite["r"] + PIx1_5) % PIx2; // TODO: sometimes buggie
  
            // if sprite keeps getting stuck, shove it outta there
            if (sprite["stuckcounter"] > 10) {
              sprite["stuckcounter"] = 0;
              sprite["r"] = 0.5;
              sprite["x"] = +sprite["x"] - +Math.cos(sprite["r"]) * 0.5;
              sprite["y"] = +sprite["y"] - +Math.sin(sprite["r"]) * 0.5;
  
              // sprite["move"]  = false;
              // sprite["x"]  = 0;
              // sprite["7"]  = 0;
            }
          }
  
          // if sprite is close to the player, and facing the player, turn around
          if (sprite["z"] < 1 && sprite["a"] !== "B") {
            sprite["r"] = (+sprite["r"] + PIx1_5) % PIx2;
          }
          // if player hits sprite, prevent moving
          if (sprite["z"] < 0.75) {
            bPlayerMayMoveForward = false;
          } else {
            bPlayerMayMoveForward = true;
          }
  
          // TODO: sprites hitting each other
          // for(var sj=0; sj < Object.keys(oLevelSprites).length; sj++ ){
          //   var jsprite = oLevelSprites[Object.keys(oLevelSprites)[sj]];
          //   if( jsprite["z"] - sprite["z"] > 2 ){
          //     jsprite["r"] = (+(sprite["r"]) + PIx1_5 ) % PIx2;
          //   }
          // }
        } // end if sprite move
      }
    };
  
    /**
     * Sorts List
     */
    function _sortSpriteList(b, a) {
      if (a["z"] < b["z"]) {
        return -1;
      }
      if (a["z"] > b["z"]) {
        return 1;
      }
      return 0;
    }
  
    /**
     * Sorts the Sprite list based on distance from the player
     */
    var _updateSpriteBuffer = function () {
      // calculates the distance to the player
      for (var si = 0; si < Object.keys(oLevelSprites).length; si++) {
        var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];
  
        // the distance between the sprite and the player
        var fDistance = Math.hypot(
          sprite["x"] - fPlayerX,
          sprite["y"] - fPlayerY
        );
  
        sprite["z"] = fDistance;
      }
  
      // converts array of objects to list
      var newList = [];
      for (var sj = 0; sj < Object.keys(oLevelSprites).length; sj++) {
        newList.push(oLevelSprites[Object.keys(oLevelSprites)[sj]]);
      }
  
      // sorts the list
      newList = newList.sort(_sortSpriteList);
  
      // make object from array again
      oLevelSprites = {};
      for (var sk = 0; sk < Object.keys(newList).length; sk++) {
        oLevelSprites[sk] = newList[sk];
      }
    };
  
    /**
     * The basic game loop
     */
    var main = function () {
      gameRun = setInterval(gameLoop, 33);
      function gameLoop() {
        /**
         * Game-function related
         */
  
        animationTimer++;
        if (animationTimer > 15) {
          animationTimer = 0;
        }
  
        _updateSpriteBuffer();
        _moveSprites();
  
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
  
        // allows for jumping a certain amount of time
        if (bJumping) {
          nJumptimer++;
        }
        if (nJumptimer > 6) {
          bFalling = true;
          bJumping = false;
          nJumptimer = 6;
        }
        
  
        // falling back down after jump
        if (bFalling && nJumptimer > 1) {
          nJumptimer--;
        }else{
          bFalling = false;
        }
  
        // stop falling
        if (nJumptimer < 1) {
          bFalling = false;
        }
  
        // Ability to climb over `,`-type objects
        if(bOnObject){
          if( nJumptimer < 5 ){
            nJumptimer++;
          }
          bFalling = false;
          bJumping = false;
        }
  
        /**
         * Drawing related
         */
  
        // holds the frames we"re going to send to the renderer
        var screen = [];
        var objectScreenBuffer = [];
  
        // Converts player turn position into degrees (used for texturing)
        nDegrees = ~~(fPlayerA * I80divPI) % 360;
  
        // Some constants for each loop
        var fPerspectiveCalculation = (2 - nJumptimer * 0.15 - fLooktimer * 0.15);
        var fscreenHeightFactor = nScreenHeight / fPerspectiveCalculation;
  
  
        // fisheye / Fish Eye correction 
        var bUsePerspectiveCorrection = true;
        if(bUsePerspectiveCorrection)
          fFOV = 1.4;
  
        // for the length of the screenwidth (one frame)
        for (var i = 0; i < nScreenWidth; i++) {
          // calculates the ray angle into the world space
          // take the current player angle, subtract half the field of view
          // and then chop it up into equal little bits of the screen width (at the current colum)
          var fRayAngle = fPlayerA - fFOV / 2 + (i / nScreenWidth) * fFOV;
          fAngleDifferences =  fPlayerA - fRayAngle ;
  
          // the looking up and down “reverse-fisheyes” the effect. Similar to the skewing of the final image effect,
          // This corrects for this perspective
          var angleCorrection = (10 - _skipEveryXrow(fLooktimer)) * 0.1; 
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
  
          var bBreakLoop = false;
          var bBreakObjectLoop = false;
  
          var fDistanceToWall = 0;
          var fDistanceToObject = 0;
          var fDistanceToInverseObject = 0;
  
          var bHitWall = false;
  
          var bHitObject = false;
          var bHitBackObject = false;
          var bStopObjectSampling = false;
  
          var sWalltype = "#";
          var sObjectType = "0";
  
          var fEyeX = Math.cos(fRayAngle); // I think this determines the line the testing travels along
          var fEyeY = Math.sin(fRayAngle);
  
          var fSampleX = 0.0;
          var fSampleXo = 0.0;
          var sWallDirection = "N";
          var sObjectDirection = "N";
  
          var fRayLength = 0.0;
  
          // The smaller, the finer, and slower. 
          // var fGrainControl = 0.15;
          // var fGrainControl = 0.1;
          var fGrainControl = 0.05;
          // var fGrainControl = 0.02;
          // var fGrainControl = 0.01;
  
          /**
           * Ray Casting Loop
           */
          while (!bBreakLoop && fRayLength < fDepth) {
          
            fRayLength += fGrainControl;

            
            if (!bHitObject) {
              fDistanceToObject = fRayLength;
              if(bUsePerspectiveCorrection)
                fDistanceToObject *= Math.cos(fAngleDifferences);
            }
            if (!bHitBackObject) {
              fDistanceToInverseObject = fRayLength;
              if(bUsePerspectiveCorrection)
                fDistanceToInverseObject  *= Math.cos(fAngleDifferences);
            }
            if (!bHitWall) {  
              fDistanceToWall = fRayLength;
              if(bUsePerspectiveCorrection)
                fDistanceToWall *= Math.cos(fAngleDifferences);
            }
            
            // ray position
            var nTestX = ~~(fPlayerX + fEyeX * fRayLength);
            var nTestY = ~~(fPlayerY + fEyeY * fRayLength);

            
            // test if ray hits out of bounds
            if (
              nTestX < 0 || nTestX >= nMapWidth || nTestY < 0 || nTestY >= nMapHeight
            ) {
              bHitWall = true; // didn't actually, just no wall there
              fDistanceToWall = fDepth;
              bBreakLoop = true;
            }
  
            // TEST FOR OBJECTS
            else if (
              map[nTestY * nMapWidth + nTestX] == "o" ||
              map[nTestY * nMapWidth + nTestX] == ","
            ) {
              bHitObject = true;
              
              sObjectType = map[nTestY * nMapWidth + nTestX];
  
              if( !bStopObjectSampling ){
  
                // 1u wide cell into quarters
                var fObjMidX = nTestX + 0.5;
                var fObjMidY = nTestY + 0.5;
  
                // using the distance to the wall and the player angle (Eye Vectors)
                // to determine the collusion point
                if(bUsePerspectiveCorrection){
                  var fTestPointXo = fPlayerX + fEyeX * fDistanceToObject / Math.cos(fAngleDifferences);
                  var fTestPointYo = fPlayerY + fEyeY * fDistanceToObject / Math.cos(fAngleDifferences);
                }else{
                  var fTestPointXo = fPlayerX + fEyeX * fDistanceToObject
                  var fTestPointYo = fPlayerY + fEyeY * fDistanceToObject
                }
  
                // now we have the location of the middle of the cell,
                // and the location of point of collision, work out angle
                var fTestAngleO = Math.atan2(
                  fTestPointYo - fObjMidY,
                  fTestPointXo - fObjMidX
                );
                // rotate by pi over 4
  
                if (fTestAngleO >= -PIx0_25 && fTestAngleO < PIx0_25) {
                  fSampleXo = fTestPointYo - +nTestY; 
                  sObjectDirection = "W";
                }
                if (fTestAngleO >= PIx0_25 && fTestAngleO < PIx0_75) {
                  fSampleXo = fTestPointXo - +nTestX;
                  sObjectDirection = "N";
                }
                if (fTestAngleO < -PIx0_25 && fTestAngleO >= -PIx0_75) {
                  fSampleXo = fTestPointXo - +nTestX;
                  sObjectDirection = "S";
                }
                if (fTestAngleO >= PIx0_75 || fTestAngleO < -PIx0_75) {
                  fSampleXo = fTestPointYo - +nTestY;
                  sObjectDirection = "E";
                }
              }
              bStopObjectSampling = true;
  
            } else if (
              bHitObject == true && 
              (map[nTestY * nMapWidth + nTestX] == "." || map[nTestY * nMapWidth + nTestX] == "G")
            ) {
              bHitBackObject = true;
            } 
            // END TEST FOR OBJECTS
  
            // TEST FOR WALLS
            else if (map[nTestY * nMapWidth + nTestX] != ".") {
              bHitWall = true;
              bBreakLoop = true;
  
              sWalltype = map[nTestY * nMapWidth + nTestX];
  
              // 1u wide cell into quarters
              var fBlockMidX = nTestX + 0.5;
              var fBlockMidY = nTestY + 0.5;
  
              // using the distance to the wall and the player angle (Eye Vectors)
              // to determine the collusion point
              if(bUsePerspectiveCorrection){
                var fTestPointX = fPlayerX + fEyeX * fDistanceToWall / Math.cos(fAngleDifferences);
                var fTestPointY = fPlayerY + fEyeY * fDistanceToWall / Math.cos(fAngleDifferences);
              }else{
                var fTestPointX = fPlayerX + fEyeX * fDistanceToWall;
                var fTestPointY = fPlayerY + fEyeY * fDistanceToWall;
              }
  
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
  
  
          // at the end of ray casting, we should have the lengths of the rays
          // set to their last value, representing their distances.
          // Based on the distance to wall, determine how much floor and ceiling to show per column,
          // Adding in the recalc for looking (fLookTimer) and jumping (nJumptimer)
          // // var nCeiling = (nScreenHeight / 2) - nScreenHeight / fDistanceToWall;
          var nCeiling =
            fscreenHeightFactor - nScreenHeight / fDistanceToWall;
          var nFloor =
            fscreenHeightFactor + nScreenHeight / fDistanceToWall;
  
          // similar for towers and gates
          var nTowerHeightModifier = 1.5 // doubles the wall height
          if( sWalltype === "Y"){
            var nTowerHeightModifier = 2 // 1_1/2x the wall height
          }
          var nTower =
            fscreenHeightFactor - nScreenHeight / (fDistanceToWall - fDistanceToWall / nTowerHeightModifier);
  

          var nDoorFrameHeight =
            fscreenHeightFactor - nScreenHeight / (fDistanceToWall + 2);
  
          // similar operation for objects
          var nObjectCeiling =
            fscreenHeightFactor - nScreenHeight / fDistanceToObject;
          var nInverseObjectCeiling =
            fscreenHeightFactor - nScreenHeight / fDistanceToInverseObject;
          var nObjectFloor =
            fscreenHeightFactor + nScreenHeight / fDistanceToObject;
  
  
          if( sObjectType === "o" ){
            var nObjectHeightModifier = nScreenHeight;
          }else{
            var nObjectHeightModifier = 2;
          }
          
          // height of entire object, backwall to front wall
          var nFObjectBackwall =
            fscreenHeightFactor + nScreenHeight / (fDistanceToInverseObject * nObjectHeightModifier); 
          // Height of the front of the object only
          var nFObjectFront = 
            fscreenHeightFactor + nScreenHeight / (fDistanceToObject * nObjectHeightModifier ); 
  
  
          // the spot where the wall was hit
          fDepthBuffer[i] = fDistanceToWall;
          fDepthBufferO[i] = fDistanceToObject;

          // checks if the current wall is supposed to have a ceiling or not
          var bWallHasCeiling = false;
          if( textures[sWalltype].hasceiling ){
            bWallHasCeiling = true;
          }

          var bOjectHasCeiling = false;
          if( sObjectType && sObjectType != "0"){
            if( textures[sObjectType].hasceiling ){
              bOjectHasCeiling = true;
            }
          }
  
  
          // render background!
          var fVerticalOffset = nScreenHeight / 2;
          for (var h = 0; h < nScreenHeight; h++) {
  
            // make the background double the size of the screen
            var fBgX = i / nScreenWidth;
            var fBgY = (h + fVerticalOffset) / nScreenHeight;
  
            // Calculate horizontal offset based on player angle
            var angleOffset = fPlayerA * (1 / (1 * PI___));
            fBgX += angleOffset * 2;
  
            if (fLooktimer < 0) { 
              fBgY -= fLooktimer / 100; // down
            }else{
              fBgY -= fLooktimer / 20; // up
            }

            
            screen[h * nScreenWidth + i] = _rh.renderWall(
              0,
              "N",
              _getSamplePixel(textures['bg'], fBgX, fBgY)
            );
          }
  
          // draw the columns one screenheight-pixel at a time
          for (var j = 0; j < nScreenHeight; j++) {
            
  
            // IF the level has a ceiling, renders the ceiling color for blocks (with exception)
            if( sCeiling ){
              if ( 
                fDistanceToWall < fDepth  && 
                bWallHasCeiling
                ) 
              {
                screen[j * nScreenWidth + i] = sCeiling;
              }
            }
              
            
            // sky
            if (j < nCeiling) {
              // case of tower block (the bit that reaches into the ceiling)
              if (sWalltype == "T" || sWalltype == "Y") {
                if (j > nTower) {

                  if(sWalltype == "T"){
                    var fSampleY = (j - nTower) / (nFloor - nTower) * 2; // (for a nTowerHeightModifier) of 1.5
                  }
                  else if(sWalltype == "Y") {
                    var fSampleY = (j - nTower) / (nFloor - nTower) * 1.5; // (for a nTowerHeightModifier) of 2
                  }
                  screen[j * nScreenWidth + i] = _rh.renderWall(
                    fDistanceToWall,
                    sWallDirection,
                    _getSamplePixel(textures[sWalltype], fSampleX, fSampleY)
                  );
                } 
              }
  
              // draw ceiling/sky
              // else {
              //   if (sWalltype == ",") {
              //     screen[j * nScreenWidth + i] = "1";
              //   } else {
              //     screen[j * nScreenWidth + i] = "0";
              //   }
              // }
            }
  
            // solid block
            else if (j > nCeiling && j <= nFloor) {
            
              // Solid Walltype
              if (sWalltype != "." && sWalltype != "G" || sWalltype == "T") {

                var sPixelToRender = "0";
                var fSampleY = (j - nCeiling) / (nFloor - nCeiling);

                if( sWalltype == "1"){
                  sPixelToRender = _rh.renderWall(
                    fDistanceToWall,
                    sWallDirection,
                    _getSamplePixel(textures[sWalltype], fSampleX, fSampleY, sWallDirection, true)
                  );
                }else{
                  sPixelToRender = _rh.renderWall(
                    fDistanceToWall,
                    sWallDirection,
                    _getSamplePixel(textures[sWalltype], fSampleX, fSampleY, sWallDirection)
                  );
                }

                
  
                // Does not draw out of bounds pixels
                if( fDistanceToWall < fDepth + 2 ){
                  // Updates the screen with the pixel
                  screen[j * nScreenWidth + i] = sPixelToRender
                }
              }
  
              // render whatever char is on the map as walltype
              else {
                screen[j * nScreenWidth + i] = sWalltype;
              }
            } // end solid block
  
            // floor
            else {
              screen[j * nScreenWidth + i] = _rh.renderFloor(j);
              // screen[j * nScreenWidth + i] = _rh.renderWall(
              //   fDistanceToWall,
              //   sWallDirection,
              //   _getSamplePixel(textures["#"], fSampleX, fSampleY)
              // );
            }
          } // end draw column loop
  
          
          // Object-Draw (draw objects)
          for (var y = 0; y < nScreenHeight; y++) {
  
  
            // IF the level has a ceiling, renders the ceiling color for all lower blocks
            if( sCeiling ){
              if ( (sObjectType === "o" || sObjectType === ",") ) {
                if ( bOjectHasCeiling && y < nInverseObjectCeiling) {
                  screen[y * nScreenWidth + i] = sCeiling;
                }
              }
            }
  
            if (y > nObjectCeiling && y <= nObjectFloor) {
              var fSampleYo = (y - nObjectCeiling) / (nObjectFloor - nObjectCeiling);
              if (sObjectType === "o" || sObjectType === ",") {
                // is within the boundaries of the object
                if (y >= nFObjectBackwall) {
                  // if we hit between the back of the object and the front of the object, 
                  // it's the object-top!
                  if (y < nFObjectFront) {
                    screen[y * nScreenWidth + i] = _rh.renderObjectTop();
                  }
                  else{
                    screen[y * nScreenWidth + i] = _rh.renderWall(
                      fDistanceToObject,
                      sObjectDirection,
                      _getSamplePixel(textures[sObjectType], fSampleXo, fSampleYo)
                    );
                  }
                  // We tentatively render object onto the background,
                  // but we also store it in the objectBuffer, to be able to overlay over sprites if needed later
                  objectScreenBuffer[y * nScreenWidth + i] = screen[y * nScreenWidth + i]
                }
              }
            }
          } // end draw column loop
          
        } // end column loop
  
        // RENDER SPRITES, DRAW SPRITES
        for (var si = 0; si < Object.keys(oLevelSprites).length; si++) {
          // the sprite in the level-side
          var sprite = oLevelSprites[Object.keys(oLevelSprites)[si]];
  
          // reference to the global-side sprite
          var currentSpriteObject = allSprites[sprite["name"]];
  
          // can object be seen?
          var fVecX = sprite["x"] - fPlayerX;
          var fVecY = sprite["y"] - fPlayerY;
          var fDistanceFromPlayer = Math.sqrt(fVecX * fVecX + fVecY * fVecY);
  
          // calculate angle between sprite and player, to see if in fov
          var fEyeX = Math.cos(fPlayerA);
          var fEyeY = Math.sin(fPlayerA);
  
          var fSpriteAngle = Math.atan2(fVecY, fVecX) - Math.atan2(fEyeY, fEyeX);
          if (fSpriteAngle < -PI___) {
            fSpriteAngle += PIx2;
          }
          if (fSpriteAngle > PI___) {
            fSpriteAngle -= PIx2;
          }
  
          var bInPlayerView = Math.abs(fSpriteAngle) < fFOV / 2;
  
          // only proceed if sprite is visible
          if (bInPlayerView && fDistanceFromPlayer >= 0.5) {
            // very similar operation to background floor and ceiling.
            // Sprite height is default 1, but we can adjust with the factor passed in the sprite object/
            var fSpriteCeiling =
              +(fscreenHeightFactor) -
              (nScreenHeight / +fDistanceFromPlayer) *
                currentSpriteObject["hghtFctr"];
            var fSpriteFloor =
              +(fscreenHeightFactor) +
              nScreenHeight / +fDistanceFromPlayer;
  
            var fSpriteCeiling = Math.round(fSpriteCeiling);
            var fSpriteFloor = Math.round(fSpriteFloor);
  
            var fSpriteHeight = fSpriteFloor - fSpriteCeiling;
            var fSpriteAspectRatio = +currentSpriteObject["height"] / +(currentSpriteObject["width"] * currentSpriteObject["aspctRt"]);
            var fSpriteWidth = fSpriteHeight / fSpriteAspectRatio;
            var fMiddleOfSprite = (0.5 * (fSpriteAngle / (fFOV / 2)) + 0.5) * +nScreenWidth;
  
            // If the current Sprite is a Voxel Object
            if(currentSpriteObject["vox"]){
  
              var oSpritesWithDistances = [];
  
              // go through each sub-voxel
              for (var voxKey in currentSpriteObject["vox"]) {
                var currentVox = currentSpriteObject["vox"][voxKey]
  
                // position re-calculations for every voxel
                fVecX = sprite["x"] + currentVox["x"] - fPlayerX;
                fVecY = sprite["y"] + currentVox["y"] - fPlayerY;
  
                fSpriteAngle = Math.atan2(fVecY, fVecX) - Math.atan2(fEyeY, fEyeX);
                if (fSpriteAngle < -PI___) {
                  fSpriteAngle += PIx2;
                }
                if (fSpriteAngle > PI___) {
                  fSpriteAngle -= PIx2;
                }
  
                fDistanceFromPlayer = Math.sqrt(fVecX * fVecX + fVecY * fVecY);
                oSpritesWithDistances.push({ sprite: currentVox, distance: fDistanceFromPlayer, angle: fSpriteAngle });
              }
  
              // Sort the voxels by distance to player
              oSpritesWithDistances.sort(function(a, b) {
                return b.distance - a.distance;
              });
  
              // go through all now sorted voxels to render
              for (var voxelKey in oSpritesWithDistances) {
  
                var spriteWithDistance = oSpritesWithDistances[voxelKey];
                var currentVox = spriteWithDistance.sprite;
                var currentDistance = spriteWithDistance.distance;
                var currentAngle = spriteWithDistance.angle;
  
  
                // very similar operation to background floor and ceiling.
                // voxel height is default 1, but we can adjust with the factor passed in the voxel object/
                fSpriteCeiling = +(fscreenHeightFactor) - (nScreenHeight / +currentDistance) * currentSpriteObject["hghtFctr"];
                fSpriteFloor = +(fscreenHeightFactor) + nScreenHeight / +currentDistance;
  
                fSpriteCeiling = Math.round(fSpriteCeiling);
                fSpriteFloor = Math.round(fSpriteFloor);
  
                fSpriteHeight = fSpriteFloor - fSpriteCeiling;
  
                fMiddleOfSprite = (0.5 * (currentAngle / (fFOV / 2)) + 0.5) * +nScreenWidth;
  
                // Voxels always have the same levels as the parent
                currentVox["scale"] = currentSpriteObject["scale"];
                currentVox["width"] = currentSpriteObject["width"];
                currentVox["height"] = currentSpriteObject["height"];
                currentVox["aspctRt"] = currentSpriteObject["aspctRt"];
                currentVox["hghtFctr"] = currentSpriteObject["hghtFctr"];
  
                // loops through the vox pixels
                for (var vx = 0; vx < fSpriteWidth; vx++) {
                  for (var vy = 0; vy < fSpriteHeight; vy++) {
                    // updates sample point for voxel
                    var fSampleX = vx / fSpriteWidth;
                    var fSampleY = vy / fSpriteHeight;
  
                    var sSamplePixel = "";
  
                    sSamplePixel = _getSamplePixel(
                      currentVox,
                      fSampleX,
                      fSampleY
                    );
  
                    //
                    var nSpriteColumn = ~~(fMiddleOfSprite + vx - fSpriteWidth / 2 );
                    if (nSpriteColumn >= 0 && nSpriteColumn < nScreenWidth) {
                      // only render the sprite pixel if it is not a . or a space, and if the sprite is far enough from the player
                      if ( sSamplePixel[0] != "." ) {
                        // render pixels to screen
                        var yccord = fSpriteCeiling + vy;
                        var xccord = nSpriteColumn;
  
                        if( fDepthBuffer[nSpriteColumn] >= currentDistance ){
  
                          // assign the Sprite Glyph
                          sSpriteGlyph = _rh.renderWall(
                            currentDistance,
                            "V",
                            sSamplePixel
                          );
  
                          screen[yccord * nScreenWidth + xccord] = sSpriteGlyph;
                          fDepthBuffer[nSpriteColumn] = currentDistance;
  
                          var currentScreenPixel = [yccord * nScreenWidth + xccord]
                          // is there an object that needs to overlay the current sprite pixel?
                          if( objectScreenBuffer[currentScreenPixel] ){
                            // and that object is supposed to be before a sprite at that pixel
                            if( fDepthBufferO[nSpriteColumn] < fDepthBuffer[nSpriteColumn] ){
                              screen[currentScreenPixel] = objectScreenBuffer[currentScreenPixel];  
                            }
                          }
                        }
                      }
                    }
                    
                  } // end vx
                } // end vy
              }
            }
            
            else{
  
              // The angle the sprite is facing relative to the player
              // (not needed for voxels)
              var fSpriteBeautyAngle = fPlayerA - sprite["r"] + PIdiv4;
              // normalize
              if (fSpriteBeautyAngle < 0) {
                fSpriteBeautyAngle += PIx2;
              }
              if (fSpriteBeautyAngle > PIx2) {
                fSpriteBeautyAngle -= PIx2;
              }
  
              // loops through the sprite pixels
              for (var sx = 0; sx < fSpriteWidth; sx++) {
                for (var sy = 0; sy < fSpriteHeight; sy++) {
                  // sample sprite
                  var fSampleX = sx / fSpriteWidth;
                  var fSampleY = sy / fSpriteHeight;
  
                  var sSamplePixel = "";
                  var sAnimationFrame = false;
  
                  // animation-cycle available, determine the current cycle
                  // MAYBE: randomize cycle position
                  if (sprite["move"] && "walkframes" in currentSpriteObject) {
                    if (animationTimer < 5) {
                      sAnimationFrame = "W1";
                    } else if (animationTimer >= 5 && animationTimer < 10) {
                      sAnimationFrame = "W2";
                    } else if (animationTimer >= 10) {
                      sAnimationFrame = false;
                    }
                  }
  
                  // sample-angled glyph is available
                  if ("angles" in currentSpriteObject) {
                    if (fSpriteBeautyAngle >= PI_0 && fSpriteBeautyAngle < PIx05) {
                      sprite["a"] = "B";
                    } else if (
                      +fSpriteBeautyAngle >= +PIx05 &&
                      +fSpriteBeautyAngle < +PIx1
                    ) {
                      sprite["a"] = "L";
                    } else if (
                      +fSpriteBeautyAngle >= +PIx1 &&
                      +fSpriteBeautyAngle < +PIx1_5
                    ) {
                      sprite["a"] = "F";
                    } else if (
                      +fSpriteBeautyAngle >= +PIx1_5 &&
                      +fSpriteBeautyAngle < +PIx2
                    ) {
                      sprite["a"] = "R";
                    }
                  }
  
                  // check if object has both, angles, or animations
                  if (sprite["a"] && sAnimationFrame) {
                    sSamplePixel = _getSamplePixel(
                      currentSpriteObject["angles"][sprite["a"]][sAnimationFrame],
                      fSampleX,
                      fSampleY
                    );
                  } else if (sprite["a"]) {
                    sSamplePixel = _getSamplePixel(
                      currentSpriteObject["angles"][sprite["a"]],
                      fSampleX,
                      fSampleY
                    );
                  } else if (sAnimationFrame) {
                    sSamplePixel = _getSamplePixel(
                      currentSpriteObject[sAnimationFrame],
                      fSampleX,
                      fSampleY
                    );
                  } else {
                    // if not, use basic sprite
                    sSamplePixel = _getSamplePixel(
                      currentSpriteObject,
                      fSampleX,
                      fSampleY
                    );
                  }
                  
                  var nSpriteColumn = ~~(fMiddleOfSprite + sx - fSpriteWidth / 2);
                  if (nSpriteColumn >= 0 && nSpriteColumn < nScreenWidth) {
                    // only render the sprite pixel if it is not a . or a space, and if the sprite is far enough from the player
                    if (
                      sSamplePixel[0] != "." &&
                      fDepthBuffer[nSpriteColumn] >= fDistanceFromPlayer
                    ) {
  
                      // assign the Sprite Glyph
                      sSpriteGlyph = _rh.renderWall(
                        fDistanceFromPlayer,
                        "V",
                        sSamplePixel
                      );
  
                      // render pixels to screen
                      var yccord = fSpriteCeiling + sy;
                      var xccord = nSpriteColumn;
                      screen[yccord * nScreenWidth + xccord] = sSpriteGlyph;
                      fDepthBuffer[nSpriteColumn] = fDistanceFromPlayer;
  
                      var currentScreenPixel = [yccord * nScreenWidth + xccord];
                      // is there an object that needs to overlay the current sprite pixel?
                      if( objectScreenBuffer[currentScreenPixel] ){
                        // and that object is supposed to be before a sprite at that pixel
                        if( fDepthBufferO[nSpriteColumn] < fDepthBuffer[nSpriteColumn] ){
                          screen[currentScreenPixel] = objectScreenBuffer[currentScreenPixel];  
                        }
                      }
                    }
                  }
                }
              }
            }
          } // end if
  
          // player was hit
          else {
            // clearInterval(gameRun);
          }
        }

  
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
      _loadLevel("sgg.map");
    };
  
    return {
      init: init,
    };
  })();