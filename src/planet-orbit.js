var Xyz = require("./xyz");

/**
 * PlanetOrbit module
 */

module.exports = function(planetNo, atime, division){

  this.planetNo = planetNo;
  this.julian = atime.julian;
  this.division = division;

  var orbit = [];
  for(d = 0; d < division; d++) {
    orbit.push(new Xyz());
  }
  var planetElm = new PlanetElm(planetNo, atime);
  doGetPlanetOrbit(planetElm);

  var vec = Matrix.VectorConstant(planetElm.peri * Math.PI/180.0,
                     planetElm.node * Math.PI/180.0,
                     planetElm.incl * Math.PI/180.0,
                     atime);
  var prec = Matrix.PrecMatrix(atime.julian, 2451512.5);
  for(i = 0; i <= division; i++) {
    orbit[i] = orbit[i].Rotate(vec).Rotate(prec);
  }

  function doGetPlanetOrbit(planetElm) {
    var ae2 = -2.0 * planetElm.axis * planetElm.e;
    var t = Math.sqrt(1.0 - planetElm.e * planetElm.e);
    var xp1 = 0;
    var xp2 = division/2;
    var xp3 = division/2;
    var xp4 = division;
    var E = 0.0;

    for(var i = 0; i <= (division/4); i++, E += (360.0 / division)) {
      var rcosv = planetElm.axis * (UdMath.udcos(E) - planetElm.e);
      var rsinv = planetElm.axis * t * UdMath.udsin(E);
      orbit[xp1++] = new Xyz(rcosv,        rsinv, 0.0);
      orbit[xp2--] = new Xyz(ae2 - rcosv,  rsinv, 0.0);
      orbit[xp3++] = new Xyz(ae2 - rcosv, -rsinv, 0.0);
      orbit[xp4--] = new Xyz(rcosv,       -rsinv, 0.0);
    }
  }

  this.getAt = function(index){
    return orbit[index];
  };

};
