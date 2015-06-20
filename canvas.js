var Xyz = require('xyzed')
var ATime = require('./src/atime')
var Planet = require('./src/planet')
var Matrix = require('./src/matrix')
var Planets = require('./src/planets')
var CometOrbit = require('./src/comet-orbit')
var PlanetOrbit = require('./src/planet-orbit')

/**
 * Canvas class
 */

// Constructor
function Canvas (context, config, object) {
  this.init(context, config, object)
}

// Colors
var colorBackground = '#000000'
var colorObjectOrbitUpper = '#00F5FF'
var colorObjectOrbitLower = '#0000FF'
var colorObject = '#00FFFF'
var colorObjectName = '#00CCCC'
var colorPlanetOrbitUpper = '#FFFFFF'
var colorPlanetOrbitLower = '#808080'
var colorPlanet = '#00FF00'
var colorPlanetName = '#00AA00'
var colorSun = '#D04040'
var colorAxisPlus = '#FFFF00'
var colorAxisMinus = '#555500'
var colorInformation = '#FFFFFF'

// Other private statics for the module
var planetCount = 8 // TODO: Get rid of this

/**
 * Instance members
 */
var canvas = {
  init: function (context, config, neo) {
    this.canvasContext = context
    this.atime = config.datetime
    this.setConfig(config)
    this.object = neo

    this._planetOrbit = []

    this._planetPos = []
    for (var p = 0; p < planetCount; p++) {
      this._planetPos.push(new Xyz())
    }

    this._orbitDisplay = []
    for (var o = 0; o < planetCount + 2; o++) {
      this._orbitDisplay.push(true)
    }
    this._orbitDisplay[0] = false
    // this._orbitDisplay[7] = false
    // this._orbitDisplay[8] = false
    // this._orbitDisplay[9] = false

    this._objectOrbit = new CometOrbit(neo, 120)

    this._epochPlanetOrbit = null
    this._updatePlanetOrbit()

    this._updateRotationMatrix()
    this.setDate(this.atime)
  },

  setConfig: function (config) {
    this.dimensions = config.dimensions
    this._centerObjectSelected = config.centerOnObjectIndex

    this.bPlanetName = config.showPlanetNames
    this.bObjectName = config.showNeoName
    this.bDistanceLabel = config.showDistance
    this.bDateLabel = config.showDateTime

    this._zoom = config.zoom
    this._rotateV = config.verticalRotation
    this._rotateH = config.horizontalRotation
    this._font = config.font
  },

  /**
   * Date Parameter Set
   */
  setDate: function (atime) {
    this._objectPos = this.object.getPosition(atime.julian)
    for (var i = 0; i < planetCount; i++) {
      this._planetPos[i] = Planet.getPosition(Planets.Mercury + i, atime)
    }
  },

  update: function () {
    var point3
    var xyz

    // Calculate Drawing Parameter
    var mtxRotH = Matrix.rotateZ(this._rotateH * Math.PI / 180.0)
    var mtxRotV = Matrix.rotateX(this._rotateV * Math.PI / 180.0)
    this._mtxRotate = mtxRotV.mul(mtxRotH)

    this._x0 = this.dimensions.width / 2
    this._y0 = this.dimensions.height / 2

    if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
      this._updateRotationMatrix(this.atime)
    }

    if (this._centerObjectSelected === 1) { // If center object is comet/asteroid
      xyz = this._objectOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate)
      xyz = this._objectPos.rotate(this._mtxToEcl).Rotate(this._mtxRotate)
      point3 = this._getDrawPoint(xyz)

      this._x0 = this.dimensions.width - point3.x
      this._y0 = this.dimensions.height - point3.y

      if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
        this._updateRotationMatrix(this.atime)
      }
    } else if (this._centerObjectSelected > 1) { // If center object is one of the planets
      xyz = this._planetPos[this._centerObjectSelected - 2].Rotate(this._mtxRotate)

      point3 = this._getDrawPoint(xyz)

      this._x0 = this.dimensions.width - point3.x
      this._y0 = this.dimensions.height - point3.y

      if (Math.abs(this._epochToEcl - this.atime.julian) > 365.2422 * 5) {
        this._updateRotationMatrix(this.atime)
      }
    }

    // Get Off-Screen Image Graphics Context
    // Graphics og = offscreen.getGraphics()

    // Draw Frame
    this.canvasContext.fillStyle = colorBackground
    this.canvasContext.strokeStyle = colorBackground
    this.canvasContext.fillRect(0, 0, this.dimensions.width - 1, this.dimensions.height - 1)

    // Draw Ecliptic Axis
    this._drawEclipticAxis()

    // Draw Sun
    this.canvasContext.fillStyle = colorSun
    this.canvasContext.beginPath()
    this.canvasContext.arc(this._x0, this._y0, 5, 0, Math.PI * 2, false)
    this.canvasContext.fill()

    // Draw Orbit of Object
    xyz = this._objectOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate)
    var point1, point2
    point1 = this._getDrawPoint(xyz)
    if (this._orbitDisplay[0] || this._orbitDisplay[1]) {
      for (var i = 1; i <= this._objectOrbit.division; i++) {
        xyz = this._objectOrbit.getAt(i).rotate(this._mtxToEcl)
        if (xyz.z >= 0.0) {
          this.canvasContext.strokeStyle = colorObjectOrbitUpper
        } else {
          this.canvasContext.lineWidth = 3
          this.canvasContext.strokeStyle = colorObjectOrbitLower
        }
        xyz = xyz.rotate(this._mtxRotate)
        point2 = this._getDrawPoint(xyz)
        this._drawLine(point1.x, point1.y, point2.x, point2.y)
        point1 = point2
      }
    }

    // Draw object body
    xyz = this._objectPos.rotate(this._mtxToEcl).rotate(this._mtxRotate)
    point1 = this._getDrawPoint(xyz)
    this.canvasContext.fillStyle = colorObject
    this.canvasContext.beginPath()
    this.canvasContext.arc(point1.x, point1.y, 4, 0, Math.PI * 2, false)
    this.canvasContext.fill()

    // Draw object's label
    if (this.bObjectName) {
      this.canvasContext.font = this._font
      this.canvasContext.fillStyle = colorObjectName
      this.canvasContext.fillText(this.object.name, point1.x + 10, point1.y)
    }

    // Draw Orbit of Planets
    if (Math.abs(this._epochPlanetOrbit - this.atime.julian) > 365.2422 * 5) {
      this._updatePlanetOrbit(this.atime)
    }
    this.canvasContext.font = this._font

    if (this._orbitDisplay[0] || this._orbitDisplay[9]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Neptune - 1],
        colorPlanetOrbitUpper, colorPlanetOrbitLower)
    }
    this._drawPlanetBody(this._planetPos[7], 'Neptune')

    if (this._orbitDisplay[0] || this._orbitDisplay[8]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Uranus - 1],
        colorPlanetOrbitUpper, colorPlanetOrbitLower)
    }
    this._drawPlanetBody(this._planetPos[6], 'Uranus')

    if (this._orbitDisplay[0] || this._orbitDisplay[7]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Saturn - 1],
        colorPlanetOrbitUpper, colorPlanetOrbitLower)
    }
    this._drawPlanetBody(this._planetPos[5], 'Saturn')

    if (this._orbitDisplay[0] || this._orbitDisplay[6]) {
      this._drawPlanetOrbit(this._planetOrbit[Planets.Jupiter - 1],
        colorPlanetOrbitUpper, colorPlanetOrbitLower)
    }
    this._drawPlanetBody(this._planetPos[4], 'Jupiter')

    if (this._zoom * 1.524 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[5]) {
        this._drawPlanetOrbit(this._planetOrbit[Planets.Mars - 1],
          colorPlanetOrbitUpper, colorPlanetOrbitLower)
      }
      this._drawPlanetBody(this._planetPos[3], 'Mars')
    }

    if (this._zoom * 1.000 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[4]) {
        this._drawEarthOrbit(this._planetOrbit[Planets.Earth - 1],
          colorPlanetOrbitUpper, colorPlanetOrbitUpper)
      }
      this._drawPlanetBody(this._planetPos[2], 'Earth')
    }

    if (this._zoom * 0.723 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[3]) {
        this._drawPlanetOrbit(this._planetOrbit[Planets.Venus - 1],
          colorPlanetOrbitUpper, colorPlanetOrbitLower)
      }
      this._drawPlanetBody(this._planetPos[1], 'Venus')
    }

    if (this._zoom * 0.387 >= 7.5) {
      if (this._orbitDisplay[0] || this._orbitDisplay[2]) {
        this._drawPlanetOrbit(this._planetOrbit[Planets.Mercury - 1],
          colorPlanetOrbitUpper, colorPlanetOrbitLower)
      }
      this._drawPlanetBody(this._planetPos[0], 'Mercury')
    }

  /*
  // Information
  og.setFont(fontInformation)
  og.setColor(colorInformation)
  FontMetrics fm = og.getFontMetrics()

  // Object Name String
  point1.x = fm.charWidth('A')
  // point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3
  point1.y = 2 * fm.charWidth('A')
  og.drawString(this.object.getName(), point1.x, point1.y)

  if (bDistanceLabel) {
    // Earth & Sun Distance
    double edistance, sdistance
    double xdiff, ydiff, zdiff
    // BigDecimal a,v
    String strDist
    xyz  = this._objectPos.Rotate(this.this._mtxToEcl).Rotate(this._mtxRotate)
    xyz1 = this._planetPos[2].Rotate(this._mtxRotate)
    sdistance = Math.sqrt((xyz.fX * xyz.fX) + (xyz.fY * xyz.fY) +
                (xyz.fZ * xyz.fZ)) + .0005
    sdistance = (int)(sdistance * 1000.0)/1000.0
    xdiff = xyz.fX - xyz1.fX
    ydiff = xyz.fY - xyz1.fY
    zdiff = xyz.fZ - xyz1.fZ
    edistance = Math.sqrt((xdiff * xdiff) + (ydiff * ydiff) +
                (zdiff * zdiff)) + .0005
    edistance = (int)(edistance * 1000.0)/1000.0
//      a = new BigDecimal (edistance)
//      v = a.setScale (3, BigDecimal.ROUND_HALF_UP)
    strDist = "Earth Distance: " + edistance + " AU"
    point1.x = fm.charWidth('A')
//      point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3
    point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight()
    og.drawString(strDist, point1.x, point1.y)

//      a = new BigDecimal (sdistance)
//      v = a.setScale (3, BigDecimal.ROUND_HALF_UP)
    strDist = "Sun Distance  : " + sdistance + " AU"
    point1.x = fm.charWidth('A')
    point1.y = this.sizeCanvas.height - fm.getDescent() - fm.getHeight() / 3
    og.drawString(strDist, point1.x, point1.y)
  }
  */
  },

  /**
   * Rotation Matrix Equatorial(2000)->Ecliptic(DATE)
   */
  _updateRotationMatrix: function () {
    var mtxPrec = Matrix.precMatrix(ATime.JD2000, this.atime.julian)
    var mtxEqt2Ecl = Matrix.rotateX(ATime.getEp(this.atime.julian))
    this._mtxToEcl = mtxEqt2Ecl.mul(mtxPrec)
    this._epochToEcl = this.atime.julian
  },

  _updatePlanetOrbit: function () {
    for (var i = Planets.Mercury; i <= Planets.Neptune; i++) {
      var newOrbit = new PlanetOrbit(i, this.atime, 48)
      this._planetOrbit[i - 1] = newOrbit
    }
    this._epochPlanetOrbit = this.atime.julian
  },

  _drawLine: function (x1, y1, x2, y2) {
    this.canvasContext.beginPath()
    this.canvasContext.moveTo(x1, y1)
    this.canvasContext.lineTo(x2, y2)
    this.canvasContext.closePath()
    this.canvasContext.stroke()
  },

  _drawEclipticAxis: function () {
    var xyz, point
    this.canvasContext.strokeStyle = colorAxisMinus

    // -X
    xyz = (new Xyz(-50.0, 0.0, 0.0)).rotate(this._mtxRotate)
    point = this._getDrawPoint(xyz)
    this._drawLine(this._x0, this._y0, point.x, point.y)

    // -Z
    xyz = (new Xyz(0.0, 0.0, -50.0)).rotate(this._mtxRotate)
    point = this._getDrawPoint(xyz)
    this._drawLine(this._x0, this._y0, point.x, point.y)

    this.canvasContext.strokeStyle = colorAxisPlus

    // +X
    xyz = (new Xyz(50.0, 0.0, 0.0)).rotate(this._mtxRotate)
    point = this._getDrawPoint(xyz)
    this._drawLine(this._x0, this._y0, point.x, point.y)
    // +Z
    xyz = (new Xyz(0.0, 0.0, 50.0)).rotate(this._mtxRotate)
    point = this._getDrawPoint(xyz)
    this._drawLine(this._x0, this._y0, point.x, point.y)
  },

  _getDrawPoint: function (xyz) {
    // 600 means 5...fZoom...100 -> 120AU...Width...6AU
    var mul = this._zoom * this.dimensions.width / 600.0 *
      (1.0 + xyz.z / 250.0)   // Parse
    var x = this._x0 + Math.round(xyz.x * mul)
    var y = this._y0 - Math.round(xyz.y * mul)
    return {x: x, y: y}
  },

  _drawPlanetOrbit: function (planetOrbit, colorUpper, colorLower) {
    var point1, point2
    var xyz = planetOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate)
    point1 = this._getDrawPoint(xyz)
    for (var i = 1; i <= planetOrbit.division; i++) {
      xyz = planetOrbit.getAt(i).rotate(this._mtxToEcl)
      if (xyz.z >= 0.0) {
        this.canvasContext.strokeStyle = colorUpper
      } else {
        this.canvasContext.strokeStyle = colorLower
      }
      xyz = xyz.rotate(this._mtxRotate)
      point2 = this._getDrawPoint(xyz)
      this._drawLine(point1.x, point1.y, point2.x, point2.y)
      point1 = point2
    }
  },

  _drawEarthOrbit: function (planetOrbit, colorUpper, colorLower) {
    var point1, point2
    var xyz = planetOrbit.getAt(0).rotate(this._mtxToEcl).rotate(this._mtxRotate)
    point1 = this._getDrawPoint(xyz)
    for (var i = 1; i <= planetOrbit.division; i++) {
      xyz = planetOrbit.getAt(i).rotate(this._mtxToEcl)
      this.canvasContext.strokeStyle = colorUpper
      xyz = xyz.rotate(this._mtxRotate)
      point2 = this._getDrawPoint(xyz)
      this._drawLine(point1.x, point1.y, point2.x, point2.y)
      point1 = point2
    }
  },

  _drawPlanetBody: function (planetPos, strName) {
    var xyz = planetPos.rotate(this._mtxRotate)
    var point = this._getDrawPoint(xyz)
    this.canvasContext.fillStyle = colorPlanet
    this.canvasContext.beginPath()
    this.canvasContext.arc(point.x, point.y, 4, 0, Math.PI * 2, false)
    this.canvasContext.fill()
    if (this.bPlanetName) {
      this.canvasContext.fillStyle = colorPlanetName
      this.canvasContext.fillText(strName, point.x + 10, point.y)
    }
  }

}

/**
 * Wire up the module
 */
Canvas.prototype = canvas
module.exports = Canvas
