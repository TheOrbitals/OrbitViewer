var PlanetElm = require('./planet-elm')
var PlanetExp = require('./planet-exp')

/**
 * Planet module
 */

var julianStart = 2433282.5  // 1950.0
var julianEnd = 2473459.5    // 2060.0

var planet = {
  /**
   * Get planet position in ecliptic coordinates (equinox date)
   */
  getPosition: function (planetNo, atime) {
    if (julianStart < atime.julian && atime.julian < julianEnd) {
      return PlanetExp.getPosition(planetNo, atime)
    } else {
      var planetElm = new PlanetElm(planetNo, atime)
      return planetElm.getPosition()
    }
  }

}

/**
 * Wire up the module
 */
module.exports = planet
