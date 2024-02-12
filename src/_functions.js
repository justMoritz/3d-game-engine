/**
 * 
 * Functions that do things like Math
 * 
 */


function getFraction(number) {
  return number % 1;
}


// takes beginning and ends of two vectors, and returns the point at which they meet, if they do
// Stolen from jdh on YouTube, (who stole it from Wikipedia), but then implemented for my needs :)
function intersectionPoint(a0, a1, b0, b1) {
  var d = ((a0.x - a1.x) * (b0.y - b1.y)) - ((a0.y - a1.y) * (b0.x - b1.x));
  
  if (Math.abs(d) < 0.000001) { 
    return { x: NaN, y: NaN }; 
  }
    
  var t = (((a0.x - b0.x) * (b0.y - b1.y)) - ((a0.y - b0.y) * (b0.x - b1.x))) / d;
  var u = (((a0.x - b0.x) * (a0.y - a1.y)) - ((a0.y - b0.y) * (a0.x - a1.x))) / d;

  if(t >= 0 && t <= 1 && u >= 0 && u <= 1){
    return { 
      x: a0.x + (t * (a1.x - a0.x)), 
      y: a0.y + (t * (a1.y - a0.y)), 
    }
  }
  else{
    return { x: NaN, y: NaN };
  }
}



var epsilon = 0.0001;
function approximatelyEqual(a, b, epsilon) {
  return Math.abs(a - b) < epsilon;
}




// leaving the console for errors, logging seems to kill performance
var _debugOutput = function (input) {
  eDebugOut.innerHTML = input;
};
