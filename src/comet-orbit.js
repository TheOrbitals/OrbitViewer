require("time");
require("xyz");

/**
 * CometOrbit Class
 */

module.exports.CometOrbit = function(comet, division) {

  var orbit = []; // actual orbit data
  var nDivision;  // number of division
  var maxOrbit = 90.0;
  var tolerance = 1.0e-16;

  this.division = division;

  for(var d = 0; d < division; d++) {
    orbit.push(new Xyz());
  }

  if (comet.e < 1.0 - tolerance) {
    GetOrbitEllip(comet);
  } else if (comet.e > 1.0 + tolerance) {
    GetOrbitHyper(comet);
  } else {
    GetOrbitPara(comet);
  }

  var vec = comet.vectorConstant;
  var prec = Matrix.PrecMatrix(comet.getEquinoxJd(), Astro.JD2000);
  for (var i = 0; i <= nDivision; i++) {
    orbit[i] = orbit[i].Rotate(vec).Rotate(prec);
  }

  /**
   *  Elliptical Orbit
   */
  var GetOrbitEllip = function(comet) {
    var fAxis = comet.q / (1.0 - comet.e);
    var fae2 = -2.0 * fAxis * comet.e;
    var ft = Math.sqrt(1.0 - comet.e * comet.e);
    var i, nIdx1, nIdx2, fE, fRCosV, fRSinV;
    if (fAxis * (1.0 + comet.e) > fMaxOrbit) {
      var fdE = Math.acos((1.0 - fMaxOrbit / fAxis) / comet.e) /
          ((this.nDivision / 2) * (this.nDivision / 2));
      nIdx1 = nIdx2 = this.nDivision / 2;
      for (i = 0; i <= (this.nDivision / 2); i++) {
        fE = fdE * i * i;
        fRCosV = fAxis * (Math.cos(fE) - comet.e);
        fRSinV = fAxis * ft * Math.sin(fE);
        orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
        orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
      }
    } else {
      var nIdx3, nIdx4;
      nIdx1 = 0;
      nIdx2 = nIdx3 = this.nDivision / 2;
      nIdx4 = this.nDivision;
      fE = 0.0;
      for (i = 0; i <= (this.nDivision / 4);
         i++, fE += (2.0 * Math.PI / this.nDivision)) {
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
  var GetOrbitHyper = function(comet) {
    var nIdx1, nIdx2;
    var ft = Math.sqrt(comet.e * comet.e - 1.0);
    var fAxis = comet.e / (comet.e - 1.0);
    var fdF = UdMath.arccosh((fMaxOrbit + fAxis) /
              (fAxis * comet.e)) / (this.nDivision / 2);
    var fF = 0.0;
    nIdx1 = nIdx2 = this.nDivision / 2;
    for (var i = 0; i <= (this.nDivision / 2); i++, fF += fdF) {
      var fRCosV = fAxis * (comet.e - UdMath.cosh(fF));
      var fRSinV = fAxis * ft * UdMath.sinh(fF);
      orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
      orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
    }
  };

  /**
   * Parabolic Orbit
   */
  var GetOrbitPara = function(comet) {
    var nIdx1, nIdx2;
    var fdV = (Math.atan(Math.sqrt(fMaxOrbit / comet.e - 1.0)) *
              2.0) / (nDivision / 2);
    var fV = 0.0;
    nIdx1 = nIdx2 = nDivision / 2;
    for (var i = 0; i <= (nDivision / 2); i++, fV += fdV) {
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
