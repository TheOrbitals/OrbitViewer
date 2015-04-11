var UdMath    = require('udmath');
var PlanetElm = require('planet-elm');
var PlanetExp = require('planet-exp');

/**
 * Planet module
 */

module.exports = function() {

  this.Sun = 0;
  this.Mercury = 1;
  this.Venus = 2;
  this.Earth = 3;
  this.Mars = 4;
  this.Jupiter = 5;
  this.Saturn = 6;
  this.Uranus = 7;
  this.Neptune = 8;

  var julianStart = 2433282.5;  // 1950.0
  var julianEnd   = 2473459.5;  // 2060.0

  /**
   * Get Planet Position in Ecliptic Coordinates (Equinox Date)
   */
  this.getPosition = function(planetNo, atime) {
    if (julianStart < atime.julian && atime.julian < julianEnd) {
      return PlanetExp.getPosition(planetNo, atime);
    } else {
      var planetElm = new PlanetElm(planetNo, atime);
      return planetElm.getPosition();
    }
  };

};
