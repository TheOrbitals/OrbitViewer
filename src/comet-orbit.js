var Xyz    = require('xyz');
var ATime  = require('atime');
var UdMath = require('udmath');

/**
 * CometOrbit module
 */

module.exports = function(comet, division) {

  var orbit = []; // actual orbit data
  var maxOrbit = 90.0;
  var tolerance = 1.0e-16;

  this.division = division;

  for(var d = 0; d < division; d++) {
    orbit.push(new Xyz());
  }

  if (comet.e < 1.0 - tolerance) {
    getOrbitEllip(comet);
  } else if (comet.e > 1.0 + tolerance) {
    getOrbitHyper(comet);
  } else {
    getOrbitPara(comet);
  }

  var vec = comet.vectorConstant;
  var prec = Matrix.precMatrix(comet.getEquinoxJd(), Astro.JD2000);
  for (var i = 0; i <= division; i++) {
    orbit[i] = orbit[i].rotate(vec).rotate(prec);
  }

  /**
   *  Elliptical Orbit
   */
  var getOrbitEllip = function(comet) {
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
        orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
        orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
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
        orbit[nIdx1++] = new Xyz(fRCosV,         fRSinV, 0.0);
        orbit[nIdx2--] = new Xyz(fae2 - fRCosV,  fRSinV, 0.0);
        orbit[nIdx3++] = new Xyz(fae2 - fRCosV, -fRSinV, 0.0);
        orbit[nIdx4--] = new Xyz(fRCosV,        -fRSinV, 0.0);
      }
    }
  };

  /**
   * Hyperbolic Orbit
   */
  var getOrbitHyper = function(comet) {
    var nIdx1, nIdx2;
    var ft = Math.sqrt(comet.e * comet.e - 1.0);
    var fAxis = comet.e / (comet.e - 1.0);
    var fdF = UdMath.arccosh((maxOrbit + fAxis) /
              (fAxis * comet.e)) / (this.division / 2);
    var fF = 0.0;
    nIdx1 = nIdx2 = this.division / 2;
    for (var i = 0; i <= (this.division / 2); i++, fF += fdF) {
      var fRCosV = fAxis * (comet.e - UdMath.cosh(fF));
      var fRSinV = fAxis * ft * UdMath.sinh(fF);
      orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
      orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
    }
  };

  /**
   * Parabolic Orbit
   */
  var getOrbitPara = function(comet) {
    var nIdx1, nIdx2;
    var fdV = (Math.atan(Math.sqrt(maxOrbit / comet.e - 1.0)) *
              2.0) / (this.division / 2);
    var fV = 0.0;
    nIdx1 = nIdx2 = this.division / 2;
    for (var i = 0; i <= (this.division / 2); i++, fV += fdV) {
      var fTanV2 = Math.sin(fV / 2.0) / Math.cos(fV / 2.0);
      var fRCosV = comet.e * (1.0 - fTanV2 * fTanV2);
      var fRSinV = 2.0 * comet.e * fTanV2;
      orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
      orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
    }
  };

  /**
   * Get Orbit Point
   */
  var getAt = function(index) {
    return this.orbit[index];
  };

};
