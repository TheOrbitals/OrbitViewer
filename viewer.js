var Xyz    = require('./src/xyz');
var Astro  = require('./src/astro');
var ATime  = require('./src/atime');
var Comet  = require('./src/comet');
var Planet = require('./src/planet');
var Matrix = require('./src/matrix');
var Planets = require('./src/planets');
var CometOrbit = require('./src/comet-orbit');
var PlanetOrbit = require('./src/planet-orbit');

var canvasElement = document.getElementById("canvas");
var ctx = canvasElement.getContext("2d");

var date = new Date();
var today = {
  year: date.getFullYear(),
  month: date.getMonth()+1,
  day: date.getDate(),
  hour: date.getHours()+1,
  minute: date.getMinutes(),
  second: date.getSeconds(),
  timezone: 0
};

var todaytime = new ATime(today);

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

var n = Astro.GAUSS / (params.a * Math.sqrt(params.a));
var objectDef = {
  name   : 'Ceres',
  epoch  : 19991118.5,
  t      : (new ATime({julian: todaytime.julian - (Math.PI*2 - params.M) / n, timezone: 0.0})),
  e      : 0.07831587,
  q      : params.a * (1.0 - 0.07831587),
  peri   : 73.917708,
  node   : 80.495123,
  incl   : 10.583393,
  equinox: 2000.0
};

var object = new Comet(objectDef);
var orbitCanvas = new OrbitCanvas(ctx, object, todaytime);
orbitCanvas.update();

function OrbitCanvas(canvas, object, atime) {

  var planetCount = 8;
  var centerObjectSelected = 0;
  // var object = object;

  /**
   * Date
   */
  // this.atime = atime;

  /**
   * Projection Parameters
   */
  var zoom    = 5.0;
  var rotateH = 15.0;
  var rotateV = 15.0;

  /**
   * Rotation Matrix
   */
  var mtxToEcl   = null;
  var epochToEcl = null;
  var mtxRotate  = null;
  var x0 = 0; var y0 = 0; // Origin

  /**
   * Orbital Curve Class (Initialized in Constructor)
   */
  var objectOrbit;
  var epochPlanetOrbit;
  var planetOrbit = [];
  // for(var po = 0; po < planetCount; po++){
  //   planetOrbit.push(new PlanetOrbit());
  // }

  /**
   * Colors
   */
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

  var planetPos = [];
  for(var p = 0; p < planetCount; p++){
    planetPos.push(new Xyz());
  }

  var orbitDisplay = [];
  for(var o = 0; o < planetCount+2; o++){
    orbitDisplay.push(true);
  }
  orbitDisplay[0] = false;

  var init = function(){
    objectOrbit = new CometOrbit(object, 120);
    // updatePlanetOrbit(atime);
    updateRotationMatrix(atime);
    setDate(atime);
  };

  // no offscreen image
  offscreen = null;

  // no name labels
  bPlanetName = false;
  bObjectName = false;
  bDistanceLabel = true;
  bDateLabel = true;

  function drawLine(x0, y0, x1, y1){
      canvas.beginPath();
      canvas.moveTo(x0, y0);
      canvas.lineTo(x1, y1);
      canvas.closePath();
      canvas.stroke();
  }

  var drawElipticAxis = function(){
      var xyz, point;
      canvas.strokeStyle = colorAxisMinus;

      // -X
      xyz = (new Xyz(-50.0, 0.0, 0.0)).rotate(mtxRotate);
      point = getDrawPoint(xyz);
      drawLine(x0, y0, point.x, point.y);

      // -Z
      xyz = (new Xyz(0.0, 0.0, -50.0)).rotate(mtxRotate);
      point = getDrawPoint(xyz);
      drawLine(x0, y0, point.x, point.y);

      canvas.strokeStyle = colorAxisPlus;

      // +X
      xyz = (new Xyz( 50.0, 0.0, 0.0)).rotate(mtxRotate);
      point = getDrawPoint(xyz);
      drawLine(x0, y0, point.x, point.y);
      // +Z
      xyz = (new Xyz(0.0, 0.0, 50.0)).rotate(mtxRotate);
      point = getDrawPoint(xyz);
      drawLine(x0, y0, point.x, point.y);
  };

  var getDrawPoint = function(xyz) {
    // 600 means 5...fZoom...100 -> 120AU...Width...6AU
    var mul = zoom * canvasElement.width / 600.0 *
               (1.0 + xyz.z / 250.0);   // Parse
    var x = x0 + Math.round(xyz.x * mul);
    var y = y0 - Math.round(xyz.y * mul);
    return {x: x, y: y};
  };

  /**
   * Date Parameter Set
   */
  var setDate = function(atime) {
    objectPos = object.getPosition(atime.julian);
    for (var i = 0; i < planetCount; i++) {
      planetPos[i] = Planet.getPosition(Planets.Mercury+i, atime);
    }
  };

  /**
   * Rotation Matrix Equatorial(2000)->Ecliptic(DATE)
   */
  var updateRotationMatrix = function(atime) {
    var mtxPrec = Matrix.precMatrix(Astro.JD2000, atime.julian);
    var mtxEqt2Ecl = Matrix.rotateX(ATime.getEp(atime.julian));
    mtxToEcl = mtxEqt2Ecl.mul(mtxPrec);
    epochToEcl = atime.julian;
  };

  this.update = function() {
    var point3;
    var xyz, xyz1;

    // Calculate Drawing Parameter
    var mtxRotH = Matrix.rotateZ(rotateH * Math.PI / 180.0);
    var mtxRotV = Matrix.rotateX(rotateV * Math.PI / 180.0);
    mtxRotate = mtxRotV.mul(mtxRotH);

    x0 = canvasElement.width  / 2;
    y0 = canvasElement.height / 2;

    if (Math.abs(epochToEcl - atime.julian) > 365.2422 * 5) {
      updateRotationMatrix(atime);
    }

    // If center object is comet/asteroid
    if (centerObjectSelected == 1 )   {
       xyz = objectOrbit.getAt(0).rotate(mtxToEcl).rotate(mtxRotate);
       xyz = objectPos.rotate(mtxToEcl).Rotate(mtxRotate);
       point3 = getDrawPoint(xyz);

       x0 = canvasElement.width - point3.x;
       y0 = canvasElement.height - point3.y;

       if (Math.abs(epochToEcl - atime.julian) > 365.2422 * 5) {
            updateRotationMatrix(atime);
       }
    }
    // If center object is one of the planets
    else if (centerObjectSelected > 1 )   {
       xyz = planetPos[centerObjectSelected -2].Rotate(this.mtxRotate);

       point3 = getDrawPoint(xyz);

       x0 = canvasElement.width - point3.x;
       y0 = canvasElement.height - point3.y;

       if (Math.abs(epochToEcl - atime.julian) > 365.2422 * 5) {
            updateRotationMatrix(atime);
       }
    }

    // Get Off-Screen Image Graphics Context
    // Graphics og = offscreen.getGraphics();

    // Draw Frame
    canvas.strokeStyle = colorBackground;
    canvas.fillRect(0, 0, canvasElement.width - 1, canvasElement.height - 1);

    // Draw Ecliptic Axis
    drawElipticAxis();

    // Draw Sun
    canvas.fillStyle = colorSun;
    canvas.beginPath();
    canvas.arc(x0 - 2, y0 - 2, 5, 0, Math.PI*2, true);
    canvas.fill();

    // Draw Orbit of Object
    xyz = objectOrbit.getAt(0).rotate(mtxToEcl).rotate(mtxRotate);
    var point1, point2;
    point1 = getDrawPoint(xyz);
    if (orbitDisplay[0] || orbitDisplay[1]) {
      for (var i = 1; i <= objectOrbit.division; i++) {
        xyz = objectOrbit.getAt(i).rotate(mtxToEcl);
        if (xyz.z >= 0.0) {
          canvas.strokeStyle = colorObjectOrbitUpper;
        } else {
          canvas.strokeStyle = colorObjectOrbitLower;
        }
        xyz = xyz.rotate(mtxRotate);
        point2 = getDrawPoint(xyz);
        drawLine(point1.x, point1.y, point2.x, point2.y);
        point1 = point2;
      }
    }

    /*

    // Draw Object Body
    xyz = this.objectPos.Rotate(this.mtxToEcl).Rotate(this.mtxRotate);
    point1 = getDrawPoint(xyz);
    og.setColor(colorObject);
    og.fillArc(point1.x - 2, point1.y - 2, 5, 5, 0, 360);
    og.setFont(fontObjectName);
    if (bObjectName) {
      og.setColor(colorObjectName);
      og.drawString(object.getName(), point1.x + 5, point1.y);
    }

    //  Draw Orbit of Planets
    if (Math.abs(epochPlanetOrbit - atime.getJd()) > 365.2422 * 5) {
      updatePlanetOrbit(atime);
    }
    og.setFont(fontPlanetName);

    if (OrbitDisplay[0] || OrbitDisplay[10]) {
      drawPlanetOrbit(og, planetOrbit[Planets.PLUTO-Planets.MERCURY],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    drawPlanetBody(og, planetPos[8], "Pluto");

    if (OrbitDisplay[0] || OrbitDisplay[9]) {

      drawPlanetOrbit(og, planetOrbit[Planets.NEPTUNE-Planets.MERCURY],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    drawPlanetBody(og, planetPos[7], "Neptune");

    if (OrbitDisplay[0] || OrbitDisplay[8]) {
      drawPlanetOrbit(og, planetOrbit[Planets.URANUS-Planets.MERCURY],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    drawPlanetBody(og, planetPos[6], "Uranus");

    if (OrbitDisplay[0] || OrbitDisplay[7]) {
      drawPlanetOrbit(og, planetOrbit[Planets.SATURN-Planets.MERCURY],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    drawPlanetBody(og, planetPos[5], "Saturn");

    if (OrbitDisplay[0] || OrbitDisplay[6]) {
      drawPlanetOrbit(og, planetOrbit[Planets.JUPITER-Planets.MERCURY],
              colorPlanetOrbitUpper, colorPlanetOrbitLower);
    }
    drawPlanetBody(og, planetPos[4], "Jupiter");

    if (fZoom * 1.524 >= 7.5) {
      if (OrbitDisplay[0] || OrbitDisplay[5]) {

        drawPlanetOrbit(og, planetOrbit[Planets.MARS-Planets.MERCURY],
                colorPlanetOrbitUpper, colorPlanetOrbitLower);
      }
      drawPlanetBody(og, planetPos[3], "Mars");
    }
    if (fZoom * 1.000 >= 7.5) {
                        if (OrbitDisplay[0] || OrbitDisplay[4]) {

         drawEarthOrbit(og, planetOrbit[Planets.EARTH-Planets.MERCURY],
            colorPlanetOrbitUpper, colorPlanetOrbitUpper);
                        }
      drawPlanetBody(og, planetPos[2], "Earth");

    }
    if (fZoom * 0.723 >= 7.5) {
                        if (OrbitDisplay[0] || OrbitDisplay[3]) {
         drawPlanetOrbit(og, planetOrbit[Planets.VENUS-Planets.MERCURY],
            colorPlanetOrbitUpper, colorPlanetOrbitLower);
                        }
      drawPlanetBody(og, planetPos[1], "Venus");
    }
    if (fZoom * 0.387 >= 7.5) {
                        if (OrbitDisplay[0] || OrbitDisplay[2]) {
         drawPlanetOrbit(og, planetOrbit[Planets.MERCURY-Planets.MERCURY],
            colorPlanetOrbitUpper, colorPlanetOrbitLower);
                        }
      drawPlanetBody(og, planetPos[0], "Mercury");
    }

    // Information
    og.setFont(fontInformation);
    og.setColor(colorInformation);
    FontMetrics fm = og.getFontMetrics();

    // Object Name String
    point1.x = fm.charWidth('A');
    // point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3;
    point1.y = 2 * fm.charWidth('A');
    og.drawString(object.getName(), point1.x, point1.y);

    if (bDistanceLabel) {
      // Earth & Sun Distance
      double edistance, sdistance;
      double xdiff, ydiff, zdiff;
      // BigDecimal a,v;
      String strDist;
      xyz  = this.objectPos.Rotate(this.mtxToEcl).Rotate(this.mtxRotate);
      xyz1 = planetPos[2].Rotate(this.mtxRotate);
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
  };

  init();

}
