var Xyz    = require('./xyz');
var ATime  = require('./atime');
var Astro  = require('./astro');
var Matrix = require('./matrix');
// require("../bower_components/numbers");

/**
 * Comet module
 */

module.exports = function(comet) {

  this.name    = comet.name;
  this.t       = comet.t;
  this.e       = comet.e;
  this.q       = comet.q;
  this.peri    = comet.peri;
  this.node    = comet.node;
  this.incl    = comet.incl;
  this.equinox = comet.equinox;

  var maxApprox = 80;
  var tolerance = 1.0e-12;

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
  this.vectorConstant = Matrix.vectorConstant(this.peri, this.node, this.incl, this.equinoxTime);

  /**
   * Get Position on Orbital Plane for Elliptical Orbit
   */
  var cometStatusEllip = function(julian) {
    if (this.q === 0.0) {
      throw 'Arithmetic Exception';
    }
    var fAxis = this.q / (1.0 - this.e);
    var fM = Astro.GAUSS * (julian - this.t) / (Math.sqrt(fAxis) * fAxis);
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
  };

  /**
   * Get Position on Orbital Plane for Parabolic Orbit
   */
  var cometStatusPara = function(julian) {
    if (this.q === 0.0) {
      throw 'Arithmetic Exception';
    }
    var fN = Astro.GAUSS * (julian - this.t) /
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
  };

  /**
   * Get Position on Orbital Plane for Nearly Parabolic Orbit
   */
  var cometStatusNearPara = function(julian) {
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
      fN = fB0 * fA * Astro.GAUSS * (julian - this.t) /
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
  };

  /**
   * Get Position in Heliocentric Equatorial Coordinates 2000.0
   */
  this.getPosition = function(julian) {
    var xyz;
    // CometStatus' may be throw ArithmeticException
    if (this.e < 0.98) {
      xyz = cometStatusEllip(julian);
    } else if (Math.abs(this.e - 1.0) < tolerance) {
      xyz = cometStatusPara(julian);
    } else {
      xyz = cometStatusNearPara(julian);
    }
    xyz = xyz.rotate(this.vectorConstant);
    var mtxPrec = Matrix.precMatrix(this.equinoxTime.julian, Astro.JD2000);
    return xyz.rotate(mtxPrec);
  };

  this.getEquinoxJd = function() {
    return this.equinoxTime.julian;
  };

};
