/**
 * 
 * Render Helpers
 * 
 * various shaders for walls, ceilings, objects
 * 
 */


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
 * @return {string}
 */
var _getSamplePixel = function (texture, x, y, fSampleXScale, fSampleYScale) {

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

  var scaleFactorX = scaleFactor;
  var scaleFactorY = scaleFactor;

  if(fSampleXScale != null){
    scaleFactorX = fSampleXScale;
  }
  if(fSampleYScale != null){
    scaleFactorY = fSampleYScale;
  }
  
  x = (scaleFactorX * x) % 1;
  y = (scaleFactorY * y) % 1;

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
  _debugOutput(`A: ${fPlayerA} X:${fPlayerX} Y:${fPlayerY}`)
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



var _fDrawFrameWithSkew = function (screen, target) {
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