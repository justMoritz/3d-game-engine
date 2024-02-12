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