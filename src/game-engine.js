var gameEngineJS = (function(){

  var eScreen;

  var nScreenWidth = 120;
  var nScreenRows = 40;

  var fPlayerX = 0.0;
  var fPlayerY = 0.0;
  var fPlayerA = 0.0;

  var nMapHeight = 16;
  var nMapWidth = 16;

  var map;
  map += "################";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "#..............#";
  map += "################";


  var aTest = {
    0: "&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    1: "&blk34;&blk34;&blk12;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    2: "&blk34;&blk34;&blk34;&blk34;&blk34;&blk14;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>&blk34;&blk34;&blk34;&blk34;&blk34;&blk34;<br>",
    // 1: "&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>&blk12;&blk12;&blk12;&blk12;&blk12;&blk12;<br>",
    // 2: "&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>&blk14;&blk14;&blk14;&blk14;&blk14;&blk14;<br>",
  };


  var fDrawFrame = function(input)
  {
    eScreen.innerHTML = aTest[input];
  };


  /**
   * The basic game loop
   */
  var main = function()
  {
    var test = 0;

    // basic game loop
    setInterval(onTimerTick, 33);
    function onTimerTick() {
      fDrawFrame(test%3);
      test++;
    }
  };


  var init = function( input )
  {
    // gets the display
    eScreen = document.getElementById('display');

    // runs the game loop
    main();
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