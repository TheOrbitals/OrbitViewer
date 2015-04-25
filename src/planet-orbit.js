var Xyz = require("./xyz");
var PlanetElm = require("./planet-elm");

/**
 * PlanetOrbit module
 */

// Constructor
var PlanetOrbit = function(planetNo, atime, division){

  var planetElm = new PlanetElm(planetNo, atime);

  this._doGetPlanetOrbit(planetElm);
  this.division = division;

  for(d = 0; d < division; d++) {
    this.orbit.push(new Xyz());
  }

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

  orbit: [],

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
      var rcosv = planetElm.axis * (UdMath.udcos(E) - planetElm.e);
      var rsinv = planetElm.axis * t * UdMath.udsin(E);
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