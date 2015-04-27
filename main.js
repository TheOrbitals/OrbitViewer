(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Xyz    = require('xyzed');
var ATime  = require('./src/atime');
var Comet  = require('./src/comet');
var Planet = require('./src/planet');
var Matrix = require('./src/matrix');
var Planets = require('./src/planets');
var CometOrbit = require('./src/comet-orbit');
var PlanetOrbit = require('./src/planet-orbit');

/**
 * Canvas class
 */

// Constructor
function Canvas(context, dimensions, object, atime) {
  this.canvasContext = context;
  this.dimensions = dimensions;
  this.object = object;
  this.atime = atime;

  this._planetOrbit = [];
  this._centerObjectSelected = 0;

  this.bPlanetName    = true;
  this.bObjectName    = true;
  this.bDistanceLabel = true;
  this.bDateLabel     = true;

  this._zoom    = 70.0;
  this._rotateH = 15.0;
  this._rotateV = 50.0;

  this._planetPos = [];
  for(var p = 0; p < planetCount; p++){
    this._planetPos.push(new Xyz());
  }

  this._orbitDisplay = [];
  for(var o = 0; o < planetCount+2; o++){
    this._orbitDisplay.push(true);
  }
  this._orbitDisplay[0] = false;
  // this._orbitDisplay[7] = false;
  // this._orbitDisplay[8] = false;
  // this._orbitDisplay[9] = false;

  this._objectOrbit = new CometOrbit(object, 120);

  this._epochPlanetOrbit = null;
  this._updatePlanetOrbit(atime);

  this._updateRotationMatrix(atime);
  this.setDate(atime);
}


// Colors
var colorBackground       = '#000000';
var colorObjectOrbitUpper = '#00F5FF';
var colorObjectOrbitLower = '#0000FF';
var colorObject           = '#00FFFF';
var colorObjectName       = '#00CCCC';
var colorPlanetOrbitUpper = '#FFFFFF';
var colorPlanetOrbitLower = '#808080';
var colorPlanet           = '#00FF00';
var colorPlanetName       = '#00AA00';
var colorSun              = '#D04040';
var colorAxisPlus         = '#FFFF00';
var colorAxisMinus        = '#555500';
var colorInformation      = '#FFFFFF';

// Other private statics for the module
var font = '12pt Helvetica';
var planetCount = 8;
var offscreen = null;


/**
 * Instance members
 */
var canvas = {

  /**
   * Rotation Matrix Equatorial(2000)->Ecliptic(DATE)
   */
  _updateRotationMatrix: function(atime) {
    var mtxPrec = Matrix.precMatrix(ATime.JD2000, atime.julian);
    var mtxEqt2Ecl = Matrix.rotateX(ATime.getEp(atime.julian));
    this._mtxToEcl = mtxEqt2Ecl.mul(mtxPrec);
    this._epochToEcl = atime.julian;
  },

  _updatePlanetOrbit: function(atime) {
    for (var i = Planets.Mercury; i <= Planets.Neptune; i++) {
      var newOrbit = new PlanetOrbit(i, atime, 48);
      this._planetOrbit[i-1] = newOrbit;
    }
    this._epochPlanetOrbit = atime.julian;
  },

  _drawLine: function(x1, y1, x2, y2){
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(x1, y1);
      this.canvasContext.lineTo(x2, y2);
      this.canvasContext.closePath();
      this.canvasContext.stroke();
  },

  _drawEclipticAxis: function(){
      var xyz, point;
      this.canvasContext.strokeStyle = colorAxisMinus;

      // -X
      xyz = (new Xyz(-50.0, 0.0, 0.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);

      // -Z
      xyz = (new Xyz(0.0, 0.0, -50.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);

      this.canvasContext.strokeStyle = colorAxisPlus;

      // +X
      xyz = (new Xyz( 50.0, 0.0, 0.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);
      // +Z
      xyz = (new Xyz(0.0, 0.0, 50.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);
  },

  _getDrawPoint: function(xyz) {
    // 600 means 5...fZoom...100 -> 120AU...Width...6AU
    var mul = this._zoom * this.dimensions.width / 600.0 *
               (1.0 + xyz.z / 250.0);   // Parse
    var x = this._x0 + Math.round(xyz.x * mul);
    var y = this._y0 - Math.round(xyz.y * mul);
    return {x: x, y: y};
  },

  _drawPlanetOrbit: function(planetOrbit, colorUpper, colorLower) {
    var point1, point2;
    var xyz = planetOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate);
    point1 = this._getDrawPoint(xyz);
    for (var i = 1; i <= planetOrbit.division; i++) {
      xyz = planetOrbit.getAt(i).rotate(this._mtxToEcl);
      if (xyz.z >= 0.0) {
        this.canvasContext.strokeStyle = colorUpper;
      } else {
        this.canvasContext.strokeStyle = colorLower;
      }
      xyz = xyz.rotate(this._mtxRotate);
      point2 = this._getDrawPoint(xyz);
      this._drawLine(point1.x, point1.y, point2.x, point2.y);
      point1 = point2;
    }
  },

  _drawEarthOrbit: function(planetOrbit, colorUpper, colorLower) {
      var point1, point2;
      var xyz = planetOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate);
      point1 = this._getDrawPoint(xyz);
      for (var i = 1; i <= planetOrbit.division; i++) {
          xyz = planetOrbit.getAt(i).rotate(this._mtxToEcl);
          this.canvasContext.strokeStyle = colorUpper;
          xyz = xyz.rotate(this._mtxRotate);
          point2 = this._getDrawPoint(xyz);
          this._drawLine(point1.x, point1.y, point2.x, point2.y);
          point1 = point2;
      }
  },

  _drawPlanetBody: function(planetPos, strName) {
    var xyz = planetPos.rotate(this._mtxRotate);
    var point = this._getDrawPoint(xyz);
    this.canvasContext.fillStyle = colorPlanet;
    this.canvasContext.beginPath();
    this.canvasContext.arc(point.x, point.y, 4, 0, Math.PI*2, false);
    this.canvasContext.fill();
    if (this.bPlanetName) {
      this.canvasContext.fillStyle = colorPlanetName;
      this.canvasContext.fillText(strName, point.x + 10, point.y);
    }
  },

  /**
   * Date Parameter Set
   */
  setDate: function(atime) {
    this._objectPos = this.object.getPosition(atime.julian);
    for (var i = 0; i < planetCount; i++) {
      this._planetPos[i] = Planet.getPosition(Planets.Mercury+i, atime);
    }
  },

  update: function() {
    var point3;
    var xyz, xyz1;

    // Calculate Drawing Parameter
    var mtxRotH = Matrix.rotateZ(this._rotateH * Math.PI / 180.0);
    var mtxRotV = Matrix.rotateX(this._rotateV * Math.PI / 180.0);
    this._mtxRotate = mtxRotV.mul(mtxRotH);

    this._x0 = this.dimensions.width  / 2;
    this._y0 = this.dimensions.height / 2;

    if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
      this._updateRotationMatrix(this.atime);
    }

    // If center object is comet/asteroid
    if (this._centerObjectSelected == 1 )   {
       xyz = this._objectOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate);
       xyz = this._objectPos.rotate(this._mtxToEcl).Rotate(this._mtxRotate);
       point3 = this._getDrawPoint(xyz);

       this._x0 = this.dimensions.width - point3.x;
       this._y0 = this.dimensions.height - point3.y;

       if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
            this._updateRotationMatrix(this.atime);
       }
    }
    // If center object is one of the planets
    else if (this._centerObjectSelected > 1 )   {
       xyz = this._planetPos[this._centerObjectSelected -2].Rotate(this._mtxRotate);

       point3 = this._getDrawPoint(xyz);

       this._x0 = this.dimensions.width - point3.x;
       this._y0 = this.dimensions.height - point3.y;

       if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
            this._updateRotationMatrix(this.atime);
       }
    }

    // Get Off-Screen Image Graphics Context
    // Graphics og = offscreen.getGraphics();

    // Draw Frame
    this.canvasContext.strokeStyle = colorBackground;
    this.canvasContext.fillRect(0, 0, this.dimensions.width - 1, this.dimensions.height - 1);

    // Draw Ecliptic Axis
    this._drawEclipticAxis();

    // Draw Sun
    this.canvasContext.fillStyle = colorSun;
    this.canvasContext.beginPath();
    this.canvasContext.arc(this._x0, this._y0, 5, 0, Math.PI*2, false);
    this.canvasContext.fill();

    // Draw Orbit of Object
    xyz = this._objectOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate);
    var point1, point2;
    point1 = this._getDrawPoint(xyz);
    if (this._orbitDisplay[0] || this._orbitDisplay[1]) {
      for (var i = 1; i <= this._objectOrbit.division; i++) {
        xyz = this._objectOrbit.getAt(i).rotate(this._mtxToEcl);
        if (xyz.z >= 0.0) {
          this.canvasContext.strokeStyle = colorObjectOrbitUpper;
        } else {
          this.canvasContext.strokeStyle = colorObjectOrbitLower;
        }
        xyz = xyz.rotate(this._mtxRotate);
        point2 = this._getDrawPoint(xyz);
        this._drawLine(point1.x, point1.y, point2.x, point2.y);
        point1 = point2;
      }
    }

    // Draw object body
    xyz = this._objectPos.rotate(this._mtxToEcl).rotate(this._mtxRotate);
    point1 = this._getDrawPoint(xyz);
    this.canvasContext.fillStyle = colorObject;
    this.canvasContext.beginPath();
    this.canvasContext.arc(point1.x, point1.y, 4, 0, Math.PI*2, false);
    this.canvasContext.fill();
    // Draw object's label
    if(this.bObjectName) {
      this.canvasContext.font = font;
      this.canvasContext.fillStyle = colorInformation;
      this.canvasContext.fillText(this.object.name, point1.x + 10, point1.y);
    }

    // Draw Orbit of Planets
    if(Math.abs(this._epochPlanetOrbit - this.atime.julian) > 365.2422 * 5) {
      this._updatePlanetOrbit(this.atime);
    }
    this.canvasContext.font = font;

    if(this._orbitDisplay[0] || this._orbitDisplay[9]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Neptune-1],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    this._drawPlanetBody(this._planetPos[7], "Neptune");

    if(this._orbitDisplay[0] || this._orbitDisplay[8]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Uranus-1],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    this._drawPlanetBody(this._planetPos[6], "Uranus");

    if(this._orbitDisplay[0] || this._orbitDisplay[7]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Saturn-1],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    this._drawPlanetBody(this._planetPos[5], "Saturn");

    if(this._orbitDisplay[0] || this._orbitDisplay[6]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Jupiter-1],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    this._drawPlanetBody(this._planetPos[4], "Jupiter");

    if(this._zoom * 1.524 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[5]) {

        this._drawPlanetOrbit(this._planetOrbit[Planets.Mars-1],
                colorPlanetOrbitUpper, colorPlanetOrbitLower);
      }
      this._drawPlanetBody(this._planetPos[3], "Mars");
    }
    if(this._zoom * 1.000 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[4]) {

        this._drawEarthOrbit(this._planetOrbit[Planets.Earth-1],
            colorPlanetOrbitUpper, colorPlanetOrbitUpper);
      }
      this._drawPlanetBody(this._planetPos[2], "Earth");

    }
    if(this._zoom * 0.723 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[3]) {
         this._drawPlanetOrbit(this._planetOrbit[Planets.Venus-1],
            colorPlanetOrbitUpper, colorPlanetOrbitLower);
      }
      this._drawPlanetBody(this._planetPos[1], "Venus");
    }
    if(this._zoom * 0.387 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[2]) {
         this._drawPlanetOrbit(this._planetOrbit[Planets.Mercury-1],
            colorPlanetOrbitUpper, colorPlanetOrbitLower);
      }
      this._drawPlanetBody(this._planetPos[0], "Mercury");
    }

    /*
    // Information
    og.setFont(fontInformation);
    og.setColor(colorInformation);
    FontMetrics fm = og.getFontMetrics();

    // Object Name String
    point1.x = fm.charWidth('A');
    // point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3;
    point1.y = 2 * fm.charWidth('A');
    og.drawString(this.object.getName(), point1.x, point1.y);

    if (bDistanceLabel) {
      // Earth & Sun Distance
      double edistance, sdistance;
      double xdiff, ydiff, zdiff;
      // BigDecimal a,v;
      String strDist;
      xyz  = this._objectPos.Rotate(this.this._mtxToEcl).Rotate(this._mtxRotate);
      xyz1 = this._planetPos[2].Rotate(this._mtxRotate);
      sdistance = Math.sqrt((xyz.fX * xyz.fX) + (xyz.fY * xyz.fY) +
                  (xyz.fZ * xyz.fZ)) + .0005;
      sdistance = (int)(sdistance * 1000.0)/1000.0;
      xdiff = xyz.fX - xyz1.fX;
      ydiff = xyz.fY - xyz1.fY;
      zdiff = xyz.fZ - xyz1.fZ;
      edistance = Math.sqrt((xdiff * xdiff) + (ydiff * ydiff) +
                  (zdiff * zdiff)) + .0005;
      edistance = (int)(edistance * 1000.0)/1000.0;
//      a = new BigDecimal (edistance);
//      v = a.setScale (3, BigDecimal.ROUND_HALF_UP);
      strDist = "Earth Distance: " + edistance + " AU";
      point1.x = fm.charWidth('A');
//      point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3;
      point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight();
      og.drawString(strDist, point1.x, point1.y);

//      a = new BigDecimal (sdistance);
//      v = a.setScale (3, BigDecimal.ROUND_HALF_UP);
      strDist = "Sun Distance  : " + sdistance + " AU";
      point1.x = fm.charWidth('A');
      point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3;
      og.drawString(strDist, point1.x, point1.y);
    }
  */
  }

};


/**
 * Wire up the module
 */
Canvas.prototype = canvas;
module.exports = Canvas;

},{"./src/atime":5,"./src/comet":7,"./src/comet-orbit":6,"./src/matrix":8,"./src/planet":12,"./src/planet-orbit":11,"./src/planets":13,"xyzed":3}],2:[function(require,module,exports){
/**
 * Common Mathematic Functions
 */

var twoPI = Math.PI * 2.0;

module.exports = {

  /**
   * Modulo for double values
   *
   * @param  {number} x
   * @param  {number} y
   * @return {number}
   */
  mod: function(x, y) {
    return x - Math.ceil(x / y) * y;
  },

  /**
   * Sine for an angle in degrees
   *
   * @param  {float} x
   * @return {float}
   */
  sin: function(x) {
    return Math.sin(this.deg2rad(x));
  },

  /**
   * Cosine for an angle in degrees
   *
   * @param  {float} x
   * @return {float}
   */
  cos: function(x) {
    return Math.cos(this.deg2rad(x));
  },

  /**
   * Tangent for an angle in degrees
   */
  tan: function(x) {
    return Math.tan(this.deg2rad(x));
  },

  /**
   * Rounding degree angle between 0 and 360
   */
  rounddeg: function(x) {
    var y = 360.0 * (x / 360.0 - Math.floor(x / 360.0));
    if (y < 0.0) {
      y += 360.0;
    }
    if (y >= 360.0) {
      y -= 360.0;
    }
    return y;
  },

  /**
   * Rounding radian angle between 0 and 2*PI
   */
  roundrad: function(x) {
    var y = twoPI * (x / twoPI - Math.floor(x / twoPI));
    if (y < 0.0) {
      y += twoPI;
    }
    if (y >= twoPI) {
      y -= twoPI;
    }
    return y;
  },

  /**
   * Degree to Radian
   */
  deg2rad: function(x) {
    return x * Math.PI / 180.0;
  },

  /**
   * Radian to Degree
   */
  rad2deg: function(x) {
    return x * 180.0 / Math.PI;
  },

  /**
   * arccosh
   */
  arccosh: function(x) {
    return Math.log(x + Math.sqrt(x * x - 1.0));
  },

  /**
   * sinh
   */
  sinh: function(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2.0;
  },

  /**
   * cosh
   */
  cosh: function(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2.0;
  }

};

},{}],3:[function(require,module,exports){
/**
 * 3-Dimensional Vector
 */

// Constructor
function Xyzed(x, y, z){
  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;
}

// Instance methods
var xyzed = {

  /**
   * Rotation of Vector with Matrix
   */
  rotate: function(mtx) {
    var x = mtx.fA11 * this.x + mtx.fA12 * this.y + mtx.fA13 * this.z;
    var y = mtx.fA21 * this.x + mtx.fA22 * this.y + mtx.fA23 * this.z;
    var z = mtx.fA31 * this.x + mtx.fA32 * this.y + mtx.fA33 * this.z;
    return new Xyzed(x, y, z);
  },

  /**
   * V := V1 + V2
   */
  add: function(xyz) {
    var x = this.x + xyz.x;
    var y = this.y + xyz.y;
    var z = this.z + xyz.z;
    return new Xyzed(x, y, z);
  },

  /**
   * V := V1 - V2
   */
  sub: function(xyz) {
    var x = this.x - xyz.x;
    var y = this.y - xyz.y;
    var z = this.z - xyz.z;
    return new Xyzed(x, y, z);
  },

  /**
   * V := x * V;
   */
  mul: function(a) {
    var x = this.x * a;
    var y = this.y * a;
    var z = this.z * a;
    return new Xyzed(x, y, z);
  },

  /**
   * x := abs(V);
   */
  abs: function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

};

/**
 * Wire up the module
 */
Xyzed.prototype = xyzed;
module.exports = Xyzed;

},{}],4:[function(require,module,exports){
/**
 * Player class
 */

// Constructor
var Player = function() {

};

/**
 * Wire up the module
 */
module.exports = Player;

},{}],5:[function(require,module,exports){
/**
 * Astronomical time module
 */

// Constants
var incTime = 1;        // increment
var decTime = -1;       // decrement
var JD2000 = 2451545.0; // Julian Day on 2000.1.1 12h ET
var JD1900 = 2415021.0; // Julian Day on 1900.1.1 12h ET

// Constructor
var ATime = function(datetime) {

  this.year = datetime.year;
  this.month = datetime.month;
  this.day = Math.floor(datetime.day || 0.0);

  if(datetime.timezone === null || datetime.timezone === undefined) {
    throw 'Timezone is required';
  }

  this.hour = datetime.hour;
  if(!datetime.hour) {
    this.hour = Math.floor(((datetime.day || 0.0) - this.day) * 24.0);
  }

  this.minute = datetime.minute;
  if(!datetime.minute) {
    this.minute = Math.floor(((datetime.hour || 0.0) - this.hour) * 60.0);
  }

  this.second = datetime.second;
  if(!datetime.second) {
    this.second = Math.floor(((datetime.minute || 0.0) - this.minute) * 60.0);
  }

  this.timezone = datetime.timezone;

  this.julian = datetime.julian || this._makeJulian() - datetime.timezone / 24.0;
  this.time1 = this._makeTime1(); // Origin 1974/12/31  0h ET
  this.time2 = this._makeTime2(); // Origin 2000/01/01 12h ET
};

// Instance members
var atime = {

  /**
   * YMD/HMS -> Julian date
   */
  _makeJulian: function() {
    var year  = this.year;
    var month = this.month;
    var date = this.day +
               this.hour  / 24.0 +
               this.minute / 24.0 / 60.0 +
               this.second / 24.0 / 60.0 / 60.0;
    if (month < 3) {
      month += 12;
      year  -=  1;
    }
    var julian = Math.floor(365.25 * year) +
                 Math.floor(30.59 * (month - 2)) +
                 date +1721086.5;
    if (julian > 2299160.5) {
      julian += Math.floor(year / 400.0) -
                Math.floor(year / 100.0) + 2.0;
    }
    return julian;
  },

  /**
   * Time parameter origin of 1974/12/31  0h ET
   */
  _makeTime1: function() {
    // 2442412.5 = 1974.12.31 0h ET
    var ft = (this.julian - 2442412.5) / 365.25;
    var time1 = ft + (0.0317 * ft + 1.43) * 0.000001;
    return time1;
  },

  /**
   * Time parameter origin of 2000/01/01 12h ET
   */
  _makeTime2: function() {
    var ft = (this.julian - JD2000) / 36525.0;
    return ft;
  },

  /**
   * Julian date -> YMD/HMS
   */
  _getDate: function(julian) {
    julian += 0.5;
    var a = Math.floor(julian);
    if (a >= 2299160.5) {
      var t = Math.floor((a - 1867216.25) / 36524.25);
      a += t - Math.floor(t / 4.0) + 1.0;
    }
    var b = Math.floor(a) + 1524;
    var c = Math.floor((b - 122.1) / 365.25);
    var k = Math.floor((365.25) * c);
    var e = Math.floor((b - k) / 30.6001);
    var day = b - k - Math.floor(30.6001 * e) +
              (julian - Math.floor(julian));
    this.month = Math.floor(e - ((e >= 13.5) ? 13 : 1) + 0.5);
    this.year  = Math.floor(c - ((this.month > 2) ? 4716 : 4715) + 0.5);
    this.day   = Math.floor(day);
    var hour = (day - this.day) * 24.0;
    this.hour  = Math.floor(hour);
    var min = (hour - this.hour) * 60.0;
    this.minute   = Math.floor(min);
    this.second   = (min - this.minute) * 60.0;
  },

  _changeDate: function(span, incOrDec) {
    /**
     * First, calculate new hour, minute, and second
     */
    var fHms1 = this.hour * 60.0 * 60.0 + this.minute  * 60.0 + this.second;
    var fHms2 = span.hour * 60.0 * 60.0 + span.minute  * 60.0 + span.second;
    fHms1 += (incOrDec == incTime) ? fHms2 : -fHms2;
    var nDay1;
    if (0.0 <= fHms1 && fHms1 < 24.0 * 60.0 * 60.0) {
      nDay1 = 0;
    } else if (fHms1 >= 24.0 * 60.0 * 60.0) {
      nDay1 = Math.floor(fHms1 / 24.0 / 60.0 / 60.0);
      fHms1 = angles.mod(fHms1, 24.0 * 60.0 * 60.0);
    } else {
      nDay1 = Math.ceil(fHms1 / 24.0 / 60.0 / 60.0) - 1;
      fHms1 = angles.mod(fHms1, 24.0 * 60.0 * 60.0) + 24.0 * 60.0 * 60.0;
    }

    var nNewHour = Math.floor(fHms1 / 60.0 / 60.0);
    var nNewMin  = Math.floor(fHms1 / 60.0) - nNewHour * 60;
    var fNewSec  = fHms1 - (nNewHour * 60.0 * 60.0 + nNewMin * 60.0);

    /**
     * Next, calculate new year, month, day
     */
    var newDate = new ATime(this.getYear(), this.getMonth(),
                  this.getDay(), 12, 0, 0.0, 0.0);
    var julian = newDate.getJd();
    julian += (nIncOrDec == incTime) ? nDay1 + span.day : nDay1 - span.day;
    newDate = new ATime(julian, 0.0);

    var nNewYear  = newDate.getYear();
    var nNewMonth = newDate.getMonth();
    var nNewDay   = newDate.getDay();
    nNewMonth += (nIncOrDec == incTime) ? span.month : -span.month;
    if (1 > nNewMonth) {
      nNewYear -= nNewMonth / 12 + 1;
      nNewMonth = 12 + nNewMonth % 12;
    } else if (nNewMonth > 12) {
      nNewYear += nNewMonth / 12;
      nNewMonth = 1 + (nNewMonth - 1) % 12;
    }
    nNewYear += (nIncOrDec == incTime) ? span.year : -span.year;

    // check bound between julian and gregorian
    if (nNewYear == 1582 && nNewMonth == 10) {
      if (5 <= nNewDay && nNewDay < 10) {
        nNewDay = 4;
      } else if (10 <= nNewDay && nNewDay < 15) {
        nNewDay = 15;
      }
    }
    newDate   = new ATime(nNewYear, nNewMonth, nNewDay, 12, 0, 0, 0.0);
    nNewYear  = newDate.getYear();
    nNewMonth = newDate.getMonth();
    nNewDay   = newDate.getDay();

    this.year   = nNewYear;
    this.month  = nNewMonth;
    this.day    = nNewDay;
    this.hour   = nNewHour;
    this.minute = nNewMin;
    this.second = fNewSec;
    this.julian = _makeJulian() - timezone / 24.0;
    this.time1  = _makeTime1();
    this.time2  = _makeTime2();
  },

  /**
   * Print to standard output
   */
  toString: function() {
    return this.year     + "/"   +
           this.month    + "/"   +
           this.day      + " "   +
           this.hour     + ":"   +
           this.minute   + ":"   +
           this.second   + " = " + this.julian + " (TZ:" +
           this.timezone + ")";
  }

};

/**
 * Obliquity of ecliptic
 */
var getEp = function(julian) {
  var ft = (julian - JD2000) / 36525.0;
  if (ft > 30.0){   // Out of calculation range
    ft = 30.0;
  } else if (ft < -30.0){
    ft = -30.0;
  }
  var fEp =  23.43929111 -
             46.8150  / 60.0 / 60.0 * ft -
             0.00059  / 60.0 / 60.0 * ft * ft +
             0.001813 / 60.0 / 60.0 * ft * ft * ft;
  return fEp * Math.PI / 180.0;
};

/**
 * Abbreviated month names
 */
var months = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May ", "June",
  "July", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."
];

/**
 * Get abbreviated month name
 */
var getMonthAbbr = function(month) {
  return ATime.months[month - 1];
};

/**
 * Get an ATime for today
 */
var getToday = function() {
  var date = new Date();
  var today = {
    hour: 0,
    minute: 0,
    second: 0,
    timezone: 0.0,
    day: date.getDate(),
    month: date.getMonth()+1,
    year: date.getFullYear()
  };
  return new ATime(today);
};

var ymdStringToATime = function(strYmd) {
  fYmd = parseFloat(strYmd);
  nYear = Math.floor(fYmd / 10000.0);
  fYmd -= nYear * 10000.0;
  nMonth = Math.floor(fYmd / 100.0);
  fDay = fYmd - nMonth * 100.0;
  return new ATime({year: nYear, month: nMonth, day: fDay, timezone: 0.0});
};

// Static members
ATime.getEp = getEp;
ATime.JD2000 = JD2000;
ATime.JD1900 = JD1900;
ATime.incTime = incTime;
ATime.decTime = decTime;
ATime.getToday = getToday;
ATime.ymdStringToATime = ymdStringToATime;
ATime.getMonthAbbr = getMonthAbbr;
ATime.months = months;

ATime.prototype = atime;
module.exports = ATime;

},{}],6:[function(require,module,exports){
var Xyz    = require('xyzed');
var ATime  = require('./atime');
var Matrix = require('./matrix');
var angles = require('angle-functions');

/**
 * CometOrbit module
 */

// Static members
var maxOrbit = 90.0;
var tolerance = 1.0e-16;

// Constructor
var CometOrbit = function(comet, division) {

  this.division = division;

  for(var d = 0; d <= division; d++) {
    this.orbit.push(new Xyz());
  }

  if (comet.e < 1.0 - tolerance) {
    this._getOrbitEllip(comet);
  } else if (comet.e > 1.0 + tolerance) {
    this._getOrbitHyper(comet);
  } else {
    this._getOrbitPara(comet);
  }

  var vec = comet.vectorConstant;
  var prec = Matrix.precMatrix(comet.getEquinoxJd(), ATime.JD2000);
  for (var i = 0; i <= division; i++) {
    this.orbit[i] = this.orbit[i].rotate(vec).rotate(prec);
  }
};

// Instance members
var cometOrbit = {

  /**
   * Actual orbit data
   */
  orbit: [],

  /**
   * Get Orbit Point
   */
  getAt: function(index) {
    return this.orbit[index];
  },

  /**
   *  Elliptical orbit
   */
  _getOrbitEllip: function(comet) {
    var fAxis = comet.q / (1.0 - comet.e);
    var fae2 = -2.0 * fAxis * comet.e;
    var ft = Math.sqrt(1.0 - comet.e * comet.e);
    var i, nIdx1, nIdx2, fE, fRCosV, fRSinV;
    if (fAxis * (1.0 + comet.e) > maxOrbit) {
      var fdE = Math.acos((1.0 - maxOrbit / fAxis) / comet.e) /
          ((this.division / 2) * (this.division / 2));
      nIdx1 = nIdx2 = this.division / 2;
      for (i = 0; i <= (this.division / 2); i++) {
        fE = fdE * i * i;
        fRCosV = fAxis * (Math.cos(fE) - comet.e);
        fRSinV = fAxis * ft * Math.sin(fE);
        this.orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
        this.orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
      }
    } else {
      var nIdx3, nIdx4;
      nIdx1 = 0;
      nIdx2 = nIdx3 = this.division / 2;
      nIdx4 = this.division;
      fE = 0.0;
      for (i = 0; i <= (this.division / 4);
         i++, fE += (2.0 * Math.PI / this.division)) {
        fRCosV = fAxis * (Math.cos(fE) - comet.e);
        fRSinV = fAxis * ft * Math.sin(fE);
        this.orbit[nIdx1++] = new Xyz(fRCosV,         fRSinV, 0.0);
        this.orbit[nIdx2--] = new Xyz(fae2 - fRCosV,  fRSinV, 0.0);
        this.orbit[nIdx3++] = new Xyz(fae2 - fRCosV, -fRSinV, 0.0);
        this.orbit[nIdx4--] = new Xyz(fRCosV,        -fRSinV, 0.0);
      }
    }
  },

  /**
   * Hyperbolic orbit
   */
  _getOrbitHyper: function(comet) {
    var nIdx1, nIdx2;
    var ft = Math.sqrt(comet.e * comet.e - 1.0);
    var fAxis = comet.e / (comet.e - 1.0);
    var fdF = angles.arccosh((maxOrbit + fAxis) /
              (fAxis * comet.e)) / (this.division / 2);
    var fF = 0.0;
    nIdx1 = nIdx2 = this.division / 2;
    for (var i = 0; i <= (this.division / 2); i++, fF += fdF) {
      var fRCosV = fAxis * (comet.e - angles.cosh(fF));
      var fRSinV = fAxis * ft * angles.sinh(fF);
      this.orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
      this.orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
    }
  },

  /**
   * Parabolic orbit
   */
  _getOrbitPara: function(comet) {
    var nIdx1, nIdx2;
    var fdV = (Math.atan(Math.sqrt(maxOrbit / comet.e - 1.0)) *
              2.0) / (this.division / 2);
    var fV = 0.0;
    nIdx1 = nIdx2 = this.division / 2;
    for (var i = 0; i <= (this.division / 2); i++, fV += fdV) {
      var fTanV2 = Math.sin(fV / 2.0) / Math.cos(fV / 2.0);
      var fRCosV = comet.e * (1.0 - fTanV2 * fTanV2);
      var fRSinV = 2.0 * comet.e * fTanV2;
      this.orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
      this.orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
    }
  }

};

/**
 * Wire up the module
 */
CometOrbit.prototype = cometOrbit;
module.exports = CometOrbit;

},{"./atime":5,"./matrix":8,"angle-functions":2,"xyzed":3}],7:[function(require,module,exports){
var Xyz    = require('xyzed');
var ATime  = require('./atime');
var Matrix = require('./matrix');

/**
 * Comet module
 */

var maxApprox = 80;
var tolerance = 1.0e-12;
var GAUSS     =  0.01720209895; // Gaussian gravitational constant

/**
 * Constructor
 */
var Comet = function(comet) {

  this.name    = comet.name;
  this.t       = comet.t;
  this.e       = comet.e;
  this.q       = comet.q;
  this.peri    = comet.peri;
  this.node    = comet.node;
  this.incl    = comet.incl;
  this.equinox = comet.equinox;

  // Equinox -> ATime
  var nEqnxYear  = Math.floor(comet.equinox);
  var fEqnxMonth = (comet.equinox - nEqnxYear) * 12.0;
  var nEqnxMonth = Math.floor(fEqnxMonth);
  var fEqnxDay   = (fEqnxMonth - nEqnxMonth) * 30.0;
  var date = {
    year: nEqnxYear,
    month: nEqnxMonth,
    day: fEqnxDay,
    timezone: 0.0
  };
  this.equinoxTime = new ATime(date);

  // Vector Constant
  this.vectorConstant = Matrix.vectorConstant(
    this.peri, this.node, this.incl, this.equinoxTime);
};

/**
 * Instance members
 */
var comet = {

  /**
   * Get position in heliocentric equatorial coordinates 2000.0
   */
  getPosition: function(julian) {
    var xyz;
    // CometStatus' may be throw ArithmeticException
    if (this.e < 0.98) {
      xyz = this._cometStatusEllip(julian);
    } else if (Math.abs(this.e - 1.0) < tolerance) {
      xyz = this._cometStatusPara(julian);
    } else {
      xyz = this._cometStatusNearPara(julian);
    }
    xyz = xyz.rotate(this.vectorConstant);
    var mtxPrec = Matrix.precMatrix(this.equinoxTime.julian, ATime.JD2000);
    return xyz.rotate(mtxPrec);
  },

  getEquinoxJd: function() {
    return this.equinoxTime.julian;
  },

  /**
   * Get position on orbital plane for elliptical orbit
   */
  _cometStatusEllip: function(julian) {
    if (this.q === 0.0) {
      throw 'Arithmetic Exception';
    }
    var fAxis = this.q / (1.0 - this.e);
    var fM = GAUSS * (julian - this.t) / (Math.sqrt(fAxis) * fAxis);
    var fE1 = fM + this.e * Math.sin(fM);
    var nCount = maxApprox;
    if (this.e < 0.6) {
      var fE2;
      do {
        fE2 = fE1;
        fE1 = fM + this.e * Math.sin(fE2);
      } while (Math.abs(fE1 - fE2) > tolerance && --nCount > 0);
    } else {
      var fDv;
      do {
        var fDv1 = (fM + this.e * Math.sin(fE1) - fE1);
        var fDv2 = (1.0 - this.e * Math.cos(fE1));
        if (Math.abs(fDv1) < tolerance || Math.abs(fDv2) < tolerance) {
          break;
        }
        fDv = fDv1 / fDv2;
        fE1 += fDv;
      } while (Math.abs(fDv) > tolerance && --nCount > 0);
    }
    if (nCount === 0) {
      throw 'Arithmetic Exception';
    }
    var fX = fAxis * (Math.cos(fE1) - this.e);
    var fY = fAxis * Math.sqrt(1.0 - this.e * this.e) * Math.sin(fE1);

    return new Xyz(fX, fY, 0.0);
  },

  /**
   * Get position on orbital plane for parabolic orbit
   */
  _cometStatusPara: function(julian) {
    if (this.q === 0.0) {
      throw 'Arithmetic Exception';
    }
    var fN = GAUSS * (julian - this.t) /
        (Math.sqrt(2.0) * this.q * Math.sqrt(this.q));
    var fTanV2 = fN;
    var fOldTanV2, fTan2V2;
    var nCount = maxApprox;
    do {
      fOldTanV2 = fTanV2;
      fTan2V2 = fTanV2 * fTanV2;
      fTanV2 = (fTan2V2 * fTanV2 * 2.0 / 3.0 + fN) / (1.0 + fTan2V2);
    } while (Math.abs(fTanV2 - fOldTanV2) > tolerance && --nCount > 0);
    if (nCount === 0) {
      throw 'Arithmetic Exception';
    }
    fTan2V2 = fTanV2 * fTanV2;
    var fX = this.q * (1.0 - fTan2V2);
    var fY = 2.0 * this.q * fTanV2;

    return new Xyz(fX, fY, 0.0);
  },

  /**
   * Get position on orbital plane for nearly parabolic orbit
   */
  _cometStatusNearPara: function(julian) {
    if (this.q === 0.0) {
      throw 'Arithmetic Exception';
    }
    var fA = Math.sqrt((1.0 + 9.0 * this.e) / 10.0);
    var fB = 5.0 * (1 - this.e) / (1.0 + 9.0 * this.e);
    var fA1, fB1, fX1, fA0, fB0, fX0, fN;
    fA1 = fB1 = fX1 = 1.0;
    var nCount1 = maxApprox;
    do {
      fA0 = fA1;
      fB0 = fB1;
      fN = fB0 * fA * GAUSS * (julian - this.t) /
           (Math.sqrt(2.0) * this.q * Math.sqrt(this.q));
      var nCount2 = maxApprox;
      do {
        fX0 = fX1;
        var fTmp = fX0 * fX0;
        fX1 = (fTmp * fX0 * 2.0 / 3.0 + fN) / (1.0 + fTmp);
      } while (Math.abs(fX1 - fX0) > tolerance && --nCount2 > 0);
      if (nCount2 === 0) {
        throw 'Arithmetic Exception';
      }
      fA1 = fB * fX1 * fX1;
      fB1 = (-3.809524e-03 * fA1 - 0.017142857) * fA1 * fA1 + 1.0;
    } while (Math.abs(fA1 - fA0) > tolerance && --nCount1 > 0);
    if (nCount1 === 0) {
      throw 'Arithmetic Exception';
    }
    var fC1 = ((0.12495238 * fA1 + 0.21714286) * fA1 + 0.4) * fA1 + 1.0;
    var fD1 = ((0.00571429 * fA1 + 0.2       ) * fA1 - 1.0) * fA1 + 1.0;
    var fTanV2 = Math.sqrt(5.0 * (1.0 + this.e) /
                 (1.0 + 9.0 * this.e)) * fC1 * fX1;
    var fX = this.q * fD1 * (1.0 - fTanV2 * fTanV2);
    var fY = 2.0 * this.q * fD1 * fTanV2;
    return new Xyz(fX, fY, 0.0);
  }

};

Comet.GAUSS = GAUSS;

/**
 * Wire up the module
 */
Comet.prototype = comet;
module.exports = Comet;

},{"./atime":5,"./matrix":8,"xyzed":3}],8:[function(require,module,exports){
var ATime = require('./atime');

/**
 * Matrix module (3x3)
 */

var fPrecLimit   = 30.0;
var fGeneralPrec = 360.0/25920;

/**
 * Constructor
 */
var Matrix = function(
  fA11, fA12, fA13,
  fA21, fA22, fA23,
  fA31, fA32, fA33){

  this.fA11 = fA11 || 0.0;
  this.fA12 = fA12 || 0.0;
  this.fA13 = fA13 || 0.0;
  this.fA21 = fA21 || 0.0;
  this.fA22 = fA22 || 0.0;
  this.fA23 = fA23 || 0.0;
  this.fA31 = fA31 || 0.0;
  this.fA32 = fA32 || 0.0;
  this.fA33 = fA33 || 0.0;
};

/**
 * Instance members
 */
var matrix = {

  /**
   * Multiply matrix
   */
  mul: function(factor){
    if(typeof factor === 'number'){
      return this._multiplyWithDouble(factor);
    }
    return this._multiplyWithMatrix(factor);
  },

  /**
   * Invert matrix
   */
  invert: function() {
    var a = 1.0 /
      (this.fA11 * (this.fA22 * this.fA33 - this.fA23 * this.fA32) -
       this.fA12 * (this.fA21 * this.fA33 - this.fA23 * this.fA31) +
       this.fA13 * (this.fA21 * this.fA32 - this.fA22 * this.fA31));

    var fA11 =  1.0 * a * (this.fA22 * this.fA33 - this.fA23 * this.fA32);
    var fA12 = -1.0 * a * (this.fA12 * this.fA33 - this.fA13 * this.fA32);
    var fA13 =  1.0 * a * (this.fA12 * this.fA23 - this.fA13 * this.fA22);

    var fA21 = -1.0 * a * (this.fA21 * this.fA33 - this.fA23 * this.fA31);
    var fA22 =  1.0 * a * (this.fA11 * this.fA33 - this.fA13 * this.fA31);
    var fA23 = -1.0 * a * (this.fA11 * this.fA23 - this.fA13 * this.fA21);

    var fA31 =  1.0 * a * (this.fA21 * this.fA32 - this.fA22 * this.fA31);
    var fA32 = -1.0 * a * (this.fA11 * this.fA32 - this.fA12 * this.fA31);
    var fA33 =  1.0 * a * (this.fA11 * this.fA22 - this.fA12 * this.fA21);

    this.fA11 = fA11;
    this.fA12 = fA12;
    this.fA13 = fA13;
    this.fA21 = fA21;
    this.fA22 = fA22;
    this.fA23 = fA23;
    this.fA31 = fA31;
    this.fA32 = fA32;
    this.fA33 = fA33;
  },

  /**
   * Multiplication of matrix
   */
  _multiplyWithMatrix: function(mtx) {
    var fA11 = this.fA11 * mtx.fA11 + this.fA12 * mtx.fA21 +
        this.fA13 * mtx.fA31;
    var fA21 = this.fA21 * mtx.fA11 + this.fA22 * mtx.fA21 +
        this.fA23 * mtx.fA31;
    var fA31 = this.fA31 * mtx.fA11 + this.fA32 * mtx.fA21 +
        this.fA33 * mtx.fA31;

    var fA12 = this.fA11 * mtx.fA12 + this.fA12 * mtx.fA22 +
        this.fA13 * mtx.fA32;
    var fA22 = this.fA21 * mtx.fA12 + this.fA22 * mtx.fA22 +
        this.fA23 * mtx.fA32;
    var fA32 = this.fA31 * mtx.fA12 + this.fA32 * mtx.fA22 +
        this.fA33 * mtx.fA32;

    var fA13 = this.fA11 * mtx.fA13 + this.fA12 * mtx.fA23 +
        this.fA13 * mtx.fA33;
    var fA23 = this.fA21 * mtx.fA13 + this.fA22 * mtx.fA23 +
        this.fA23 * mtx.fA33;
    var fA33 = this.fA31 * mtx.fA13 + this.fA32 * mtx.fA23 +
        this.fA33 * mtx.fA33;

    return new Matrix(fA11, fA12, fA13,
                      fA21, fA22, fA23,
                      fA31, fA32, fA33);
  },

  /**
   * Multiplication of matrix by double
   */
  _multiplyWithDouble: function(x) {
    var fA11 = this.fA11 * x;
    var fA21 = this.fA21 * x;
    var fA31 = this.fA31 * x;

    var fA12 = this.fA12 * x;
    var fA22 = this.fA22 * x;
    var fA32 = this.fA32 * x;

    var fA13 = this.fA13 * x;
    var fA23 = this.fA23 * x;
    var fA33 = this.fA33 * x;

    return new Matrix(fA11, fA12, fA13,
                      fA21, fA22, fA23,
                      fA31, fA32, fA33);
  }

};

/**
 * Get vector constant from angle elements
 */
function vectorConstant (fPeri, fNode, fIncl, equinox) {
  // Equinox
  var fT1 = equinox.time1;
  var fT2 = equinox.time2;

  // Obliquity of Ecliptic
  var fEps;
  if (fT2 < -40.0) {
    fEps = 23.83253 * Math.PI / 180.0;
  } else if(fT2 > 40.0) {
    fEps = 23.05253 * Math.PI / 180.0;
  } else{
    fEps = 23.44253 - 0.00013 * fT1 +
           0.00256 * Math.cos((249.0 -  19.3 * fT1) * Math.PI / 180.0) +
           0.00015 * Math.cos((198.0 + 720.0 * fT1) * Math.PI / 180.0);
    fEps *= Math.PI / 180.0;
  }
  var fSinEps = Math.sin(fEps);
  var fCosEps = Math.cos(fEps);

  var fSinPeri = Math.sin(fPeri);
  var fSinNode = Math.sin(fNode);
  var fSinIncl = Math.sin(fIncl);
  var fCosPeri = Math.cos(fPeri);
  var fCosNode = Math.cos(fNode);
  var fCosIncl = Math.cos(fIncl);
  var fWa =  fCosPeri * fSinNode + fSinPeri * fCosIncl * fCosNode;
  var fWb = -fSinPeri * fSinNode + fCosPeri * fCosIncl * fCosNode;

  var fA11 = fCosPeri * fCosNode  - fSinPeri * fCosIncl * fSinNode;
  var fA21 = fWa * fCosEps - fSinPeri * fSinIncl * fSinEps;
  var fA31 = fWa * fSinEps + fSinPeri * fSinIncl * fCosEps;
  var fA12 = -fSinPeri * fCosNode - fCosPeri * fCosIncl * fSinNode;
  var fA22 = fWb * fCosEps - fCosPeri * fSinIncl * fSinEps;
  var fA32 = fWb * fSinEps + fCosPeri * fSinIncl * fCosEps;

  return new Matrix(fA11, fA12, 0.0,
                            fA21, fA22, 0.0,
                            fA31, fA32, 0.0);
}

/**
 * Create precession matrix
 */
function precMatrix(fOldEpoch, fNewEpoch) {
  var fJd = 0.0;
  var bSwapEpoch = false;
  var bOuterNewcomb = false;
  if (fNewEpoch == fOldEpoch) {
    return new Matrix(1.0, 0.0, 0.0,
                      0.0, 1.0, 0.0,
                      0.0, 0.0, 1.0);
  }
  var fT = (fOldEpoch - ATime.JD2000) / 36525.0;
  if (fT < -fPrecLimit || fPrecLimit < fT) {
    bSwapEpoch = true;
    var fTmp = fNewEpoch;
    fNewEpoch = fOldEpoch;
    fOldEpoch = fTmp;
    fT = (fOldEpoch - ATime.JD2000) / 36525.0;
  }

  var fT2 = fT * fT;
  var ftt, ft;
  ftt = ft = (fNewEpoch - fOldEpoch) / 36525.0;
  if (ftt < -fPrecLimit) {
    bOuterNewcomb = true;
    ft = -fPrecLimit;
    fJd = -fPrecLimit * 36525.0 + ATime.JD2000;
  }
  if (fPrecLimit < ftt) {
    bOuterNewcomb = true;
    ft = fPrecLimit;
    fJd =  fPrecLimit * 36525.0 + ATime.JD2000;
  }

  var ft2 = ft * ft;
  var ft3 = ft2 * ft;

  var fzeta0 = ( (2306.2181 + 1.39656*fT - 0.000139*fT2)*ft +
        (0.30188 - 0.000344*fT)*ft2 + 0.017998*ft3 ) / 3600.0;
  var fzpc   = ( (2306.2181 + 1.39656*fT - 0.000139*fT2)*ft +
        (1.09468 + 0.000066*fT)*ft2 + 0.018203*ft3 ) / 3600.0;
  var ftheta = ( (2004.3109 - 0.85330*fT - 0.000217*fT2)*ft -
        (0.42665 + 0.000217*fT)*ft2 - 0.041833*ft3 ) / 3600.0;

  var mtx1, mtx2, mtx3;
  mtx1 = rotateZ((90.0 - fzeta0) * Math.PI / 180.0);
  mtx2 = rotateX(ftheta * Math.PI / 180.0);
  mtx3 = mtx2.mul(mtx1);
  mtx1 = rotateZ((-90 - fzpc) * Math.PI / 180.0);

  var mtxPrec = mtx1.mul(mtx3);

  if (bOuterNewcomb) {
    var fDjd;
    if (ftt < -fPrecLimit) {
      fDjd = (fNewEpoch - fOldEpoch) + fPrecLimit * 36525.0;
    } else {
      fDjd = (fNewEpoch - fOldEpoch) - fPrecLimit * 36525.0;
    }
    var fPrecPrm = -fDjd / 365.24 * fGeneralPrec * Math.PI / 180.0;
    var fEps = ATime.getEp(fJd);
    mtx1 = rotateX(fEps);
    mtx2 = rotateZ(fPrecPrm);
    mtx3 = mtx2.mul(mtx1);
    mtx2 = rotateX(-fEps);
    mtx1 = mtx2.mul(mtx3);
    mtxPrec = mtx1.mul(mtxPrec);
  }

  if(bSwapEpoch){
    mtxPrec.invert();
  }

  return mtxPrec;
}

/**
 * Create rotation matrix around x-axis
 */
function rotateX(angle) {
  var fA11 =  1.0;
  var fA12 =  0.0;
  var fA13 =  0.0;
  var fA21 =  0.0;
  var fA22 =  Math.cos(angle);
  var fA23 =  Math.sin(angle);
  var fA31 =  0.0;
  var fA32 = -Math.sin(angle);
  var fA33 =  Math.cos(angle);

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 *  Create rotation matrix around y-axis
 */
function rotateY(angle) {
  var fA11 =  Math.cos(angle);
  var fA12 =  0.0;
  var fA13 = -Math.sin(angle);
  var fA21 =  0.0;
  var fA22 =  1.0;
  var fA23 =  0.0;
  var fA31 =  Math.sin(angle);
  var fA32 =  0.0;
  var fA33 =  Math.cos(angle);

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 * Create rotation matrix around z-axis
 */
function rotateZ(angle) {
  var fA11 =  Math.cos(angle);
  var fA12 =  Math.sin(angle);
  var fA13 =  0.0;
  var fA21 = -Math.sin(angle);
  var fA22 =  Math.cos(angle);
  var fA23 =  0.0;
  var fA31 =  0.0;
  var fA32 =  0.0;
  var fA33 =  1.0;

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 * Static members
 */
Matrix.rotateX = rotateX;
Matrix.rotateY = rotateY;
Matrix.rotateZ = rotateZ;
Matrix.precMatrix = precMatrix;
Matrix.vectorConstant = vectorConstant;

/**
 * Wire up the module
 */
Matrix.prototype = matrix;
module.exports = Matrix;

},{"./atime":5}],9:[function(require,module,exports){
var Xyz     = require('xyzed');
var ATime   = require('./atime');
var Planets = require('./planets');
var angles  = require('angle-functions');

/**
 * PlanetElm module
 */

// Constructor
var PlanetElm = function(planetNo, atime) {

  this.l    = null;  /* M+peri+node */
  this.node = null;  /* Ascending Node */
  this.peri = null;  /* Argument of Perihelion */
  this.axis = null;  /* Semimajor Axis */
  this.e    = null;  /* Eccentricity */
  this.incl = null;  /* Inclination */

  switch (planetNo) {
    case Planets.Earth:
      this._getPlanetElmEarth(atime.julian);
      break;
    case Planets.Mercury:
    case Planets.Venus:
    case Planets.Mars:
    case Planets.Jupiter:
    case Planets.Saturn:
      this._getPlanetElm1(planetNo, atime.julian);
      break;
    case Planets.Uranus:
    case Planets.Neptune:
      this._getPlanetElm2(planetNo, atime.julian);
      break;
    default:
      throw "Exception: No such planet";
  }
};

/**
 * Private static members
 */

// Mercury
var MercuryE = new PlanetElmP1(
   182.27175,  149474.07244,   2.01944E-3,  0.0,
    75.89717,      1.553469,   3.08639E-4,  0.0,
   47.144736,       1.18476,   2.23194E-4,  0.0,
    7.003014,    1.73833E-3,  -1.55555E-5,  0.0,
  0.20561494,     0.0203E-3,     -0.04E-6,  0.0,
   0.3870984
);

// Venus
var VenusE = new PlanetElmP1(
   344.36936,  58519.2126,   9.8055E-4,  0.0,
   130.14057,     1.37230,  -1.6472E-3,  0.0,
     75.7881,     0.91403,    4.189E-4,  0.0,
      3.3936,   1.2522E-3,   -4.333E-6,  0.0,
  0.00681636,  -0.5384E-4,    0.126E-6,  0.0,
  0.72333015
);

// Mars
var MarsE = new PlanetElmP1(
  294.26478,  19141.69625,   3.15028E-4,  0.0,
  334.21833,     1.840394,   3.35917E-4,  0.0,
   48.78670,     0.776944,  -6.02778E-4,  0.0,
    1.85030,  -6.49028E-4,     2.625E-5,  0.0,
  0.0933088,  0.095284E-3,    -0.122E-6,  0.0,
  1.5236781
);

// Jupiter
var JupiterE = new PlanetElmP1(
  238.132386,  3036.301986,  3.34683E-4,  -1.64889E-6,
   12.720972,    1.6099617,  1.05627E-3,   -3.4333E-6,
   99.443414,      1.01053,  3.52222E-4,  -8.51111E-6,
    1.308736,  -5.69611E-3,  3.88889E-6,          0.0,
   0.0483348,  0.164180E-3,  -0.4676E-6,      -1.7E-9,
  5.202805
);

// Saturn
var SaturnE = new PlanetElmP1(
  266.597875,   1223.50988,    3.24542E-4,  -5.83333E-7,
    91.09821,     1.958416,    8.26361E-4,   4.61111E-6,
  112.790414,     0.873195,  -1.521810E-4,  -5.30555E-6,
     2.49252,  -3.91889E-3,   -1.54889E-5,   4.44444E-8,
  0.05589231,  -0.34550E-3,     -0.728E-6,      0.74E-9,
  9.55474
);

// Uranus
var UranusE = new PlanetElmP2(
  314.055005,  0.01176903644,    0.0003043,
  173.005159,      1.4863784,    0.0002145,
   74.005947,      0.5211258,    0.0013399,
  19.2184461,   -0.000000037,          0.0,
  0.04629590,   -0.000027337,  0.000000079,
   0.773196,       0.0007744,    0.0000375
);

// Neptune
var NeptuneE = new PlanetElmP2(
  304.348665,  0.00602007691,     0.0003093,
   48.123691,      1.4262678,     0.0003792,
  131.784057,      1.1022035,     0.0002600,
  30.1103869,   -0.000000166,           0.0,
  0.00898809,    0.000006408,  -0.000000001,
    1.769952,     -0.0093082,    -0.0000071
);

// Perturbation correction for Jupiter
var perturbJup1 = [
  -20, -27, -44, -36, -20,  10,  21,  27,  33,  25,  18,   8, -20,
  -14, -25, -57, -75, -70, -55, -25, -15,  -2,   8,   1,  -4, -15,
    5,  -5, -21, -55, -67, -72, -55, -28, -13,   0,   7,  10,   5,
   24,  21,   9, -11, -37, -57, -55, -37, -15,   3,  13,  18,  23,
   27,  29,  27,  15,   4, -25, -45, -38, -22,  -5,  10,  25,  30,
   15,  27,  39,  33,  25,  -5, -27, -34, -30, -19,  -6,  20,  21,
    7,  15,  25,  31,  24,   8, -11, -26, -32, -27, -19,  -6,  16,
   -3,   3,  15,  23,  22,  15,   0, -15, -26, -29, -25, -20,  -4,
  -15,  -5,   3,  17,  22,  20,  11,   5, -11, -26, -27, -25, -16,
  -17,  -4,  10,  20,  25,  31,  25,  24,  15,  -6, -15, -18, -13,
    0,   2,  13,  28,  39,  49,  48,  38,  33,  27,  13,  -1,  -2,
   -1,   0,   6,  23,  39,  49,  63,  53,  48,  41,  35,  17,   4,
  -26, -30, -30, -25,  -9,  17,  31,  34,  34,  25,  22,  13,   6
];

var perturbJup2 = [
    4,  15,  30,  40,  40,  25,   6,   8, -27, -43, -43, -28,  -5,
  -24,  -9,   7,  10,  27,  30,  31,  17,  -4, -29, -43, -40, -27,
  -31, -24, -25,  -5,  14,  31,  43,  43,  19,  -6, -29, -43, -32,
  -39, -29, -21, -13,  -4,  19,  36,  52,  35,  15, -11, -30, -36,
  -31, -30, -24, -19, -13,   0,  20,  35,  46,  31,   9, -17, -30,
  -26, -28, -28, -20, -17, -15,   0,  24,  46,  45,  25,   0, -28,
  -10, -23, -27, -23, -21, -22, -14,   4,  29,  40,  37,  17,  -5,
   15,  -9, -20, -22, -23, -27, -21, -13,  12,  31,  40,  33,  15,
   29,  13, -10, -18, -22, -27, -30, -25, -11,  16,  36,  42,  31,
   45,  28,   8, -10, -20, -28, -33, -33, -26,   9,  22,  45,  44,
   41,  45,  19,   9,  -9, -21, -34, -34, -34, -19,  -4,  26,  42,
   22,  36,  42,  25,  14,   0, -18, -27, -34, -32, -21,  -7,  26,
    0,  11,  26,  39,  36,  25,   8,  -8, -26, -38, -38, -28,  -2,
];

var perturbJup3 = [
   41,  33,  19,   4, -13, -28, -37, -42, -27,  -9,  16,  30,  44,
   27,  33,  33,  23,  15,   3, -22, -36, -43, -25, -10,  14,  27,
   13,  23,  32,  33,  27,  22,   8, -22, -37, -42, -27, -10,  12,
   -5,  10,  18,  23,  34,  32,  25,   5, -26, -45, -47, -26,  -5,
  -17,  -2,  10,  18,  26,  35,  37,  22,  -4, -27, -44, -42, -27,
  -33, -15,  -1,   7,  16,  22,  36,  35,  16,  -7, -28, -40, -36,
  -44, -27, -12,  -6,   4,  16,  32,  54,  31,  12, -10, -31, -43,
  -37, -37, -24, -12,  -2,   7,  17,  30,  42,  24,  11, -15, -33,
  -31, -36, -35, -24, -13,  -4,   7,  21,  35,  38,  20,   6, -15,
  -19, -32, -40, -31, -21, -18,  -5,  12,  25,  38,  42,  26,  -6,
   11, -14, -30, -44, -33, -27, -13,  -1,  15,  29,  42,  39,  18,
   31,  13,  -6, -22, -34, -29, -27, -27,   9,  15,  25,  40,  35,
   40,  31,  18,   6, -15, -28, -38, -40, -29, -13,  15,  25,  40,
];

// Perturbation correction for Saturn
var perturbSat1 = [
  57,  59,  57,  60,  56,  48,  42,  41,  41,  42,  46,  50,  55,
  61,  64,  70,  73,  74,  66,  61,  57,  55,  55,  55,  56,  56,
  58,  61,  65,  71,  76,  76,  72,  66,  63,  61,  60,  58,  56,
  55,  55,  58,  63,  68,  74,  73,  71,  67,  63,  61,  57,  55,
  52,  51,  51,  55,  61,  67,  70,  70,  67,  62,  58,  55,  53,
  49,  48,  47,  48,  52,  58,  63,  65,  63,  60,  56,  52,  50,
  48,  46,  44,  43,  45,  49,  54,  57,  58,  56,  53,  50,  48,
  46,  44,  41,  40,  39,  40,  45,  48,  50,  51,  50,  48,  46,
  44,  42,  39,  37,  36,  35,  36,  39,  43,  45,  46,  45,  44,
  42,  40,  36,  34,  32,  31,  31,  33,  37,  39,  41,  42,  44,
  42,  39,  37,  33,  30,  29,  29,  30,  32,  34,  37,  40,  44,
  45,  45,  43,  39,  35,  30,  29,  30,  33,  35,  38,  42,  45,
  55,  57,  61,  56,  49,  45,  42,  40,  42,  43,  46,  50,  54,
];

var perturbSat2 = [
  33,  37,  44,  52,  60,  66,  67,  65,  57,  46,  37,  32,  31,
  34,  40,  50,  60,  67,  70,  67,  60,  50,  40,  33,  29,  31,
  36,  42,  50,  60,  68,  72,  68,  59,  47,  38,  34,  34,  37,
  45,  48,  52,  57,  62,  65,  63,  55,  45,  40,  39,  42,  44,
  54,  55,  54,  53,  54,  55,  54,  49,  45,  43,  44,  48,  54,
  57,  60,  55,  51,  46,  45,  44,  46,  47,  48,  51,  55,  57,
  57,  59,  56,  50,  43,  39,  39,  44,  49,  52,  55,  57,  57,
  53,  54,  52,  49,  44,  40,  41,  45,  51,  55,  57,  54,  54,
  46,  44,  45,  47,  47,  48,  48,  51,  55,  57,  55,  51,  47,
  37,  35,  37,  45,  52,  57,  60,  59,  58,  56,  52,  45,  39,
  31,  29,  33,  43,  55,  65,  69,  66,  60,  55,  48,  40,  34,
  32,  30,  35,  45,  56,  68,  72,  69,  60,  52,  43,  36,  32,
  33,  36,  43,  51,  59,  65,  68,  65,  57,  47,  38,  34,  31,
];

var perturbSat3 = [
  51,  60,  66,  67,  62,  56,  46,  40,  34,  31,  37,  45,  53,
  59,  66,  70,  67,  60,  51,  40,  33,  30,  33,  40,  50,  60,
  60,  65,  67,  66,  59,  50,  38,  31,  30,  35,  43,  52,  59,
  58,  59,  60,  59,  55,  49,  40,  36,  36,  43,  50,  55,  57,
  55,  52,  50,  50,  49,  47,  45,  45,  45,  50,  55,  56,  55,
  53,  48,  44,  42,  43,  46,  50,  53,  55,  56,  57,  55,  53,
  51,  47,  41,  38,  40,  47,  55,  59,  61,  59,  56,  53,  51,
  48,  42,  44,  42,  44,  48,  55,  58,  58,  55,  51,  50,  48,
  45,  49,  50,  50,  50,  51,  53,  55,  54,  50,  45,  43,  45,
  46,  52,  59,  62,  61,  56,  53,  50,  46,  42,  39,  38,  41,
  45,  54,  65,  71,  71,  63,  53,  43,  39,  35,  34,  35,  42,
  48,  55,  65,  71,  70,  63,  51,  40,  34,  31,  33,  38,  44,
  51,  60,  66,  68,  65,  58,  46,  38,  33,  32,  37,  46,  54,
];

var perturbSat4 = [
  83,  82,  80,  78,  75,  74,  73,  73,  75,  77,  79,  81,  83,
  81,  82,  82,  81,  80,  77,  75,  72,  72,  75,  77,  80,  81,
  77,  70,  77,  75,  75,  75,  70,  67,  65,  64,  65,  68,  70,
  50,  51,  54,  58,  60,  61,  59,  56,  52,  49,  47,  47,  49,
  30,  32,  34,  37,  40,  42,  42,  40,  36,  31,  30,  29,  30,
  17,  18,  19,  20,  22,  24,  27,  26,  21,  19,  17,  15,  17,
  13,  13,  12,  12,  14,  15,  17,  18,  17,  16,  15,  14,  13,
  20,  19,  18,  17,  17,  18,  20,  21,  24,  24,  23,  21,  20,
  31,  31,  32,  32,  31,  31,  32,  35,  37,  38,  36,  34,  32,
  50,  50,  53,  53,  52,  51,  51,  52,  53,  53,  52,  50,  50,
  68,  69,  71,  72,  72,  70,  69,  68,  68,  68,  70,  70,  67,
  80,  80,  79,  80,  80,  79,  77,  76,  74,  76,  77,  80,  80,
  83,  83,  80,  78,  75,  75,  76,  76,  76,  76,  79,  81,  83,
];

// Instance members
var planetElm = {

  getPosition: function() {
    var re = this.e * 180.0 / Math.PI;
    var E, M, oldE;
    E = M = this.l - (this.peri + this.node);
    do {
      oldE = E;
      E = M + re * angles.sin(oldE);
    } while (Math.abs(E - oldE) > 1.0e-5 * 180.0 / Math.PI);
    var px = this.axis * (angles.cos(E) - this.e);
    var py = this.axis * Math.sqrt(1.0 - this.e * this.e) *
        angles.sin(E);

    var sinperi = angles.sin(this.peri);
    var cosperi = angles.cos(this.peri);
    var sinnode = angles.sin(this.node);
    var cosnode = angles.cos(this.node);
    var sinincl = angles.sin(this.incl);
    var cosincl = angles.cos(this.incl);

    var xc =  px * (cosnode * cosperi - sinnode * cosincl * sinperi) -
        py * (cosnode * sinperi + sinnode * cosincl * cosperi);
    var yc =  px * (sinnode * cosperi + cosnode * cosincl * sinperi) -
        py * (sinnode * sinperi - cosnode * cosincl * cosperi);
    var zc =  px * (sinincl * sinperi) + py * (sinincl * cosperi);

    return new Xyz(xc, yc, zc);
  },

  /**
   * Correction for Perturbation
   */
  _perturbationElement: function(eta, zeta, tbl) {
    var e1 = Math.floor(eta/30.0);
    var e2 = e1 + 1;
    var z1 = Math.floor(zeta/30.0);
    var z2 = z1 + 1;
    var v1, v2, v3, v4, p1, p2, p3;

    if(e1 >= 12 && z1 >= 12){
      return tbl[z1*13 + e1];
    }

    if(e1 >= 12){
      v1 = tbl[z1*13 + e1];
      v3 = tbl[z2*13 + e1];
      p3 = v1 + (v3 - v1)*(zeta/30.0 - z1);
      return p3;
    }

    if(z1 >= 12){
      v1 = tbl[z1*13 + e1];
      v2 = tbl[z1*13 + e2];
      p3 = v1 + (v2 - v1)*(eta/30.0 - e1);
      return p3;
    }

    v1 = tbl[z1*13 + e1];
    v2 = tbl[z1*13 + e2];
    v3 = tbl[z2*13 + e1];
    v4 = tbl[z2*13 + e2];
    p1 = v1 + (v3 - v1)*(zeta/30.0 - z1);
    p2 = v2 + (v4 - v2)*(zeta/30.0 - z1);
    p3 = p1 + (p2 - p1)*(eta/30.0 - e1);

    return p3;
  },

  /**
   * Mean orbital element of Jupiter with perturbation
   */
  _perturbationJupiter: function(jd) {
    var year = Math.floor((jd - 1721423.5) / 365.244 + 1.0);
    var T = year/1000.0;

    var L7 = (0.42 - 0.075*T + 0.015*T*T - 0.003*T*T*T) *
        angles.sin( (T - 0.62)*360.0/0.925 );
    var PS7 = 0.02 * angles.sin( (T + 0.1)*360.0/0.925 );
    var PH7 = 0.03 * angles.sin( (T + 0.36)*360.0/0.925 );
    var ETA = angles.rounddeg(86.1 + 0.033459 * ( jd - 1721057.0 ));
    var ZETA = angles.rounddeg(89.1 + 0.049630 * ( jd - 1721057.0 ));
    var L8 = this._perturbationElement(ETA, ZETA, perturbJup1)/1000.0;
    var PS8 = this._perturbationElement(ETA, ZETA, perturbJup2)/1000.0;
    var PH8 = this._perturbationElement(ETA, ZETA, perturbJup3)/1000.0;
    var PH  = 2.58 + 0.1*T;

    if (PH > 3.5) PH = 3.5;
    if (PH < 1.5) PH = 1.5;

    this.l += ( L7 + L8 );
    this.peri += (PS7 + PS8) / angles.sin(PH);
    this.e = angles.sin(PH + PH7 + PH8);
  },

  /**
   * Mean orbital element of Saturn with perturbation
   */
  _perturbationSaturn: function(jd) {
    var year = Math.floor((jd - 1721423.5) / 365.244 + 1.0);
    var T = year/1000.0;

    var AT = 0.88 - 0.0633*T + 0.03*T*T - 0.0006*T*T*T;
    var L7 = -0.50 + AT*angles.sin((T - 0.145)*360.0/0.95);
    var PS7 = -0.50 + (0.10 - 0.005*T) * angles.sin((T - 0.54)*360.0/0.95);
    var PH7 = -0.50 + (0.10 - 0.005*T) * angles.sin((T - 0.32)*360.0/0.95);
    var AX7 = -0.050 + (0.004 - 0.0005*T) * angles.sin((T - 0.35)*360.0/0.95);
    var ETA = angles.rounddeg(86.1 + 0.033459 * ( jd - 1721057.0 ));
    var ZETA = angles.rounddeg(89.1 + 0.049630 * ( jd - 1721057.0 ));
    var L8 = this._perturbationElement(ETA, ZETA, perturbSat1)/100.0;
    var PS8 = this._perturbationElement(ETA, ZETA, perturbSat2)/100.0;
    var PH8 = this._perturbationElement(ETA, ZETA, perturbSat3)/100.0;
    var AX8 = this._perturbationElement(ETA, ZETA, perturbSat4)/1000.0;
    var PH  = 3.56 - 0.175*T - 0.005*T*T;

    /* if year > 7000 then PH < 2.0 */
    if (PH < 2.0) PH = 2.0;

    this.l += ( L7 + L8 );
    this.peri += (PS7 + PS8) / angles.sin(PH);
    this.e = angles.sin(PH + PH7 + PH8);
    this.axis += AX7 + AX8;
  },

  /**
   * Get mean orbital elements (Mercury, Venus, Mars, Jupiter, Saturn)
   */
  _getPlanetElm1: function(planetNo, jd) {
    var C1 = (jd - ATime.JD1900) / 36525.0;
    var C2 = C1 * C1;
    var elmCf;

    switch (planetNo) {
      case Planets.Mercury:
        elmCf = MercuryE;
        break;
      case Planets.Venus:
        elmCf = VenusE;
        break;
      case Planets.Mars:
        elmCf = MarsE;
        break;
      case Planets.Jupiter:
        elmCf = JupiterE;
        break;
      case Planets.Saturn:
        elmCf = SaturnE;
        break;
      default:
        throw 'Arithmetic Exception';
    }

    /* M+peri+node */
    this.l = angles.rounddeg(elmCf.l + elmCf.L1 * C1 +
               elmCf.L2 * C2 + elmCf.L3 * C1 * C2);
    /* Ascending Node */
    this.node = angles.rounddeg(elmCf.node + elmCf.n1 * C1 +
               elmCf.n2 * C2 + elmCf.n3 * C1 * C2);
    /* Argument of Perihelion */
    this.peri = angles.rounddeg(elmCf.peri + elmCf.p1 * C1 +
               elmCf.p2 * C2 + elmCf.p3 * C1 * C2 - this.node);
    /* Semimajor Axis */
    this.axis = elmCf.axis;
    /* Eccentricity */
    this.e    = angles.rounddeg(elmCf.e + elmCf.e1 * C1 +
               elmCf.e2 * C2 + elmCf.e3 * C1 * C2 );
    /* Inclination */
    this.incl = angles.rounddeg(elmCf.incl + elmCf.i1 * C1 +
               elmCf.i2 * C2 + elmCf.i3 * C1 * C2);

    switch (planetNo) {
      case Planets.Jupiter:
        this._perturbationJupiter(jd);
        break;
      case Planets.Saturn:
        this._perturbationSaturn(jd);
        break;
    }
  },

  /**
   * Get mean orbital elements (Uranus, Neptune, Pluto)
   */
  _getPlanetElm2: function(planetNo, jd) {
    var T1 = ( jd - ATime.JD2000 ) / 36525.0;
    var T2 = T1 * T1;
    var d  = T1 * 36525.0;
    var elmCf = null;

    switch (planetNo) {
      case Planets.Uranus:
        elmCf = UranusE;
        break;
      case Planets.Neptune:
        elmCf = NeptuneE;
        break;
      default:
        throw "Arithmetic Exception";
    }

    /* M+peri+node */
    this.l    =  angles.rounddeg(elmCf.l + elmCf.L1 * d + elmCf.L2 *T2);
    /* Ascending Node */
    this.node =  angles.rounddeg(elmCf.node + elmCf.n1 * T1 + elmCf.n2 *T2);
    /* Argument of Perihelion */
    this.peri =  angles.rounddeg(elmCf.peri + elmCf.p1 * T1 + elmCf.p2 *T2 - this.node);
    /* Semimajor Axis */
    this.axis = angles.rounddeg(elmCf.axis + elmCf.a1 * T1 + elmCf.a2 *T2);
    /* Eccentricity */
    this.e    =  angles.rounddeg(elmCf.e + elmCf.e1 * T1 + elmCf.e2 *T2);
    /* Inclination */
    this.incl =  angles.rounddeg(elmCf.incl + elmCf.i1 * T1 + elmCf.i2 *T2);
  },

  /**
   * Get mean orbital elements (Earth)
   */
  _getPlanetElmEarth: function(jd) {
    var c = (jd - ATime.JD1900)/36525.0;
    var c2 = c * c;
    this.l = 180.0 + angles.rounddeg(280.6824 + 36000.769325*c + 7.22222e-4*c2);
    this.peri = 180.0 + angles.rounddeg(281.2206 +
      1.717697*c + 4.83333e-4*c2 + 2.77777e-6*c*c2);
    this.node = 0.0; /* no ascending node for the Earth */
    this.incl = 0.0; /* no inclination for the Earth */
    this.e = 0.0167498 - 4.258e-5*c - 1.37e-7*c2;
    this.axis = 1.00000129;
  }

};

function PlanetElmP1(
      l,    L1, L2, L3,
      peri, p1, p2, p3,
      node, n1, n2, n3,
      incl, i1, i2, i3,
      e,    e1, e2, e3,
      axis) {
  this.l    = l;    this.L1 = L1; this.L2 = L2; this.L3 = L3;
  this.peri = peri; this.p1 = p1; this.p2 = p2; this.p3 = p3;
  this.node = node; this.n1 = n1; this.n2 = n2; this.n3 = n3;
  this.incl = incl; this.i1 = i1; this.i2 = i2; this.i3 = i3;
  this.e    = e;    this.e1 = e1; this.e2 = e2; this.e3 = e3;
  this.axis = axis;
}

function PlanetElmP2(
          l,    L1, L2,
          peri, p1, p2,
          node, n1, n2,
          axis, a1, a2,
          e,    e1, e2,
          incl, i1, i2) {
  this.l = l;       this.L1 = L1; this.L2 = L2;
  this.peri = peri; this.p1 = p1; this.p2 = p2;
  this.node = node; this.n1 = n1; this.n2 = n2;
  this.axis = axis; this.a1 = a1; this.a2 = a2;
  this.e = e;       this.e1 = e1; this.e2 = e2;
  this.incl = incl; this.i1 = i1; this.i2 = i2;
}

/**
 * Wire up the module
 */
PlanetElm.prototype = planetElm;
module.exports = PlanetElm;
},{"./atime":5,"./planets":13,"angle-functions":2,"xyzed":3}],10:[function(require,module,exports){
var Xyz    = require('xyzed');
var Planets = require('./planets');
var angles = require('angle-functions');

/**
 * Planet Position by Expansion
 */

var planetExp = {
  getPosition: function(planetNo, atime) {
    switch (planetNo) {
      case Planets.Earth:
        return getPosExp0(atime.time1);
      case Planets.Venus:
      case Planets.Mars:
        return getPosExp1(planetNo, atime.time1);
      case Planets.Jupiter:
      case Planets.Saturn:
        return getPosExp2(planetNo, atime.time1);
      case Planets.Mercury:
      case Planets.Uranus:
      case Planets.Neptune:
        return getPosExp3(planetNo, atime.time2);
    }
    return null;
  }
};

// Mercury
var MercuryLambda = [
  new PlanetExpP0(0.5258, 448417.55,  74.38),
  new PlanetExpP0(0.1796, 298945.77, 137.84),
  new PlanetExpP0(0.1061, 597890.10,  249.2),
  new PlanetExpP0(0.0850,  149473.3,  143.0),
  new PlanetExpP0(0.0760,  448418.3,  312.6),
  new PlanetExpP0(0.0256,  597890.8,  127.4),
  new PlanetExpP0(0.0230,  747362.6,   64.0),
  new PlanetExpP0(0.0081,  747363.0,  302.0),
  new PlanetExpP0(0.0069,       1.0,  148.0),
  new PlanetExpP0(0.0052,  896835.0,  239.0),
  new PlanetExpP0(0.0023,  896836.0,  117.0),
  new PlanetExpP0(0.0019,    6356.0,   85.0),
  new PlanetExpP0(0.0011, 1046308.0,   54.0)
];

var MercuryBeta = [
  new PlanetExpP0(0.3123,  448417.92, 103.51),
  new PlanetExpP0(0.0753,   597890.4,  278.3),
  new PlanetExpP0(0.0367,   149472.1,   55.7),
  new PlanetExpP0(0.0187,   747362.9,   93.1),
  new PlanetExpP0(0.0050,   298945.0,  230.0),
  new PlanetExpP0(0.0047,   896835.0,  268.0),
  new PlanetExpP0(0.0028,   448419.0,  342.0),
  new PlanetExpP0(0.0023,   298946.0,  347.0),
  new PlanetExpP0(0.0020,   597891.0,  157.0),
  new PlanetExpP0(0.0012,  1046308.0,   83.0),
  new PlanetExpP0(0.0009,   747364.0,  331.0),
  new PlanetExpP0(0.0009,   448717.0,   45.0)
];

var MercuryR = [
  new PlanetExpP0(0.001214, 448417.55, 344.38),
  new PlanetExpP0(0.000218,  597890.1, 159.20),
  new PlanetExpP0(0.000042,  747363.0,  334.0),
  new PlanetExpP0(0.000006,  896835.0,  149.0)
];

// Venus
var VenusL0 = [
  new PlanetExpP0(-0.0048, 248.6, -19.34),
  new PlanetExpP0(-0.0004, 198.0,  720.0)
];

var VenusL1 = [
  new PlanetExpP0(0.0033, 357.9, 1170.35),
  new PlanetExpP0(0.0031, 242.3,  450.37),
  new PlanetExpP0(0.0020, 273.5,  675.55),
  new PlanetExpP0(0.0014,  31.1,  225.18)
];

var VenusQ = [
  new PlanetExpP0(-0.000015, 357.9, 1170.35),
  new PlanetExpP0( 0.000010,  62.3,  450.37),
  new PlanetExpP0(-0.000008,  93.0,   675.6)
];

var VenusP = new PlanetExpP1(
   310.1735,  585.19212,
    -0.0503,     107.44, 1170.37,
     0.7775,   -0.00005, 178.954, 585.178,
    0.05922,     233.72, 585.183,
  -0.002947, 0.00000021, 178.954, 585.178, -0.140658
);

// Mars
var MarsL0 = [
  new PlanetExpP0(-0.0048, 248.6, -19.34),
  new PlanetExpP0(-0.0004, 198.0,  720.0)
];

var MarsL1 = [
  new PlanetExpP0(0.6225, 187.54, 382.797),
  new PlanetExpP0(0.0503, 101.31, 574.196),
  new PlanetExpP0(0.0146,  62.31,   0.198),
  new PlanetExpP0(0.0071,   71.8,  161.05),
  new PlanetExpP0(0.0061,  230.2,  130.71),
  new PlanetExpP0(0.0046,   15.1,  765.59),
  new PlanetExpP0(0.0045,  147.5,  322.11),
  new PlanetExpP0(0.0039,  279.3,  -22.81),
  new PlanetExpP0(0.0024,  207.7,  168.59),
  new PlanetExpP0(0.0020,  140.1,  145.78),
  new PlanetExpP0(0.0018,  224.7,   10.98),
  new PlanetExpP0(0.0014,  221.8,  -45.62),
  new PlanetExpP0(0.0010,   91.4,  -30.34),
  new PlanetExpP0(0.0009,    268,   100.4)
];

var MarsQ = [
  new PlanetExpP0(-0.002825, 187.54, 382.797),
  new PlanetExpP0(-0.000249, 101.31, 574.196),
  new PlanetExpP0(-0.000024,   15.1,  765.59),
  new PlanetExpP0( 0.000023,  251.7,  161.05),
  new PlanetExpP0( 0.000022,  327.6,  322.11),
  new PlanetExpP0( 0.000017,   50.2,  130.71),
  new PlanetExpP0( 0.000007,   27.0,   168.6),
  new PlanetExpP0( 0.000006,  320.0,   145.8)
];

var MarsP = new PlanetExpP1(
   249.3542,   191.41696,
    -0.0149,       40.01, 382.819,
    10.6886,     0.00010, 273.768, 191.399,
    0.03227,      200.00, 191.409,
  -0.040421, -0.00000039, 273.768, 191.399, 0.183844
);

// Jupiter
var JupiterN = [
  new PlanetExpP0( 0.3323, 162.78,   0.385),
  new PlanetExpP0( 0.0541,  38.46, -36.256),
  new PlanetExpP0( 0.0447, 293.42, -29.941),
  new PlanetExpP0( 0.0342,  44.50,  -5.907),
  new PlanetExpP0( 0.0230, 201.25, -24.035),
  new PlanetExpP0( 0.0222, 109.99, -18.128),
  new PlanetExpP0(-0.0048,  248.6,  -19.34),
  new PlanetExpP0( 0.0047,  184.6,  -11.81),
  new PlanetExpP0( 0.0045,  150.1,  -54.38),
  new PlanetExpP0( 0.0042,  130.7,  -42.16),
  new PlanetExpP0( 0.0039,    7.6,    6.31),
  new PlanetExpP0( 0.0031,  163.2,   12.22),
  new PlanetExpP0( 0.0031,  145.6,    0.77),
  new PlanetExpP0( 0.0024,  191.3,   -0.23),
  new PlanetExpP0( 0.0019,  148.4,   24.44),
  new PlanetExpP0( 0.0017,  197.9, -29.941),
  new PlanetExpP0( 0.0010,  307.9,   36.66),
  new PlanetExpP0( 0.0010,  252.6,  -72.51),
  new PlanetExpP0( 0.0010,  269.0,  -60.29),
  new PlanetExpP0( 0.0010,  278.7,  -29.53),
  new PlanetExpP0( 0.0008,   52.0,   -66.6),
  new PlanetExpP0( 0.0008,   24.0,   -35.8),
  new PlanetExpP0( 0.0005,  356.0,    -5.5)
];

var JupiterB = [
  new PlanetExpP0(0.0010, 291.9, -29.94),
  new PlanetExpP0(0.0003, 196.0,  -24.0)
];

var JupiterQ = [
  new PlanetExpP0(0.000230,  38.47, -36.256),
  new PlanetExpP0(0.000168, 293.36, -29.941),
  new PlanetExpP0(0.000074, 200.50,  -24.03),
  new PlanetExpP0(0.000055,  110.0,  -18.13),
  new PlanetExpP0(0.000038,   39.3,   -5.91),
  new PlanetExpP0(0.000024,  150.9,  -54.38),
  new PlanetExpP0(0.000023,  336.4,    0.41),
  new PlanetExpP0(0.000019,  131.7,  -42.16),
  new PlanetExpP0(0.000009,  180.0,   -11.8),
  new PlanetExpP0(0.000007,  277.0,   -60.3),
  new PlanetExpP0(0.000006,  330.0,    24.4),
  new PlanetExpP0(0.000006,   53.0,   -66.6),
  new PlanetExpP0(0.000006,  188.0,     6.3),
  new PlanetExpP0(0.000006,  251.0,   -72.5),
  new PlanetExpP0(0.000006,  198.0,   -29.9),
  new PlanetExpP0(0.000005,  353.5,   12.22)
];

var JupiterP = new PlanetExpP2(
   13.6526, 0.01396,
    0.0075,    5.94,
    5.5280,  0.1666, 0.0070, 0.0003,
  0.022889, 272.975, 0.0128, 0.00010, 35.52,
  5.190688, 0.048254
);

// Saturn
var SaturnN = [
  new PlanetExpP0( 0.8081, 342.74,   0.385),
  new PlanetExpP0( 0.1900,   3.57, -11.813),
  new PlanetExpP0( 0.1173, 224.52,  -5.907),
  new PlanetExpP0( 0.0093,  176.6,    6.31),
  new PlanetExpP0( 0.0089,  218.5,  -36.26),
  new PlanetExpP0( 0.0080,   10.4,   -0.23),
  new PlanetExpP0( 0.0078,   56.8,    0.63),
  new PlanetExpP0( 0.0074,  325.4,    0.77),
  new PlanetExpP0( 0.0073,  209.4,  -24.03),
  new PlanetExpP0( 0.0064,  202.0,  -11.59),
  new PlanetExpP0(-0.0048,  248.6,  -19.34),
  new PlanetExpP0( 0.0034,  105.2,  -30.35),
  new PlanetExpP0( 0.0034,   23.6,  -15.87),
  new PlanetExpP0( 0.0025,  348.4,  -11.41),
  new PlanetExpP0( 0.0022,  102.5,   -7.94),
  new PlanetExpP0( 0.0021,   53.5,   -3.65),
  new PlanetExpP0( 0.0020,  220.4,  -18.13),
  new PlanetExpP0( 0.0018,  326.7,  -54.38),
  new PlanetExpP0( 0.0017,  173.0,   -5.50),
  new PlanetExpP0( 0.0014,  165.5,   -5.91),
  new PlanetExpP0( 0.0013,  307.9,  -42.16)
];

var SaturnB = [
  new PlanetExpP0(0.0024,   3.9, -11.81),
  new PlanetExpP0(0.0008, 269.0,   -5.9),
  new PlanetExpP0(0.0005, 135.0,  -30.3)
];

var SaturnQ = [
  new PlanetExpP0(0.000701,   3.43, -11.813),
  new PlanetExpP0(0.000378, 110.54, -18.128),
  new PlanetExpP0(0.000244, 219.13,  -5.907),
  new PlanetExpP0(0.000114, 158.22,   0.383),
  new PlanetExpP0(0.000064,  218.1,  -36.26),
  new PlanetExpP0(0.000042,  215.8,  -24.03),
  new PlanetExpP0(0.000024,  201.8,  -11.59),
  new PlanetExpP0(0.000024,    1.3,    6.31),
  new PlanetExpP0(0.000019,  307.7,   12.22),
  new PlanetExpP0(0.000015,  326.3,  -54.38),
  new PlanetExpP0(0.000010,  311.1,  -42.16),
  new PlanetExpP0(0.000010,   83.2,   24.44),
  new PlanetExpP0(0.000009,  348.0,   -11.4),
  new PlanetExpP0(0.000008,  129.0,   -30.3),
  new PlanetExpP0(0.000006,  295.0,   -29.9),
  new PlanetExpP0(0.000006,  148.0,   -48.5),
  new PlanetExpP0(0.000006,  103.0,    -7.9),
  new PlanetExpP0(0.000005,  318.0,    24.4),
  new PlanetExpP0(0.000005,   24.0,   -15.9)
];

var SaturnP = new PlanetExpP2(
   91.8560,  0.01396,
    0.0272,   135.53,
    6.4215,   0.2248, 0.0109, 0.0006,
  0.043519,  337.763, 0.0286, 0.00023, 77.06,
  9.508863, 0.056061
);

// Uranus
var UranusLambda = [
  new PlanetExpP0(5.35857, 460.61987, 48.85031),
  new PlanetExpP0(0.58964,  919.0429, 188.3245),
  new PlanetExpP0(0.12397, 1065.1192, 354.5935),
  new PlanetExpP0(0.01475,  2608.702,  351.028),
  new PlanetExpP0(0.00090,    1968.3,    247.7),
  new PlanetExpP0(0.00036,    5647.4,     10.4),
  new PlanetExpP0(0.00017,    2356.6,    183.6),
  new PlanetExpP0(0.00017,    2873.2,    321.9),
  new PlanetExpP0(0.00014,    3157.9,    308.1)
];

var UranusBeta = [
  new PlanetExpP0(1.15483, 419.91739, 128.15303),
  new PlanetExpP0(0.67756,  652.9504,  273.6644),
  new PlanetExpP0(0.13490,  998.0302,   83.3517),
  new PlanetExpP0(0.00025,    3030.9,     194.2)
];

var UranusR = [
  new PlanetExpP0(0.905790, 408.729, 320.313),
  new PlanetExpP0(0.062710,  799.95,   67.99),
  new PlanetExpP0(0.004897,  2613.7,    80.4),
  new PlanetExpP0(0.000656,  1527.0,   202.0),
  new PlanetExpP0(0.000223,  2120.0,   321.0),
  new PlanetExpP0(0.000205,  3104.0,    37.0),
  new PlanetExpP0(0.000120,  5652.0,   100.0)
];

// Neptune
var NeptuneLambda = [
  new PlanetExpP0(0.97450, 221.3904, 167.7269),
  new PlanetExpP0(0.01344,  986.281,   50.826),
  new PlanetExpP0(0.00945,  2815.89,     0.09),
  new PlanetExpP0(0.00235,  2266.50,   309.35),
  new PlanetExpP0(0.00225,  2279.43,   127.61),
  new PlanetExpP0(0.00023,   5851.6,     19.2)
];

var NeptuneBeta = [
  new PlanetExpP0(1.76958, 218.87906, 83.11018),
  new PlanetExpP0(0.01366,   447.128,  338.864),
  new PlanetExpP0(0.00015,    1107.1,    224.7),
  new PlanetExpP0(0.00015,    2596.7,    187.5),
  new PlanetExpP0(0.00012,    3035.0,    243.9)
];

var NeptuneR = [
  new PlanetExpP0(0.260457, 222.371, 79.994),
  new PlanetExpP0(0.004944,  2815.4,   90.1),
  new PlanetExpP0(0.003364,   524.0,  308.1),
  new PlanetExpP0(0.002579,  1025.1,  104.0),
  new PlanetExpP0(0.000120,  5845.0,  111.0)
];

// Sun
var SunLambda = [
  new PlanetExpP0( 0.0200,  353.06,  719.981),
  new PlanetExpP0(-0.0048,  248.64,  -19.341),
  new PlanetExpP0( 0.0020,   285.0,   329.64),
  new PlanetExpP0( 0.0018,   334.2, -4452.67),
  new PlanetExpP0( 0.0018,   293.7,    -0.20),
  new PlanetExpP0( 0.0015,   242.4,   450.37),
  new PlanetExpP0( 0.0013,   211.1,   225.18),
  new PlanetExpP0( 0.0008,   208.0,   659.29),
  new PlanetExpP0( 0.0007,    53.5,    90.38),
  new PlanetExpP0( 0.0007,    12.1,   -30.35),
  new PlanetExpP0( 0.0006,   239.1,   337.18),
  new PlanetExpP0( 0.0005,    10.1,    -1.50),
  new PlanetExpP0( 0.0005,    99.1,   -22.81),
  new PlanetExpP0( 0.0004,   264.8,   315.56),
  new PlanetExpP0( 0.0004,   233.8,   299.30),
  new PlanetExpP0(-0.0004,   198.1,   720.02),
  new PlanetExpP0( 0.0003,   349.6,  1079.97),
  new PlanetExpP0( 0.0003,   241.2,   -44.43)
];

var SunQ = [
  new PlanetExpP0(-0.000091,  353.1,   719.98),
  new PlanetExpP0( 0.000013,  205.8,  4452.67),
  new PlanetExpP0( 0.000007,   62.0,    450.4),
  new PlanetExpP0( 0.000007,  105.0,    329.6)
];

/**
 * Get Position of the Earth
 */
var getPosExp0 = function(fT) {
  var i, fLambda = 279.0358 + 360.00769 *
      fT + ( 1.9159 - 0.00005 * fT) *
      angles.sin((356.531)+ ( 359.991) * fT);

  for (i = 0; i < SunLambda.length; i++) {
    fLambda += SunLambda[i].a * angles.sin(SunLambda[i].b + SunLambda[i].c * fT);
  }

  fLambda += 0.0057;
  fLambda = angles.deg2rad(angles.rounddeg(fLambda));
  var fBeta = 0.0;

  var fq = (- 0.007261+0.0000002 * fT) *
      angles.cos((356.53) +
      (359.991) * fT) + 0.000030;

  for (i = 0; i < SunQ.length; i++) {
    fq += SunQ[i].a * angles.cos(SunQ[i].b + SunQ[i].b * fT);
  }

  var fRadius = Math.pow(10.0, fq);

  return new Xyz(-fRadius * Math.cos(fBeta) * Math.cos(fLambda),
           -fRadius * Math.cos(fBeta) * Math.sin(fLambda),
           -fRadius * Math.sin(fBeta));
};

/**
 * Get Position of Venus and Mars
 */
var getPosExp1 = function(planetNo, fT) {
  var ParamL0, ParamL1, ParamQ;
  var i, ParamP;

  switch (planetNo) {
    case Planets.Venus:
      ParamL0 = VenusL0;
      ParamL1 = VenusL1;
      ParamQ  = VenusQ;
      ParamP  = VenusP;
      break;
    case Planets.Mars:
      ParamL0 = MarsL0;
      ParamL1 = MarsL1;
      ParamQ  = MarsQ;
      ParamP  = MarsP;
      break;
    default:
      throw 'Arithmetic Exception';
  }

  var L1 = (ParamP.L6 + ParamP.L7 * fT) * angles.sin(ParamP.L8 + ParamP.L9 * fT);
  for (i = 0; i < ParamL1.length; i++) {
    L1 += ParamL1[i].a * angles.sin(ParamL1[i].b + ParamL1[i].c * fT);
  }

  var L0 = ParamP.L1 + ParamP.L2 * fT +
      ParamP.L3 * angles.sin(ParamP.L4 + ParamP.L5 * fT + 2.0 * L1);
  for (i = 0; i < ParamL0.length; i++) {
    L0 += ParamL0[i].a * angles.sin(ParamL0[i].b + ParamL0[i].c * fT);
  }

  var fLambda = angles.deg2rad(angles.rounddeg(L0 + L1));
  var fBeta = Math.asin(ParamP.B1 * angles.sin(ParamP.B2 + ParamP.B3 * fT + L1));
  var fq = (ParamP.q1 + ParamP.q2 * fT) *
      angles.cos(ParamP.q3 + ParamP.q4 * fT) + ParamP.q5;
  for (i = 0; i < ParamQ.length; i++) {
    fq += ParamQ[i].a * angles.cos(ParamQ[i].b + ParamQ[i].c * fT);
  }

  var fRadius = Math.pow(10.0, fq);

  return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
           fRadius * Math.cos(fBeta) * Math.sin(fLambda),
           fRadius * Math.sin(fBeta));
};

/**
 * Get Position of Jupiter and Saturn
 */
var getPosExp2 = function(planetNo, fT) {
  var ParamN, ParamB, ParamQ, ParamP;
  var i, fq, fN;

  switch (planetNo) {
    case Planets.Jupiter:
      ParamN = JupiterN;
      ParamB = JupiterB;
      ParamQ = JupiterQ;
      ParamP = JupiterP;
      fN  = 341.5208 + 30.34907 * fT;
      fN += (0.0350 + 0.00028 * fT) * angles.sin(245.94 - 30.349 * fT)+ 0.0004;
      fN -= (0.0019 + 0.00002 * fT) * angles.sin(162.78 +  0.38 * fT);
      fq  = (0.000132 + 0.0000011 * fT) * angles.cos(245.93 - 30.349 * fT);
      break;
    case Planets.Saturn:
      ParamN = SaturnN;
      ParamB = SaturnB;
      ParamQ = SaturnQ;
      ParamP = SaturnP;
      fN  = 12.3042 +12.22117 * fT;
      fN += (0.0934 + 0.00075 * fT) * angles.sin(250.29 + 12.221 * fT)+ 0.0008;
      fN += (0.0057 + 0.00005 * fT) * angles.sin(265.8  - 11.81 * fT);
      fN += (0.0049 + 0.00004 * fT) * angles.sin(162.7  +  0.38 * fT);
      fN += (0.0019 + 0.00002 * fT) * angles.sin(262.0  + 24.44 * fT);
      fq  = (0.000354 + 0.0000028 * fT) * angles.cos( 70.28 + 12.22 * fT) + 0.000183;
      fq += (0.000021 + 0.0000002 * fT) * angles.cos(265.80 - 11.81  * fT);
      break;
    default:
      throw "Arithmetic Exception";
  }

  // Lambda
  for (i = 0; i < ParamN.length; i++) {
    fN += ParamN[i].a * angles.sin(ParamN[i].b + ParamN[i].c * fT);
  }

  var ff = fN + ParamP.f1 * angles.sin(fN) +
        ParamP.f2 * angles.sin(2.0 * fN) +
        ParamP.f3 * angles.sin(3.0 * fN) +
        ParamP.f4 * angles.sin(4.0 * fN);
  var fV = ParamP.V1 * angles.sin(2.0 * ff + ParamP.V2);

  var fLambda = angles.deg2rad(angles.rounddeg(ff + fV +
                    ParamP.L1 + ParamP.L2 * fT));

  // Beta
  var fBeta = Math.asin(ParamP.B1 * angles.sin(ff + ParamP.B2)) +
              angles.deg2rad((ParamP.B3 + ParamP.B4 * fT) *
              angles.sin(ff + ParamP.B5));
  for (i = 0; i < ParamB.length; i++) {
    fBeta += ParamB[i].a * angles.sin(ParamB[i].b + ParamB[i].c * fT);
  }

  // Radius
  for (i = 0; i < ParamQ.length; i++) {
    fq += ParamQ[i].a * angles.cos(ParamQ[i].b + ParamQ[i].c * fT);
  }

  var fr = Math.pow(10.0, fq);
  var fRadius = fr * ParamP.r1 / ( 1.0 + ParamP.r2 * angles.cos(ff));

  return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
           fRadius * Math.cos(fBeta) * Math.sin(fLambda),
           fRadius * Math.sin(fBeta));
};

/**
 * Get Position of Mercury, Uranus, Neptune
 */
var getPosExp3 = function(planetNo, fT2) {
  var ParamL, ParamB, ParamR;
  var fLambda, fBeta, fRadius;

  switch (planetNo) {
    case Planets.Mercury:
      ParamL = MercuryLambda;
      ParamB = MercuryBeta;
      ParamR = MercuryR;

      fLambda = 252.2502 + 149474.0714 * fT2;
      fLambda += (23.4405 + 0.0023 * fT2) *
          angles.cos(149472.5153 * fT2 + 84.7947);
      fLambda += ( 2.9818 + 0.0006 * fT2) *
          angles.cos(298945.031 * fT2 + 259.589);

      fBeta = (6.7057 + 0.0017 * fT2) *
          angles.cos(149472.886 * fT2 + 113.919);
      fBeta += (1.4396 + 0.0005 * fT2) *
          angles.cos(0.37 * fT2 + 119.12);
      fBeta += (1.3643 + 0.0005 * fT2) *
          angles.cos(298945.40 * fT2 + 288.71);

      fRadius = 0.395283 + 0.000002 * fT2;
      fRadius += (0.078341 + 0.000008 * fT2) *
          angles.cos(149472.515 * fT2 + 354.795);
      fRadius += (0.007955 + 0.000002 * fT2) *
          angles.cos(298945.03 * fT2 + 169.59);
      break;
    case Planets.Uranus:
      ParamL = UranusLambda;
      ParamB = UranusBeta;
      ParamR = UranusR;

      fLambda = 313.33676 + 428.72880 * fT2;
      fLambda += 3.20671 * fT2 * angles.cos(705.15539 * fT2 + 114.02740);
      fLambda += 2.69325 * fT2 * angles.cos(597.77389 * fT2 + 317.76510);
      fLambda += 0.00015 * fT2 * angles.cos(3798.6 * fT2 + 313.4);

      fBeta = -0.02997;
      fBeta += 1.78488 * fT2 * angles.cos(507.52281 * fT2 + 188.32394);
      fBeta += 0.56518 * fT2 * angles.cos(892.2869 * fT2 + 354.9571);
      fBeta += 0.00036 * fT2 * angles.cos(1526.5 * fT2 + 263.0);

      fRadius = 19.203034 + 0.042617 * fT2;
      fRadius += 0.361949 * fT2 * angles.cos(440.702 * fT2 + 19.879);
      fRadius += 0.166685 * fT2 * angles.cos(702.024 * fT2 + 307.419);
      break;
    case Planets.Neptune:
      ParamL = NeptuneLambda;
      ParamB = NeptuneBeta;
      ParamR = NeptuneR;

      fLambda = - 55.13323 + 219.93503 * fT2;
      fLambda += 0.04403 * fT2 * angles.cos(684.128 * fT2 + 332.797);
      fLambda += 0.02928 * fT2 * angles.cos(904.371 * fT2 + 342.114);

      fBeta = 0.01725;

      fRadius = 30.073033;
      fRadius += 0.009784 * fT2 * angles.cos(515.2 * fT2 + 195.7);
      break;
    default:
      throw "Arithmetic Exception";
  }

  for(i = 0; i < ParamL.length; i++) {
    fLambda += ParamL[i].a * angles.cos(ParamL[i].b * fT2 + ParamL[i].c);
  }
  fLambda = angles.deg2rad(angles.rounddeg(fLambda));

  for(i = 0; i < ParamB.length; i++) {
    fBeta += ParamB[i].a * angles.cos(ParamB[i].b * fT2 + ParamB[i].c);
  }
  fBeta = angles.deg2rad(fBeta);

  for(i = 0; i < ParamR.length; i++) {
    fRadius += ParamR[i].a * angles.cos(ParamR[i].b * fT2 + ParamR[i].c);
  }

  return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
           fRadius * Math.cos(fBeta) * Math.sin(fLambda),
           fRadius * Math.sin(fBeta));
};

function PlanetExpP0(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

function PlanetExpP1( /* Venus and Mars */
  L1, L2, L3,
  L4, L5, L6,
  L7, L8, L9,
  B1, B2, B3,
  q1, q2, q3,
  q4, q5) {
  this.L1 = L1; this.L2 = L2; this.L3 = L3;
  this.L4 = L4; this.L5 = L5; this.L6 = L6;
  this.L7 = L7; this.L8 = L8; this.L9 = L9;
  this.B1 = B1; this.B2 = B2; this.B3 = B3;
  this.q1 = q1; this.q2 = q2; this.q3 = q3;
  this.q4 = q4; this.q5 = q5;
}

function PlanetExpP2( /* Jupiter and Saturn */
  L1, L2,
  V1, V2,
  f1, f2, f3, f4,
  B1, B2, B3, B4, B5,
  r1, r2) {
  this.L1 = L1; this.L2 = L2;
  this.V1 = V1; this.V2 = V2;
  this.f1 = f1; this.f2 = f2; this.f3 = f3; this.f4 = f4;
  this.B1 = B1; this.B2 = B2; this.B3 = B3; this.B4 = B4; this.B5 = B5;
  this.r1 = r1; this.r2 = r2;
}

/**
 * Wire up the module
 */
module.exports = planetExp;

},{"./planets":13,"angle-functions":2,"xyzed":3}],11:[function(require,module,exports){
var Xyz = require('xyzed');
var Matrix = require('./matrix');
var PlanetElm = require('./planet-elm');
var angles = require('angle-functions');

/**
 * PlanetOrbit module
 */

// Constructor
var PlanetOrbit = function(planetNo, atime, division){

  var planetElm = new PlanetElm(planetNo, atime);

  this.orbit = [];
  this.division = division;
  this._doGetPlanetOrbit(planetElm);

  var vec = Matrix.vectorConstant(planetElm.peri * Math.PI/180.0,
                     planetElm.node * Math.PI/180.0,
                     planetElm.incl * Math.PI/180.0,
                     atime);
  var prec = Matrix.precMatrix(atime.julian, 2451512.5);
  for(i = 0; i <= division; i++) {
    this.orbit[i] = this.orbit[i].rotate(vec).rotate(prec);
  }
};

// Instance members
var planetOrbit = {

  getAt: function(index){
    return this.orbit[index];
  },

  _doGetPlanetOrbit: function(planetElm) {
    var ae2 = -2.0 * planetElm.axis * planetElm.e;
    var t = Math.sqrt(1.0 - planetElm.e * planetElm.e);
    var xp1 = 0;
    var xp2 = this.division/2;
    var xp3 = this.division/2;
    var xp4 = this.division;
    var E = 0.0;

    for(var i = 0; i <= (this.division/4); i++, E += (360.0 / this.division)) {
      var rcosv = planetElm.axis * (angles.cos(E) - planetElm.e);
      var rsinv = planetElm.axis * t * angles.sin(E);
      this.orbit[xp1++] = new Xyz(rcosv,        rsinv, 0.0);
      this.orbit[xp2--] = new Xyz(ae2 - rcosv,  rsinv, 0.0);
      this.orbit[xp3++] = new Xyz(ae2 - rcosv, -rsinv, 0.0);
      this.orbit[xp4--] = new Xyz(rcosv,       -rsinv, 0.0);
    }
  }
};

/**
 * Wire up the module
 */
PlanetOrbit.prototype = planetOrbit;
module.exports = PlanetOrbit;
},{"./matrix":8,"./planet-elm":9,"angle-functions":2,"xyzed":3}],12:[function(require,module,exports){
var PlanetElm = require('./planet-elm');
var PlanetExp = require('./planet-exp');
var angles    = require('angle-functions');

/**
 * Planet module
 */

var julianStart = 2433282.5;  // 1950.0
var julianEnd   = 2473459.5;  // 2060.0

var planet = {

  /**
   * Get planet position in ecliptic coordinates (equinox date)
   */
  getPosition: function(planetNo, atime) {
    if (julianStart < atime.julian && atime.julian < julianEnd) {
      return PlanetExp.getPosition(planetNo, atime);
    } else {
      var planetElm = new PlanetElm(planetNo, atime);
      return planetElm.getPosition();
    }
  }

};

/**
 * Wire up the module
 */
module.exports = planet;

},{"./planet-elm":9,"./planet-exp":10,"angle-functions":2}],13:[function(require,module,exports){
module.exports = {
  Sun     : 0,
  Mercury : 1,
  Venus   : 2,
  Earth   : 3,
  Mars    : 4,
  Jupiter : 5,
  Saturn  : 6,
  Uranus  : 7,
  Neptune : 8
};


},{}],14:[function(require,module,exports){
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

var object = new Comet(objectDef);
var dimensions = {width: canvasElement.width, height: canvasElement.height};
var orbitCanvas = new Canvas(ctx, dimensions, object, todaytime);
orbitCanvas.update();


},{"./canvas.js":1,"./player.js":4,"./src/atime":5,"./src/comet":7}]},{},[14]);
