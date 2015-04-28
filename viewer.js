var event  = require('dom-events');
var ATime  = require('./src/atime');
var Comet  = require('./src/comet');
var Canvas = require('./canvas');
var Player = require('./player');
var config = require('./config');

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
var n = Comet.GAUSS / (params.a * Math.sqrt(params.a));

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

var canvasElement = document.getElementById("canvas");
var ctx = canvasElement.getContext("2d");
var dimensions = {width: canvasElement.width, height: canvasElement.height};
config.dimensions = dimensions;
config.datetime = ATime.getToday();
var object = new Comet(objectDef);
var orbitCanvas = new Canvas(ctx, config, object);
orbitCanvas.update();

var applyConfig = function(){
  zoomValue.innerText = config.zoom;
  vRotValue.innerText = config.verticalRotation;
  hRotValue.innerText = config.horizontalRotation;
  orbitCanvas.setConfig(config);
  orbitCanvas.update();
};

/**
 * Zoom
 */

var zoomMax = 600;
var zoom = document.getElementById('zoom');
var zoomValue = document.getElementById('zoomValue');

event.on(zoom, 'input', function(){
  var value = this.value;
  if(value >= zoomMax) return;
  config.zoom = value;
  applyConfig();
});

/**
 * Horizontal rotation
 */

var hRotMax = 365;
var hRot = document.getElementById('hRot');
var hRotValue = document.getElementById('hRotValue');

event.on(hRot, 'input', function(){
  var value = this.value;
  if(value >= hRotMax) return;
  config.horizontalRotation = value;
  applyConfig();
});

/**
 * Vertical rotation
 */

var vRotMax = 180;
var vRot = document.getElementById('vRot');
var vRotValue = document.getElementById('vRotValue');

event.on(vRot, 'input', function(){
  var value = this.value;
  if(value >= vRotMax) return;
  config.verticalRotation = value;
  applyConfig();
});


