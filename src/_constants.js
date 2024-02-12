/**
 * 
 * Constants and Global Variables
 * 
 */


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

var sPlayerSector = 'sector0';

var fPlayerEndX;
var fPlayerEndY;

var fscreenHeightFactor;

var oMap;

var nMapHeight = 16;
var nMapWidth = 16;

var gameRun;

// holds the frames we"re going to send to the renderer
var screen = [];