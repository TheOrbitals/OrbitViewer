var Xyz    = require('./src/xyz');
var Astro  = require('./src/astro');
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

  this._planetCount = 8;

  this._zoom    = 61.0;
  this._rotateH = 15.0;
  this._rotateV = 50.0;

  this._planetPos = [];
  for(var p = 0; p < this._planetCount; p++){
    this._planetPos.push(new Xyz());
  }

  this._planetOrbit = [];
  // for(var po = 0; po < this._planetCount; po++){
  //   this._planetOrbit.push(new PlanetOrbit());
  // }

  this._orbitDisplay = [];
  for(var o = 0; o < this._planetCount+2; o++){
    this._orbitDisplay.push(true);
  }
  this._orbitDisplay[0] = false;

  this._objectOrbit = new CometOrbit(object, 120);

  this.epochPlanetOrbit = null;
  // updatePlanetOrbit(atime);

  this._updateRotationMatrix(atime);
  this.setDate(atime);
}


/**
 * Instance members
 */
var canvas = {

  _centerObjectSelected: 0,

  /**
   * Colors
   */
  colorBackground       : '#000000',
  colorObjectOrbitUpper : '#00F5FF',
  colorObjectOrbitLower : '#0000FF',
  colorObject           : '#00FFFF',
  colorObjectName       : '#00CCCC',
  colorPlanetOrbitUpper : '#FFFFFF',
  colorPlanetOrbitLower : '#808080',
  colorPlanet           : '#00FF00',
  colorPlanetName       : '#00AA00',
  colorSun              : '#D04040',
  colorAxisPlus         : '#FFFF00',
  colorAxisMinus        : '#555500',
  colorInformation      : '#FFFFFF',

  /**
   * Rotation Matrix Equatorial(2000)->Ecliptic(DATE)
   */
  _updateRotationMatrix: function(atime) {
    var mtxPrec = Matrix.precMatrix(Astro.JD2000, atime.julian);
    var mtxEqt2Ecl = Matrix.rotateX(ATime.getEp(atime.julian));
    this._mtxToEcl = mtxEqt2Ecl.mul(mtxPrec);
    this._epochToEcl = atime.julian;
  },

  _drawLine: function(x1, y1, x2, y2){
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(x1, y1);
      this.canvasContext.lineTo(x2, y2);
      this.canvasContext.closePath();
      this.canvasContext.stroke();
  },

  // no offscreen image
  offscreen:  null,

  // no name labels
  bPlanetName: false,
  bObjectName: false,
  bDistanceLabel: true,
  bDateLabel: true,

  _drawEclipticAxis: function(){
      var xyz, point;
      this.canvasContext.strokeStyle = this.colorAxisMinus;

      // -X
      xyz = (new Xyz(-50.0, 0.0, 0.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);

      // -Z
      xyz = (new Xyz(0.0, 0.0, -50.0)).rotate(this._mtxRotate);
      point = this._getDrawPoint(xyz);
      this._drawLine(this._x0, this._y0, point.x, point.y);

      this.canvasContext.strokeStyle = this.colorAxisPlus;

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

  /**
   * Date Parameter Set
   */
  setDate: function(atime) {
    this._objectPos = this.object.getPosition(atime.julian);
    for (var i = 0; i < this._planetCount; i++) {
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
    this.canvasContext.strokeStyle = this.colorBackground;
    this.canvasContext.fillRect(0, 0, this.dimensions.width - 1, this.dimensions.height - 1);

    // Draw Ecliptic Axis
    this._drawEclipticAxis();

    // Draw Sun
    this.canvasContext.fillStyle = this.colorSun;
    this.canvasContext.beginPath();
    this.canvasContext.arc(this._x0 - 2, this._y0 - 2, 5, 0, Math.PI*2, true);
    this.canvasContext.fill();

    // Draw Orbit of Object
    xyz = this._objectOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate);
    var point1, point2;
    point1 = this._getDrawPoint(xyz);
    if (this._orbitDisplay[0] || this._orbitDisplay[1]) {
      for (var i = 1; i <= this._objectOrbit.division; i++) {
        xyz = this._objectOrbit.getAt(i).rotate(this._mtxToEcl);
        if (xyz.z >= 0.0) {
          this.canvasContext.strokeStyle = this.colorObjectOrbitUpper;
        } else {
          this.canvasContext.strokeStyle = this.colorObjectOrbitLower;
        }
        xyz = xyz.rotate(this._mtxRotate);
        point2 = this._getDrawPoint(xyz);
        this._drawLine(point1.x, point1.y, point2.x, point2.y);
        point1 = point2;
      }
    }

    /*

    // Draw Object Body
    xyz = this._objectPos.Rotate(this._mtxToEcl).Rotate(this._mtxRotate);
    point1 = this._getDrawPoint(xyz);
    og.setColor(this.colorObject);
    og.fillArc(point1.x - 2, point1.y - 2, 5, 5, 0, 360);
    og.setFont(fontObjectName);
    if (bObjectName) {
      og.setColor(this.colorObjectName);
      og.drawString(this.object.getName(), point1.x + 5, point1.y);
    }

    //  Draw Orbit of Planets
    if (Math.abs(epochPlanetOrbit - this.atime.getJd()) > 365.2422 * 5) {
      updatePlanetOrbit(this.atime);
    }
    og.setFont(fontPlanetName);

    if (this._orbitDisplay[0] || this._orbitDisplay[10]) {
      drawPlanetOrbit(og, this._planetOrbit[Planets.PLUTO-Planets.MERCURY],
              this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
    }
    drawPlanetBody(og, this._planetPos[8], "Pluto");

    if (this._orbitDisplay[0] || this._orbitDisplay[9]) {

      drawPlanetOrbit(og, this._planetOrbit[Planets.NEPTUNE-Planets.MERCURY],
              this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
    }
    drawPlanetBody(og, this._planetPos[7], "Neptune");

    if (this._orbitDisplay[0] || this._orbitDisplay[8]) {
      drawPlanetOrbit(og, this._planetOrbit[Planets.URANUS-Planets.MERCURY],
              this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
    }
    drawPlanetBody(og, this._planetPos[6], "Uranus");

    if (this._orbitDisplay[0] || this._orbitDisplay[7]) {
      drawPlanetOrbit(og, this._planetOrbit[Planets.SATURN-Planets.MERCURY],
              this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
    }
    drawPlanetBody(og, this._planetPos[5], "Saturn");

    if (this._orbitDisplay[0] || this._orbitDisplay[6]) {
      drawPlanetOrbit(og, this._planetOrbit[Planets.JUPITER-Planets.MERCURY],
              this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
    }
    drawPlanetBody(og, this._planetPos[4], "Jupiter");

    if (fZoom * 1.524 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[5]) {

        drawPlanetOrbit(og, this._planetOrbit[Planets.MARS-Planets.MERCURY],
                this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
      }
      drawPlanetBody(og, this._planetPos[3], "Mars");
    }
    if (fZoom * 1.000 >= 7.5) {
                        if (this._orbitDisplay[0] || this._orbitDisplay[4]) {

         drawEarthOrbit(og, this._planetOrbit[Planets.EARTH-Planets.MERCURY],
            this.colorPlanetOrbitUpper, this.colorPlanetOrbitUpper);
                        }
      drawPlanetBody(og, this._planetPos[2], "Earth");

    }
    if (fZoom * 0.723 >= 7.5) {
                        if (this._orbitDisplay[0] || this._orbitDisplay[3]) {
         drawPlanetOrbit(og, this._planetOrbit[Planets.VENUS-Planets.MERCURY],
            this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
                        }
      drawPlanetBody(og, this._planetPos[1], "Venus");
    }
    if (fZoom * 0.387 >= 7.5) {
                        if (this._orbitDisplay[0] || this._orbitDisplay[2]) {
         drawPlanetOrbit(og, this._planetOrbit[Planets.MERCURY-Planets.MERCURY],
            this.colorPlanetOrbitUpper, this.colorPlanetOrbitLower);
                        }
      drawPlanetBody(og, this._planetPos[0], "Mercury");
    }

    // Information
    og.setFont(fontInformation);
    og.setColor(this.colorInformation);
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
