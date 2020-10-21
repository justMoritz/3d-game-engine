var gameEngineJS = (function(){

  // stores the display
  var eScreen;


  var aTest = {
    0: "&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    1: "&blk34;&blk34;&blk12;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    2: "&blk34;&blk34;&blk34;&blk34;&blk34;&blk14;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    // 1: "&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>",
    // 2: "&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>",
  };


  var fDrawTestFunct = function(input){
    eScreen.innerHTML = aTest[input];
  };


  var init = function( input ){

    // gets the display
    eScreen = document.getElementById('display');

    var test = 0;

    // basic game loop
    setInterval(onTimerTick, 33);
    function onTimerTick() {
      // console.log(test%3);
      fDrawTestFunct(test%3);
      test++;
    }

  };


  return{
    init: init,
    fDrawTestFunct: fDrawTestFunct,
  }
})();


// ░
// ▒
// ▓
// █ &blk34;


// ▄
// ■
// ▀