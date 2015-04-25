var Astro  = require('./src/astro');
var ATime  = require('./src/atime');
var Comet  = require('./src/comet');
var Canvas = require('./canvas.js');
var Player = require('./player.js');

var canvasElement = document.getElementById("canvas");
var ctx = canvasElement.getContext("2d");
var todaytime = ATime.getToday();

var params = {
  name   : 'Ceres',
  epoch  : 19991118.5,
  M      : 356.648434,
  e      : 0.07831587,
  a      : 2.76631592,
  peri   : 73.917708,
  node   : 80.495123,
  incl   : 10.583393,
  equinox: 2000.0
};

var t;
var M = params.M * Math.PI / 180.0;
var epoch = ATime.ymdStringToATime(params.epoch);
var n = Astro.GAUSS / (params.a * Math.sqrt(params.a));

if (M < Math.PI) {
  t = new ATime({julian: epoch.julian - M / n, timezone: 0.0});
} else {
  t = new ATime({julian: epoch.julian + (Math.PI*2.0 - M) / n, timezone: 0.0});
}

var objectDef = {
  name   : 'Ceres',
  epoch  : params.epoch,
  t      : t.julian,
  e      : params.e,
  q      : params.a * (1.0 - 0.07831587),
  peri   : params.peri * Math.PI / 180.0,
  node   : params.node * Math.PI / 180.0,
  incl   : params.incl * Math.PI / 180.0,
  equinox: params.equinox
};

var object = new Comet(objectDef);
var dimensions = {width: canvasElement.width, height: canvasElement.height};
var orbitCanvas = new Canvas(ctx, dimensions, object, todaytime);
orbitCanvas.update();

