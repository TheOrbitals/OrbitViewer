var ATime = require('./atime');

/**
 * Matrix module (3x3)
 */

var fPrecLimit   = 30.0;
var fGeneralPrec = 360.0/25920;

/**
 * Constructor
 */
var Matrix = function(
  fA11, fA12, fA13,
  fA21, fA22, fA23,
  fA31, fA32, fA33){

  this.fA11 = fA11 || 0.0;
  this.fA12 = fA12 || 0.0;
  this.fA13 = fA13 || 0.0;
  this.fA21 = fA21 || 0.0;
  this.fA22 = fA22 || 0.0;
  this.fA23 = fA23 || 0.0;
  this.fA31 = fA31 || 0.0;
  this.fA32 = fA32 || 0.0;
  this.fA33 = fA33 || 0.0;
};

/**
 * Instance members
 */
var matrix = {

  /**
   * Multiply matrix
   */
  mul: function(factor){
    if(typeof factor === 'number'){
      return this._multiplyWithDouble(factor);
    }
    return this._multiplyWithMatrix(factor);
  },

  /**
   * Invert matrix
   */
  invert: function() {
    var a = 1.0 /
      (this.fA11 * (this.fA22 * this.fA33 - this.fA23 * this.fA32) -
       this.fA12 * (this.fA21 * this.fA33 - this.fA23 * this.fA31) +
       this.fA13 * (this.fA21 * this.fA32 - this.fA22 * this.fA31));

    var fA11 =  1.0 * a * (this.fA22 * this.fA33 - this.fA23 * this.fA32);
    var fA12 = -1.0 * a * (this.fA12 * this.fA33 - this.fA13 * this.fA32);
    var fA13 =  1.0 * a * (this.fA12 * this.fA23 - this.fA13 * this.fA22);

    var fA21 = -1.0 * a * (this.fA21 * this.fA33 - this.fA23 * this.fA31);
    var fA22 =  1.0 * a * (this.fA11 * this.fA33 - this.fA13 * this.fA31);
    var fA23 = -1.0 * a * (this.fA11 * this.fA23 - this.fA13 * this.fA21);

    var fA31 =  1.0 * a * (this.fA21 * this.fA32 - this.fA22 * this.fA31);
    var fA32 = -1.0 * a * (this.fA11 * this.fA32 - this.fA12 * this.fA31);
    var fA33 =  1.0 * a * (this.fA11 * this.fA22 - this.fA12 * this.fA21);

    this.fA11 = fA11;
    this.fA12 = fA12;
    this.fA13 = fA13;
    this.fA21 = fA21;
    this.fA22 = fA22;
    this.fA23 = fA23;
    this.fA31 = fA31;
    this.fA32 = fA32;
    this.fA33 = fA33;
  },

  /**
   * Multiplication of matrix
   */
  _multiplyWithMatrix: function(mtx) {
    var fA11 = this.fA11 * mtx.fA11 + this.fA12 * mtx.fA21 +
        this.fA13 * mtx.fA31;
    var fA21 = this.fA21 * mtx.fA11 + this.fA22 * mtx.fA21 +
        this.fA23 * mtx.fA31;
    var fA31 = this.fA31 * mtx.fA11 + this.fA32 * mtx.fA21 +
        this.fA33 * mtx.fA31;

    var fA12 = this.fA11 * mtx.fA12 + this.fA12 * mtx.fA22 +
        this.fA13 * mtx.fA32;
    var fA22 = this.fA21 * mtx.fA12 + this.fA22 * mtx.fA22 +
        this.fA23 * mtx.fA32;
    var fA32 = this.fA31 * mtx.fA12 + this.fA32 * mtx.fA22 +
        this.fA33 * mtx.fA32;

    var fA13 = this.fA11 * mtx.fA13 + this.fA12 * mtx.fA23 +
        this.fA13 * mtx.fA33;
    var fA23 = this.fA21 * mtx.fA13 + this.fA22 * mtx.fA23 +
        this.fA23 * mtx.fA33;
    var fA33 = this.fA31 * mtx.fA13 + this.fA32 * mtx.fA23 +
        this.fA33 * mtx.fA33;

    return new Matrix(fA11, fA12, fA13,
                      fA21, fA22, fA23,
                      fA31, fA32, fA33);
  },

  /**
   * Multiplication of matrix by double
   */
  _multiplyWithDouble: function(x) {
    var fA11 = this.fA11 * x;
    var fA21 = this.fA21 * x;
    var fA31 = this.fA31 * x;

    var fA12 = this.fA12 * x;
    var fA22 = this.fA22 * x;
    var fA32 = this.fA32 * x;

    var fA13 = this.fA13 * x;
    var fA23 = this.fA23 * x;
    var fA33 = this.fA33 * x;

    return new Matrix(fA11, fA12, fA13,
                      fA21, fA22, fA23,
                      fA31, fA32, fA33);
  }

};

/**
 * Get vector constant from angle elements
 */
function vectorConstant (fPeri, fNode, fIncl, equinox) {
  // Equinox
  var fT1 = equinox.time1;
  var fT2 = equinox.time2;

  // Obliquity of Ecliptic
  var fEps;
  if (fT2 < -40.0) {
    fEps = 23.83253 * Math.PI / 180.0;
  } else if(fT2 > 40.0) {
    fEps = 23.05253 * Math.PI / 180.0;
  } else{
    fEps = 23.44253 - 0.00013 * fT1 +
           0.00256 * Math.cos((249.0 -  19.3 * fT1) * Math.PI / 180.0) +
           0.00015 * Math.cos((198.0 + 720.0 * fT1) * Math.PI / 180.0);
    fEps *= Math.PI / 180.0;
  }
  var fSinEps = Math.sin(fEps);
  var fCosEps = Math.cos(fEps);

  var fSinPeri = Math.sin(fPeri);
  var fSinNode = Math.sin(fNode);
  var fSinIncl = Math.sin(fIncl);
  var fCosPeri = Math.cos(fPeri);
  var fCosNode = Math.cos(fNode);
  var fCosIncl = Math.cos(fIncl);
  var fWa =  fCosPeri * fSinNode + fSinPeri * fCosIncl * fCosNode;
  var fWb = -fSinPeri * fSinNode + fCosPeri * fCosIncl * fCosNode;

  var fA11 = fCosPeri * fCosNode  - fSinPeri * fCosIncl * fSinNode;
  var fA21 = fWa * fCosEps - fSinPeri * fSinIncl * fSinEps;
  var fA31 = fWa * fSinEps + fSinPeri * fSinIncl * fCosEps;
  var fA12 = -fSinPeri * fCosNode - fCosPeri * fCosIncl * fSinNode;
  var fA22 = fWb * fCosEps - fCosPeri * fSinIncl * fSinEps;
  var fA32 = fWb * fSinEps + fCosPeri * fSinIncl * fCosEps;

  return new Matrix(fA11, fA12, 0.0,
                            fA21, fA22, 0.0,
                            fA31, fA32, 0.0);
}

/**
 * Create precession matrix
 */
function precMatrix(fOldEpoch, fNewEpoch) {
  var fJd = 0.0;
  var bSwapEpoch = false;
  var bOuterNewcomb = false;
  if (fNewEpoch == fOldEpoch) {
    return new Matrix(1.0, 0.0, 0.0,
                      0.0, 1.0, 0.0,
                      0.0, 0.0, 1.0);
  }
  var fT = (fOldEpoch - ATime.JD2000) / 36525.0;
  if (fT < -fPrecLimit || fPrecLimit < fT) {
    bSwapEpoch = true;
    var fTmp = fNewEpoch;
    fNewEpoch = fOldEpoch;
    fOldEpoch = fTmp;
    fT = (fOldEpoch - ATime.JD2000) / 36525.0;
  }

  var fT2 = fT * fT;
  var ftt, ft;
  ftt = ft = (fNewEpoch - fOldEpoch) / 36525.0;
  if (ftt < -fPrecLimit) {
    bOuterNewcomb = true;
    ft = -fPrecLimit;
    fJd = -fPrecLimit * 36525.0 + ATime.JD2000;
  }
  if (fPrecLimit < ftt) {
    bOuterNewcomb = true;
    ft = fPrecLimit;
    fJd =  fPrecLimit * 36525.0 + ATime.JD2000;
  }

  var ft2 = ft * ft;
  var ft3 = ft2 * ft;

  var fzeta0 = ( (2306.2181 + 1.39656*fT - 0.000139*fT2)*ft +
        (0.30188 - 0.000344*fT)*ft2 + 0.017998*ft3 ) / 3600.0;
  var fzpc   = ( (2306.2181 + 1.39656*fT - 0.000139*fT2)*ft +
        (1.09468 + 0.000066*fT)*ft2 + 0.018203*ft3 ) / 3600.0;
  var ftheta = ( (2004.3109 - 0.85330*fT - 0.000217*fT2)*ft -
        (0.42665 + 0.000217*fT)*ft2 - 0.041833*ft3 ) / 3600.0;

  var mtx1, mtx2, mtx3;
  mtx1 = rotateZ((90.0 - fzeta0) * Math.PI / 180.0);
  mtx2 = rotateX(ftheta * Math.PI / 180.0);
  mtx3 = mtx2.mul(mtx1);
  mtx1 = rotateZ((-90 - fzpc) * Math.PI / 180.0);

  var mtxPrec = mtx1.mul(mtx3);

  if (bOuterNewcomb) {
    var fDjd;
    if (ftt < -fPrecLimit) {
      fDjd = (fNewEpoch - fOldEpoch) + fPrecLimit * 36525.0;
    } else {
      fDjd = (fNewEpoch - fOldEpoch) - fPrecLimit * 36525.0;
    }
    var fPrecPrm = -fDjd / 365.24 * fGeneralPrec * Math.PI / 180.0;
    var fEps = ATime.getEp(fJd);
    mtx1 = rotateX(fEps);
    mtx2 = rotateZ(fPrecPrm);
    mtx3 = mtx2.mul(mtx1);
    mtx2 = rotateX(-fEps);
    mtx1 = mtx2.mul(mtx3);
    mtxPrec = mtx1.mul(mtxPrec);
  }

  if(bSwapEpoch){
    mtxPrec.invert();
  }

  return mtxPrec;
}

/**
 * Create rotation matrix around x-axis
 */
function rotateX(angle) {
  var fA11 =  1.0;
  var fA12 =  0.0;
  var fA13 =  0.0;
  var fA21 =  0.0;
  var fA22 =  Math.cos(angle);
  var fA23 =  Math.sin(angle);
  var fA31 =  0.0;
  var fA32 = -Math.sin(angle);
  var fA33 =  Math.cos(angle);

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 *  Create rotation matrix around y-axis
 */
function rotateY(angle) {
  var fA11 =  Math.cos(angle);
  var fA12 =  0.0;
  var fA13 = -Math.sin(angle);
  var fA21 =  0.0;
  var fA22 =  1.0;
  var fA23 =  0.0;
  var fA31 =  Math.sin(angle);
  var fA32 =  0.0;
  var fA33 =  Math.cos(angle);

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 * Create rotation matrix around z-axis
 */
function rotateZ(angle) {
  var fA11 =  Math.cos(angle);
  var fA12 =  Math.sin(angle);
  var fA13 =  0.0;
  var fA21 = -Math.sin(angle);
  var fA22 =  Math.cos(angle);
  var fA23 =  0.0;
  var fA31 =  0.0;
  var fA32 =  0.0;
  var fA33 =  1.0;

  return new Matrix(fA11, fA12, fA13,
                    fA21, fA22, fA23,
                    fA31, fA32, fA33);
}

/**
 * Static members
 */
Matrix.rotateX = rotateX;
Matrix.rotateY = rotateY;
Matrix.rotateZ = rotateZ;
Matrix.precMatrix = precMatrix;
Matrix.vectorConstant = vectorConstant;

/**
 * Wire up the module
 */
Matrix.prototype = matrix;
module.exports = Matrix;
