(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Astronomical Constants
 */
module.exports = {
  GAUSS: 0.01720209895,
  JD2000: 2451545.0, // 2000.1.1 12h ET
  JD1900: 2415021.0  // 1900.1.1 12h ET
};

},{}],2:[function(require,module,exports){
var Astro = require('./astro');

/**
 * Astronomical time module
 */

module.exports = function(datetime) {

  // abbreviated month names
  var months = [
    "Jan.", "Feb.", "Mar.", "Apr.", "May ", "June",
    "July", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."
  ];

  // flags for changeDate
  this.intTime = 1;
  this.decTime = -1;

  this.year = datetime.year;
  this.month = datetime.month;
  this.day = Math.floor(datetime.day || 0.0);

  if(datetime.timezone === null || datetime.timezone === undefined) {
    throw 'Timezone is required';
  }

  this.hour = datetime.hour;
  if(!datetime.hour) {
    this.hour = Math.floor(((datetime.day || 0.0) - this.day) * 24.0);
  }

  this.minute = datetime.minute;
  if(!datetime.minute) {
    this.minute = Math.floor(((datetime.hour || 0.0) - this.hour) * 60.0);
  }

  this.second = datetime.second;
  if(!datetime.second) {
    this.second = Math.floor(((datetime.minute || 0.0) - this.minute) * 60.0);
  }

  this.timezone = datetime.timezone;

  this.init = function(){
    this.julian = datetime.julian || this.makeJulian() - datetime.timezone / 24.0;
    this.time1 = this.makeTime1(); // Origin 1974/12/31  0h ET
    this.time2 = this.makeTime2(); // Origin 2000/01/01 12h ET
  };

  /**
   * Get Abbreviated Month Name
   */
  this.getMonthAbbr = function(month) {
    return months[month - 1];
  };

  /**
   * YMD/HMS -> Julian Date
   */
  this.makeJulian = function() {
    var year  = this.year;
    var month = this.month;
    var date = this.day +
               this.hour  / 24.0 +
               this.minute / 24.0 / 60.0 +
               this.second / 24.0 / 60.0 / 60.0;
    if (month < 3) {
      month += 12;
      year  -=  1;
    }
    var julian = Math.floor(365.25 * year) +
                 Math.floor(30.59 * (month - 2)) +
                 date +1721086.5;
    if (julian > 2299160.5) {
      julian += Math.floor(year / 400.0) -
                Math.floor(year / 100.0) + 2.0;
    }
    return julian;
  };

  /**
   * Time Parameter Origin of 1974/12/31  0h ET
   */
  this.makeTime1 = function() {
    // 2442412.5 = 1974.12.31 0h ET
    var ft = (this.julian - 2442412.5) / 365.25;
    var time1 = ft + (0.0317 * ft + 1.43) * 0.000001;
    return time1;
  };

  /**
   * Time Parameter Origin of 2000/01/01 12h ET
   */
  this.makeTime2 = function() {
    var ft = (this.julian - Astro.JD2000) / 36525.0;
    return ft;
  };

  /**
   * Julian Date -> YMD/HMS
   */
  var getDate = function(julian) {
    julian += 0.5;
    var a = Math.floor(julian);
    if (a >= 2299160.5) {
      var t = Math.floor((a - 1867216.25) / 36524.25);
      a += t - Math.floor(t / 4.0) + 1.0;
    }
    var b = Math.floor(a) + 1524;
    var c = Math.floor((b - 122.1) / 365.25);
    var k = Math.floor((365.25) * c);
    var e = Math.floor((b - k) / 30.6001);
    var day = b - k - Math.floor(30.6001 * e) +
              (julian - Math.floor(julian));
    this.month = Math.floor(e - ((e >= 13.5) ? 13 : 1) + 0.5);
    this.year  = Math.floor(c - ((this.month > 2) ? 4716 : 4715) + 0.5);
    this.day   = Math.floor(day);
    var hour = (day - this.day) * 24.0;
    this.hour  = Math.floor(hour);
    var min = (hour - this.hour) * 60.0;
    this.minute   = Math.floor(min);
    this.second   = (min - this.minute) * 60.0;
  };

  this.changeDate = function(span, incOrDec) {
    //
    // First, calculate new Hour, Minute, and Second
    //
    var fHms1 = this.hour * 60.0 * 60.0 + this.minute  * 60.0 + this.second;
    var fHms2 = span.hour * 60.0 * 60.0 + span.minute  * 60.0 + span.second;
    fHms1 += (incOrDec == incTime) ? fHms2 : -fHms2;
    var nDay1;
    if (0.0 <= fHms1 && fHms1 < 24.0 * 60.0 * 60.0) {
      nDay1 = 0;
    } else if (fHms1 >= 24.0 * 60.0 * 60.0) {
      nDay1 = Math.floor(fHms1 / 24.0 / 60.0 / 60.0);
      fHms1 = UdMath.fmod(fHms1, 24.0 * 60.0 * 60.0);
    } else {
      nDay1 = Math.ceil(fHms1 / 24.0 / 60.0 / 60.0) - 1;
      fHms1 = UdMath.fmod(fHms1, 24.0 * 60.0 * 60.0) + 24.0 * 60.0 * 60.0;
    }

    var nNewHour = Math.floor(fHms1 / 60.0 / 60.0);
    var nNewMin  = Math.floor(fHms1 / 60.0) - nNewHour * 60;
    var fNewSec  = fHms1 - (nNewHour * 60.0 * 60.0 + nNewMin * 60.0);

    //
    // Next, calculate new Year, Month, Day
    //
    var newDate = new ATime(this.getYear(), this.getMonth(),
                  this.getDay(), 12, 0, 0.0, 0.0);
    var julian = newDate.getJd();
    julian += (nIncOrDec == incTime) ? nDay1 + span.day : nDay1 - span.day;
    newDate = new ATime(julian, 0.0);

    var nNewYear  = newDate.getYear();
    var nNewMonth = newDate.getMonth();
    var nNewDay   = newDate.getDay();
    nNewMonth += (nIncOrDec == incTime) ? span.month : -span.month;
    if (1 > nNewMonth) {
      nNewYear -= nNewMonth / 12 + 1;
      nNewMonth = 12 + nNewMonth % 12;
    } else if (nNewMonth > 12) {
      nNewYear += nNewMonth / 12;
      nNewMonth = 1 + (nNewMonth - 1) % 12;
    }
    nNewYear += (nIncOrDec == incTime) ? span.year : -span.year;

    // check bound between julian and gregorian
    if (nNewYear == 1582 && nNewMonth == 10) {
      if (5 <= nNewDay && nNewDay < 10) {
        nNewDay = 4;
      } else if (10 <= nNewDay && nNewDay < 15) {
        nNewDay = 15;
      }
    }
    newDate   = new ATime(nNewYear, nNewMonth, nNewDay, 12, 0, 0, 0.0);
    nNewYear  = newDate.getYear();
    nNewMonth = newDate.getMonth();
    nNewDay   = newDate.getDay();

    this.year   = nNewYear;
    this.month  = nNewMonth;
    this.day    = nNewDay;
    this.hour   = nNewHour;
    this.minute = nNewMin;
    this.second = fNewSec;
    this.julian = makeJulian() - timezone / 24.0;
    this.time1  = makeTime1();
    this.time2  = makeTime2();
  };

  /**
   * Print to Standard Output
   */
  this.toString = function() {
    return this.year     + "/"   +
           this.month    + "/"   +
           this.day      + " "   +
           this.hour     + ":"   +
           this.minute   + ":"   +
           this.second   + " = " + this.julian + " (TZ:" +
           this.timezone + ")";
  };

  this.init();

};

module.exports.getEp = getEp;

/**
 * Obliquity of Ecliptic (Static Function)
 */
function getEp(julian) {
  var ft = (this.julian - Astro.JD2000) / 36525.0;
  if (ft > 30.0){   // Out of Calculation Range
    ft = 30.0;
  } else if (ft < -30.0){
    ft = -30.0;
  }
  var fEp =  23.43929111 -
             46.8150  / 60.0 / 60.0 * ft -
             0.00059  / 60.0 / 60.0 * ft * ft +
             0.001813 / 60.0 / 60.0 * ft * ft * ft;
  return fEp * Math.PI / 180.0;
}


},{"./astro":1}],3:[function(require,module,exports){
var Xyz    = require('./xyz');
var Astro  = require('./astro');
var ATime  = require('./atime');
var UdMath = require('./udmath');
var Matrix = require('./matrix');

/**
 * CometOrbit module
 */

module.exports = function(comet, division) {

  var orbit = []; // actual orbit data
  var maxOrbit = 90.0;
  var tolerance = 1.0e-16;

  this.division = division;

  var init = function() {
    for(var d = 0; d <= division; d++) {
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
  };

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
          ((division / 2) * (division / 2));
      nIdx1 = nIdx2 = division / 2;
      for (i = 0; i <= (division / 2); i++) {
        fE = fdE * i * i;
        fRCosV = fAxis * (Math.cos(fE) - comet.e);
        fRSinV = fAxis * ft * Math.sin(fE);
        orbit[nIdx1++] = new Xyz(fRCosV,  fRSinV, 0.0);
        orbit[nIdx2--] = new Xyz(fRCosV, -fRSinV, 0.0);
      }
    } else {
      var nIdx3, nIdx4;
      nIdx1 = 0;
      nIdx2 = nIdx3 = division / 2;
      nIdx4 = division;
      fE = 0.0;
      for (i = 0; i <= (division / 4);
         i++, fE += (2.0 * Math.PI / division)) {
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
              (fAxis * comet.e)) / (division / 2);
    var fF = 0.0;
    nIdx1 = nIdx2 = division / 2;
    for (var i = 0; i <= (division / 2); i++, fF += fdF) {
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
              2.0) / (division / 2);
    var fV = 0.0;
    nIdx1 = nIdx2 = division / 2;
    for (var i = 0; i <= (division / 2); i++, fV += fdV) {
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
  this.getAt = function(index) {
    return orbit[index];
  };

  init();

};

},{"./astro":1,"./atime":2,"./matrix":5,"./udmath":11,"./xyz":12}],4:[function(require,module,exports){
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

},{"./astro":1,"./atime":2,"./matrix":5,"./xyz":12}],5:[function(require,module,exports){
var Astro = require('./astro');
var ATime = require('./atime');

Matrix.rotateX = rotateX;
Matrix.rotateY = rotateY;
Matrix.rotateZ = rotateZ;
Matrix.precMatrix = precMatrix;
Matrix.vectorConstant = vectorConstant;

module.exports = Matrix;

/**
 * Matrix (3x3)
 */

function Matrix(
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

  /**
   * Multiplication of Matrix
   */
  this.multiplyWithMatrix = function(mtx) {
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
  };

  /**
   * Multiplication of Matrix by double
   */
  this.multiplyWithDouble = function(x) {
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
  };

  this.mul = function(factor){
    if(typeof factor === 'number'){
      return this.multiplyWithDouble(factor);
    }
    return this.multiplyWithMatrix(factor);
  };

  /**
   * Invert Matrix
   */
  this.invert = function() {
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
  };

}

/**
 * Get Vector Constant from Angle Elements
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
 * Create Precession Matrix
 */
var fGeneralPrec = 360.0/25920;
var fPrecLimit = 30.0;
function precMatrix(fOldEpoch, fNewEpoch) {
  var fJd = 0.0;
  var bSwapEpoch = false;
  var bOuterNewcomb = false;
  if (fNewEpoch == fOldEpoch) {
    return new Matrix(1.0, 0.0, 0.0,
                      0.0, 1.0, 0.0,
                      0.0, 0.0, 1.0);
  }
  var fT = (fOldEpoch - Astro.JD2000) / 36525.0;
  if (fT < -fPrecLimit || fPrecLimit < fT) {
    bSwapEpoch = true;
    var fTmp = fNewEpoch;
    fNewEpoch = fOldEpoch;
    fOldEpoch = fTmp;
    fT = (fOldEpoch - Astro.JD2000) / 36525.0;
  }

  var fT2 = fT * fT;
  var ftt, ft;
  ftt = ft = (fNewEpoch - fOldEpoch) / 36525.0;
  if (ftt < -fPrecLimit) {
    bOuterNewcomb = true;
    ft = -fPrecLimit;
    fJd = -fPrecLimit * 36525.0 + Astro.JD2000;
  }
  if (fPrecLimit < ftt) {
    bOuterNewcomb = true;
    ft = fPrecLimit;
    fJd =  fPrecLimit * 36525.0 + Astro.JD2000;
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
 * Create Rotation Matrix Around X-Axis
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
 *  Create Rotation Matrix Around Y-Axis
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
 * Create Rotation Matrix Around Z-Axis
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

},{"./astro":1,"./atime":2}],6:[function(require,module,exports){
var Xyz    = require('./xyz');
var Astro  = require('./astro');
var UdMath = require('./udmath');
var Planets = require('./planets');

/**
 * PlanetElm module
 */

module.exports = function(planetNo, atime) {

  var l;   /* M+peri+node */
  var node;  /* Ascending Node */
  var peri;  /* Argument of Perihelion */
  var axis;  /* Semimajor Axis */
  var e;   /* Eccentricity */
  var incl;  /* Inclination */

  var init = function() {
    switch (planetNo) {
      case Planets.Earth:
        getPlanetElmEarth(atime.julian);
        break;
      case Planets.Mercury:
      case Planets.Venus:
      case Planets.Mars:
      case Planets.Jupiter:
      case Planets.Saturn:
        getPlanetElm1(planetNo, atime.julian);
        break;
      case Planets.Uranus:
      case Planets.Neptune:
        getPlanetElm2(planetNo, atime.julian);
        break;
      default:
        throw "Arithmetic Exception";
    }
  };

  //
  // Mercury
  //
  var MercuryE = new PlanetElmP1(
     182.27175,  149474.07244,   2.01944E-3,  0.0,
      75.89717,      1.553469,   3.08639E-4,  0.0,
     47.144736,       1.18476,   2.23194E-4,  0.0,
      7.003014,    1.73833E-3,  -1.55555E-5,  0.0,
    0.20561494,     0.0203E-3,     -0.04E-6,  0.0,
     0.3870984
  );

  //
  // Venus
  //
  var VenusE = new PlanetElmP1(
     344.36936,  58519.2126,   9.8055E-4,  0.0,
     130.14057,     1.37230,  -1.6472E-3,  0.0,
       75.7881,     0.91403,    4.189E-4,  0.0,
        3.3936,   1.2522E-3,   -4.333E-6,  0.0,
    0.00681636,  -0.5384E-4,    0.126E-6,  0.0,
    0.72333015
  );

  //
  // Mars
  //
  var MarsE = new PlanetElmP1(
    294.26478,  19141.69625,   3.15028E-4,  0.0,
    334.21833,     1.840394,   3.35917E-4,  0.0,
     48.78670,     0.776944,  -6.02778E-4,  0.0,
      1.85030,  -6.49028E-4,     2.625E-5,  0.0,
    0.0933088,  0.095284E-3,    -0.122E-6,  0.0,
    1.5236781
  );

  //
  // Jupiter
  //
  var JupiterE = new PlanetElmP1(
    238.132386,  3036.301986,  3.34683E-4,  -1.64889E-6,
     12.720972,    1.6099617,  1.05627E-3,   -3.4333E-6,
     99.443414,      1.01053,  3.52222E-4,  -8.51111E-6,
      1.308736,  -5.69611E-3,  3.88889E-6,          0.0,
     0.0483348,  0.164180E-3,  -0.4676E-6,      -1.7E-9,
    5.202805
  );

  //
  // Saturn
  //
  var SaturnE = new PlanetElmP1(
    266.597875,   1223.50988,    3.24542E-4,  -5.83333E-7,
      91.09821,     1.958416,    8.26361E-4,   4.61111E-6,
    112.790414,     0.873195,  -1.521810E-4,  -5.30555E-6,
       2.49252,  -3.91889E-3,   -1.54889E-5,   4.44444E-8,
    0.05589231,  -0.34550E-3,     -0.728E-6,      0.74E-9,
    9.55474
  );

  //
  // Uranus
  //
  var UranusE = new PlanetElmP2(
    314.055005,  0.01176903644,    0.0003043,
    173.005159,      1.4863784,    0.0002145,
     74.005947,      0.5211258,    0.0013399,
    19.2184461,   -0.000000037,          0.0,
    0.04629590,   -0.000027337,  0.000000079,
     0.773196,       0.0007744,    0.0000375
  );

  //
  // Neptune
  //
  var NeptuneE = new PlanetElmP2(
    304.348665,  0.00602007691,     0.0003093,
     48.123691,      1.4262678,     0.0003792,
    131.784057,      1.1022035,     0.0002600,
    30.1103869,   -0.000000166,           0.0,
    0.00898809,    0.000006408,  -0.000000001,
      1.769952,     -0.0093082,    -0.0000071
  );

  //
  // Perturbation correction for Jupiter
  //
  var perturbJup1 = [
    -20, -27, -44, -36, -20,  10,  21,  27,  33,  25,  18,   8, -20,
    -14, -25, -57, -75, -70, -55, -25, -15,  -2,   8,   1,  -4, -15,
      5,  -5, -21, -55, -67, -72, -55, -28, -13,   0,   7,  10,   5,
     24,  21,   9, -11, -37, -57, -55, -37, -15,   3,  13,  18,  23,
     27,  29,  27,  15,   4, -25, -45, -38, -22,  -5,  10,  25,  30,
     15,  27,  39,  33,  25,  -5, -27, -34, -30, -19,  -6,  20,  21,
      7,  15,  25,  31,  24,   8, -11, -26, -32, -27, -19,  -6,  16,
     -3,   3,  15,  23,  22,  15,   0, -15, -26, -29, -25, -20,  -4,
    -15,  -5,   3,  17,  22,  20,  11,   5, -11, -26, -27, -25, -16,
    -17,  -4,  10,  20,  25,  31,  25,  24,  15,  -6, -15, -18, -13,
      0,   2,  13,  28,  39,  49,  48,  38,  33,  27,  13,  -1,  -2,
     -1,   0,   6,  23,  39,  49,  63,  53,  48,  41,  35,  17,   4,
    -26, -30, -30, -25,  -9,  17,  31,  34,  34,  25,  22,  13,   6
  ];

  var perturbJup2 = [
      4,  15,  30,  40,  40,  25,   6,   8, -27, -43, -43, -28,  -5,
    -24,  -9,   7,  10,  27,  30,  31,  17,  -4, -29, -43, -40, -27,
    -31, -24, -25,  -5,  14,  31,  43,  43,  19,  -6, -29, -43, -32,
    -39, -29, -21, -13,  -4,  19,  36,  52,  35,  15, -11, -30, -36,
    -31, -30, -24, -19, -13,   0,  20,  35,  46,  31,   9, -17, -30,
    -26, -28, -28, -20, -17, -15,   0,  24,  46,  45,  25,   0, -28,
    -10, -23, -27, -23, -21, -22, -14,   4,  29,  40,  37,  17,  -5,
     15,  -9, -20, -22, -23, -27, -21, -13,  12,  31,  40,  33,  15,
     29,  13, -10, -18, -22, -27, -30, -25, -11,  16,  36,  42,  31,
     45,  28,   8, -10, -20, -28, -33, -33, -26,   9,  22,  45,  44,
     41,  45,  19,   9,  -9, -21, -34, -34, -34, -19,  -4,  26,  42,
     22,  36,  42,  25,  14,   0, -18, -27, -34, -32, -21,  -7,  26,
      0,  11,  26,  39,  36,  25,   8,  -8, -26, -38, -38, -28,  -2,
  ];

  var perturbJup3 = [
     41,  33,  19,   4, -13, -28, -37, -42, -27,  -9,  16,  30,  44,
     27,  33,  33,  23,  15,   3, -22, -36, -43, -25, -10,  14,  27,
     13,  23,  32,  33,  27,  22,   8, -22, -37, -42, -27, -10,  12,
     -5,  10,  18,  23,  34,  32,  25,   5, -26, -45, -47, -26,  -5,
    -17,  -2,  10,  18,  26,  35,  37,  22,  -4, -27, -44, -42, -27,
    -33, -15,  -1,   7,  16,  22,  36,  35,  16,  -7, -28, -40, -36,
    -44, -27, -12,  -6,   4,  16,  32,  54,  31,  12, -10, -31, -43,
    -37, -37, -24, -12,  -2,   7,  17,  30,  42,  24,  11, -15, -33,
    -31, -36, -35, -24, -13,  -4,   7,  21,  35,  38,  20,   6, -15,
    -19, -32, -40, -31, -21, -18,  -5,  12,  25,  38,  42,  26,  -6,
     11, -14, -30, -44, -33, -27, -13,  -1,  15,  29,  42,  39,  18,
     31,  13,  -6, -22, -34, -29, -27, -27,   9,  15,  25,  40,  35,
     40,  31,  18,   6, -15, -28, -38, -40, -29, -13,  15,  25,  40,
  ];

  //
  // Perturbation correction for Saturn
  //
  var perturbSat1 = [
    57,  59,  57,  60,  56,  48,  42,  41,  41,  42,  46,  50,  55,
    61,  64,  70,  73,  74,  66,  61,  57,  55,  55,  55,  56,  56,
    58,  61,  65,  71,  76,  76,  72,  66,  63,  61,  60,  58,  56,
    55,  55,  58,  63,  68,  74,  73,  71,  67,  63,  61,  57,  55,
    52,  51,  51,  55,  61,  67,  70,  70,  67,  62,  58,  55,  53,
    49,  48,  47,  48,  52,  58,  63,  65,  63,  60,  56,  52,  50,
    48,  46,  44,  43,  45,  49,  54,  57,  58,  56,  53,  50,  48,
    46,  44,  41,  40,  39,  40,  45,  48,  50,  51,  50,  48,  46,
    44,  42,  39,  37,  36,  35,  36,  39,  43,  45,  46,  45,  44,
    42,  40,  36,  34,  32,  31,  31,  33,  37,  39,  41,  42,  44,
    42,  39,  37,  33,  30,  29,  29,  30,  32,  34,  37,  40,  44,
    45,  45,  43,  39,  35,  30,  29,  30,  33,  35,  38,  42,  45,
    55,  57,  61,  56,  49,  45,  42,  40,  42,  43,  46,  50,  54,
  ];

  var perturbSat2 = [
    33,  37,  44,  52,  60,  66,  67,  65,  57,  46,  37,  32,  31,
    34,  40,  50,  60,  67,  70,  67,  60,  50,  40,  33,  29,  31,
    36,  42,  50,  60,  68,  72,  68,  59,  47,  38,  34,  34,  37,
    45,  48,  52,  57,  62,  65,  63,  55,  45,  40,  39,  42,  44,
    54,  55,  54,  53,  54,  55,  54,  49,  45,  43,  44,  48,  54,
    57,  60,  55,  51,  46,  45,  44,  46,  47,  48,  51,  55,  57,
    57,  59,  56,  50,  43,  39,  39,  44,  49,  52,  55,  57,  57,
    53,  54,  52,  49,  44,  40,  41,  45,  51,  55,  57,  54,  54,
    46,  44,  45,  47,  47,  48,  48,  51,  55,  57,  55,  51,  47,
    37,  35,  37,  45,  52,  57,  60,  59,  58,  56,  52,  45,  39,
    31,  29,  33,  43,  55,  65,  69,  66,  60,  55,  48,  40,  34,
    32,  30,  35,  45,  56,  68,  72,  69,  60,  52,  43,  36,  32,
    33,  36,  43,  51,  59,  65,  68,  65,  57,  47,  38,  34,  31,
  ];

  var perturbSat3 = [
    51,  60,  66,  67,  62,  56,  46,  40,  34,  31,  37,  45,  53,
    59,  66,  70,  67,  60,  51,  40,  33,  30,  33,  40,  50,  60,
    60,  65,  67,  66,  59,  50,  38,  31,  30,  35,  43,  52,  59,
    58,  59,  60,  59,  55,  49,  40,  36,  36,  43,  50,  55,  57,
    55,  52,  50,  50,  49,  47,  45,  45,  45,  50,  55,  56,  55,
    53,  48,  44,  42,  43,  46,  50,  53,  55,  56,  57,  55,  53,
    51,  47,  41,  38,  40,  47,  55,  59,  61,  59,  56,  53,  51,
    48,  42,  44,  42,  44,  48,  55,  58,  58,  55,  51,  50,  48,
    45,  49,  50,  50,  50,  51,  53,  55,  54,  50,  45,  43,  45,
    46,  52,  59,  62,  61,  56,  53,  50,  46,  42,  39,  38,  41,
    45,  54,  65,  71,  71,  63,  53,  43,  39,  35,  34,  35,  42,
    48,  55,  65,  71,  70,  63,  51,  40,  34,  31,  33,  38,  44,
    51,  60,  66,  68,  65,  58,  46,  38,  33,  32,  37,  46,  54,
  ];

  var perturbSat4 = [
    83,  82,  80,  78,  75,  74,  73,  73,  75,  77,  79,  81,  83,
    81,  82,  82,  81,  80,  77,  75,  72,  72,  75,  77,  80,  81,
    77,  70,  77,  75,  75,  75,  70,  67,  65,  64,  65,  68,  70,
    50,  51,  54,  58,  60,  61,  59,  56,  52,  49,  47,  47,  49,
    30,  32,  34,  37,  40,  42,  42,  40,  36,  31,  30,  29,  30,
    17,  18,  19,  20,  22,  24,  27,  26,  21,  19,  17,  15,  17,
    13,  13,  12,  12,  14,  15,  17,  18,  17,  16,  15,  14,  13,
    20,  19,  18,  17,  17,  18,  20,  21,  24,  24,  23,  21,  20,
    31,  31,  32,  32,  31,  31,  32,  35,  37,  38,  36,  34,  32,
    50,  50,  53,  53,  52,  51,  51,  52,  53,  53,  52,  50,  50,
    68,  69,  71,  72,  72,  70,  69,  68,  68,  68,  70,  70,  67,
    80,  80,  79,  80,  80,  79,  77,  76,  74,  76,  77,  80,  80,
    83,  83,  80,  78,  75,  75,  76,  76,  76,  76,  79,  81,  83,
  ];

  /**
   * Correction for Perturbation
   */
  var perturbationElement = function(eta, zeta, tbl) {
    var e1 = eta/30.0;
    var e2 = e1 + 1;
    var z1 = zeta/30.0;
    var z2 = z1 + 1;
    var v1, v2, v3, v4, p1, p2, p3, p4;

    if(e1 >= 12 && z1 >= 12){
      return tbl[z1*13 + e1];
    }

    if(e1 >= 12){
      v1 = tbl[z1*13 + e1];
      v3 = tbl[z2*13 + e1];
      p3 = v1 + (v3 - v1)*(zeta/30.0 - z1);
      return p3;
    }

    if(z1 >= 12){
      v1 = tbl[z1*13 + e1];
      v2 = tbl[z1*13 + e2];
      p3 = v1 + (v2 - v1)*(eta/30.0 - e1);
      return p3;
    }

    v1 = tbl[z1*13 + e1];
    v2 = tbl[z1*13 + e2];
    v3 = tbl[z2*13 + e1];
    v4 = tbl[z2*13 + e2];
    p1 = v1 + (v3 - v1)*(zeta/30.0 - z1);
    p2 = v2 + (v4 - v2)*(zeta/30.0 - z1);
    p3 = p1 + (p2 - p1)*(eta/30.0 - e1);

    return p3;
  };

  /**
   * Mean orbital element of Jupiter with perturbation
   */
  var perturbationJupiter = function(jd) {
    var year = (jd - 1721423.5) / 365.244 + 1.0;
    var T = year/1000.0;

    var L7 = (0.42 - 0.075*T + 0.015*T*T - 0.003*T*T*T) *
        UdMath.udsin( (T - 0.62)*360.0/0.925 );
    var PS7 = 0.02 * UdMath.udsin( (T + 0.1)*360.0/0.925 );
    var PH7 = 0.03 * UdMath.udsin( (T + 0.36)*360.0/0.925 );
    var ETA = UdMath.degmal(86.1 + 0.033459 * ( jd - 1721057.0 ));
    var ZETA = UdMath.degmal(89.1 + 0.049630 * ( jd - 1721057.0 ));
    var L8 = perturbationElement(ETA, ZETA, perturbJup1)/1000.0;
    var PS8 = perturbationElement(ETA, ZETA, perturbJup2)/1000.0;
    var PH8 = perturbationElement(ETA, ZETA, perturbJup3)/1000.0;
    var PH  = 2.58 + 0.1*T;

    if (PH > 3.5) PH = 3.5;
    if (PH < 1.5) PH = 1.5;

    l += ( L7 + L8 );
    peri += (PS7 + PS8) / UdMath.udsin(PH);
    e = UdMath.udsin(PH + PH7 + PH8);
  };

  /**
   * Mean orbital element of Saturn with perturbation
   */
  var perturbationSaturn = function(jd) {
    var year = (jd - 1721423.5) / 365.244 + 1.0;
    var T = year/1000.0;

    var AT = 0.88 - 0.0633*T + 0.03*T*T - 0.0006*T*T*T;
    var L7 = -0.50 + AT*UdMath.udsin((T - 0.145)*360.0/0.95);
    var PS7 = -0.50 + (0.10 - 0.005*T) * UdMath.udsin((T - 0.54)*360.0/0.95);
    var PH7 = -0.50 + (0.10 - 0.005*T) * UdMath.udsin((T - 0.32)*360.0/0.95);
    var AX7 = -0.050 + (0.004 - 0.0005*T) * UdMath.udsin((T - 0.35)*360.0/0.95);
    var ETA = UdMath.degmal(86.1 + 0.033459 * ( jd - 1721057.0 ));
    var ZETA = UdMath.degmal(89.1 + 0.049630 * ( jd - 1721057.0 ));
    var L8 = perturbationElement(ETA, ZETA, perturbSat1)/100.0;
    var PS8 = perturbationElement(ETA, ZETA, perturbSat2)/100.0;
    var PH8 = perturbationElement(ETA, ZETA, perturbSat3)/100.0;
    var AX8 = perturbationElement(ETA, ZETA, perturbSat4)/1000.0;
    var PH  = 3.56 - 0.175*T - 0.005*T*T;

    /* if year > 7000 then PH < 2.0 */
    if (PH < 2.0) PH = 2.0;

    l += ( L7 + L8 );
    peri += (PS7 + PS8) / UdMath.udsin(PH);
    e = UdMath.udsin(PH + PH7 + PH8);
    axis += AX7 + AX8;
  };

  /**
   * Get mean orbital elements (Mercury, Venus, Mars, Jupiter, Saturn)
   */
  var getPlanetElm1 = function(planetNo, jd) {
    var C1 = (jd - Astro.JD1900) / 36525.0;
    var C2 = C1 * C1;
    var elmCf;
    switch (planetNo) {
      case Planets.Mercury:
        elmCf = MercuryE;
        break;
      case Planets.Venus:
        elmCf = VenusE;
        break;
      case Planets.Mars:
        elmCf = MarsE;
        break;
      case Planets.Jupiter:
        elmCf = JupiterE;
        break;
      case Planets.Saturn:
        elmCf = SaturnE;
        break;
      default:
        throw 'Arithmetic Exception';
    }
    /* M+peri+node */
    l = UdMath.degmal(elmCf.l + elmCf.L1 * C1 +
               elmCf.L2 * C2 + elmCf.L3 * C1 * C2);
    /* Ascending Node */
    node = UdMath.degmal(elmCf.node + elmCf.n1 * C1 +
               elmCf.n2 * C2 + elmCf.n3 * C1 * C2);
    /* Argument of Perihelion */
    peri = UdMath.degmal(elmCf.peri + elmCf.p1 * C1 +
               elmCf.p2 * C2 + elmCf.p3 * C1 * C2 - node);
    /* Semimajor Axis */
    axis = elmCf.axis;
    /* Eccentricity */
    e    = UdMath.degmal(elmCf.e + elmCf.e1 * C1 +
               elmCf.e2 * C2 + elmCf.e3 * C1 * C2 );
    /* Inclination */
    incl = UdMath.degmal(elmCf.incl + elmCf.i1 * C1 +
               elmCf.i2 * C2 + elmCf.i3 * C1 * C2);

    switch (planetNo) {
      case Planets.Jupiter:
        perturbationJupiter(jd);
        break;
      case Planets.Saturn:
        perturbationSaturn(jd);
        break;
    }
  };

  /**
   * Get mean orbital elements (Uranus, Neptune, Pluto)
   */
  var getPlanetElm2 = function(planetNo, jd) {
    var T1 = ( jd - Astro.JD2000 ) / 36525.0;
    var T2 = T1 * T1;
    var d  = T1 * 36525.0;
    var elmCf = null;
    switch (planetNo) {
      case Planets.Uranus:
        elmCf = UranusE;
        break;
      case Planets.Neptune:
        elmCf = NeptuneE;
        break;
      default:
        throw "Arithmetic Exception";
    }
    /* M+peri+node */
    l    =  UdMath.degmal(elmCf.l + elmCf.L1 * d + elmCf.L2 *T2);
    /* Ascending Node */
    node =  UdMath.degmal(elmCf.node + elmCf.n1 * T1 + elmCf.n2 *T2);
    /* Argument of Perihelion */
    peri =  UdMath.degmal(elmCf.peri + elmCf.p1 * T1 + elmCf.p2 *T2 - node);
    /* Semimajor Axis */
    axis = UdMath.degmal(elmCf.axis + elmCf.a1 * T1 + elmCf.a2 *T2);
    /* Eccentricity */
    e    =  UdMath.degmal(elmCf.e + elmCf.e1 * T1 + elmCf.e2 *T2);
    /* Inclination */
    incl =  UdMath.degmal(elmCf.incl + elmCf.i1 * T1 + elmCf.i2 *T2);
  };

  /**
   * Get mean orbital elements (Earth)
   */
  var getPlanetElmEarth = function(jd) {
    var c = (jd - Astro.JD1900)/36525.0;
    var c2 = c * c;
    l = 180.0 + UdMath.degmal(280.6824 + 36000.769325*c + 7.22222e-4*c2);
    peri = 180.0 + UdMath.degmal(281.2206 +
      1.717697*c + 4.83333e-4*c2 + 2.77777e-6*c*c2);
    node = 0.0; /* no ascending node for the Earth */
    incl = 0.0; /* no inclination for the Earth */
    e = 0.0167498 - 4.258e-5*c - 1.37e-7*c2;
    axis = 1.00000129;
  };

  this.getPosition = function() {
    var re = this.e * 180.0 / Math.PI;
    var E, M, oldE;
    E = M = this.l - (this.peri + this.node);
    do {
      oldE = E;
      E = M + re * UdMath.udsin(oldE);
    } while (Math.abs(E - oldE) > 1.0e-5 * 180.0 / Math.PI);
    var px = this.axis * (UdMath.udcos(E) - this.e);
    var py = this.axis * Math.sqrt(1.0 - this.e * this.e) *
        UdMath.udsin(E);

    var sinperi = UdMath.udsin(this.peri);
    var cosperi = UdMath.udcos(this.peri);
    var sinnode = UdMath.udsin(this.node);
    var cosnode = UdMath.udcos(this.node);
    var sinincl = UdMath.udsin(this.incl);
    var cosincl = UdMath.udcos(this.incl);

    var xc =  px * (cosnode * cosperi - sinnode * cosincl * sinperi) -
        py * (cosnode * sinperi + sinnode * cosincl * cosperi);
    var yc =  px * (sinnode * cosperi + cosnode * cosincl * sinperi) -
        py * (sinnode * sinperi - cosnode * cosincl * cosperi);
    var zc =  px * (sinincl * sinperi) + py * (sinincl * cosperi);

    return new Xyz(xc, yc, zc);
  };

  init();

};

function PlanetElmP1(
      l,    L1, L2, L3,
      peri, p1, p2, p3,
      node, n1, n2, n3,
      incl, i1, i2, i3,
      e,    e1, e2, e3,
      axis) {
  this.l    = l;    this.L1 = L1; this.L2 = L2; this.L3 = L3;
  this.peri = peri; this.p1 = p1; this.p2 = p2; this.p3 = p3;
  this.node = node; this.n1 = n1; this.n2 = n2; this.n3 = n3;
  this.incl = incl; this.i1 = i1; this.i2 = i2; this.i3 = i3;
  this.e    = e;    this.e1 = e1; this.e2 = e2; this.e3 = e3;
  this.axis = axis;
}

function PlanetElmP2(
          l,    L1, L2,
          peri, p1, p2,
          node, n1, n2,
          axis, a1, a2,
          e,    e1, e2,
          incl, i1, i2) {
  this.l = l;       this.L1 = L1; this.L2 = L2;
  this.peri = peri; this.p1 = p1; this.p2 = p2;
  this.node = node; this.n1 = n1; this.n2 = n2;
  this.axis = axis; this.a1 = a1; this.a2 = a2;
  this.e = e;       this.e1 = e1; this.e2 = e2;
  this.incl = incl; this.i1 = i1; this.i2 = i2;
}

},{"./astro":1,"./planets":10,"./udmath":11,"./xyz":12}],7:[function(require,module,exports){
var Xyz    = require('./xyz');
var UdMath = require('./udmath');
var Planets = require('./planet');

/**
 * Planet Position by Expansion
 */

module.exports = function(){

  //
  // Mercury
  //
  var MercuryLambda = [
    new PlanetExpP0(0.5258, 448417.55,  74.38),
    new PlanetExpP0(0.1796, 298945.77, 137.84),
    new PlanetExpP0(0.1061, 597890.10,  249.2),
    new PlanetExpP0(0.0850,  149473.3,  143.0),
    new PlanetExpP0(0.0760,  448418.3,  312.6),
    new PlanetExpP0(0.0256,  597890.8,  127.4),
    new PlanetExpP0(0.0230,  747362.6,   64.0),
    new PlanetExpP0(0.0081,  747363.0,  302.0),
    new PlanetExpP0(0.0069,       1.0,  148.0),
    new PlanetExpP0(0.0052,  896835.0,  239.0),
    new PlanetExpP0(0.0023,  896836.0,  117.0),
    new PlanetExpP0(0.0019,    6356.0,   85.0),
    new PlanetExpP0(0.0011, 1046308.0,   54.0)
  ];

  var MercuryBeta = [
    new PlanetExpP0(0.3123,  448417.92, 103.51),
    new PlanetExpP0(0.0753,   597890.4,  278.3),
    new PlanetExpP0(0.0367,   149472.1,   55.7),
    new PlanetExpP0(0.0187,   747362.9,   93.1),
    new PlanetExpP0(0.0050,   298945.0,  230.0),
    new PlanetExpP0(0.0047,   896835.0,  268.0),
    new PlanetExpP0(0.0028,   448419.0,  342.0),
    new PlanetExpP0(0.0023,   298946.0,  347.0),
    new PlanetExpP0(0.0020,   597891.0,  157.0),
    new PlanetExpP0(0.0012,  1046308.0,   83.0),
    new PlanetExpP0(0.0009,   747364.0,  331.0),
    new PlanetExpP0(0.0009,   448717.0,   45.0)
  ];

  var MercuryR = [
    new PlanetExpP0(0.001214, 448417.55, 344.38),
    new PlanetExpP0(0.000218,  597890.1, 159.20),
    new PlanetExpP0(0.000042,  747363.0,  334.0),
    new PlanetExpP0(0.000006,  896835.0,  149.0)
  ];

  //
  // Venus
  //
  var VenusL0 = [
    new PlanetExpP0(-0.0048, 248.6, -19.34),
    new PlanetExpP0(-0.0004, 198.0,  720.0)
  ];

  var VenusL1 = [
    new PlanetExpP0(0.0033, 357.9, 1170.35),
    new PlanetExpP0(0.0031, 242.3,  450.37),
    new PlanetExpP0(0.0020, 273.5,  675.55),
    new PlanetExpP0(0.0014,  31.1,  225.18)
  ];

  var VenusQ = [
    new PlanetExpP0(-0.000015, 357.9, 1170.35),
    new PlanetExpP0( 0.000010,  62.3,  450.37),
    new PlanetExpP0(-0.000008,  93.0,   675.6)
  ];

  var VenusP = new PlanetExpP1(
     310.1735,  585.19212,
      -0.0503,     107.44, 1170.37,
       0.7775,   -0.00005, 178.954, 585.178,
      0.05922,     233.72, 585.183,
    -0.002947, 0.00000021, 178.954, 585.178, -0.140658
  );

  //
  // Mars
  //
  var MarsL0 = [
    new PlanetExpP0(-0.0048, 248.6, -19.34),
    new PlanetExpP0(-0.0004, 198.0,  720.0)
  ];

  var MarsL1 = [
    new PlanetExpP0(0.6225, 187.54, 382.797),
    new PlanetExpP0(0.0503, 101.31, 574.196),
    new PlanetExpP0(0.0146,  62.31,   0.198),
    new PlanetExpP0(0.0071,   71.8,  161.05),
    new PlanetExpP0(0.0061,  230.2,  130.71),
    new PlanetExpP0(0.0046,   15.1,  765.59),
    new PlanetExpP0(0.0045,  147.5,  322.11),
    new PlanetExpP0(0.0039,  279.3,  -22.81),
    new PlanetExpP0(0.0024,  207.7,  168.59),
    new PlanetExpP0(0.0020,  140.1,  145.78),
    new PlanetExpP0(0.0018,  224.7,   10.98),
    new PlanetExpP0(0.0014,  221.8,  -45.62),
    new PlanetExpP0(0.0010,   91.4,  -30.34),
    new PlanetExpP0(0.0009,    268,   100.4)
  ];

  var MarsQ = [
    new PlanetExpP0(-0.002825, 187.54, 382.797),
    new PlanetExpP0(-0.000249, 101.31, 574.196),
    new PlanetExpP0(-0.000024,   15.1,  765.59),
    new PlanetExpP0( 0.000023,  251.7,  161.05),
    new PlanetExpP0( 0.000022,  327.6,  322.11),
    new PlanetExpP0( 0.000017,   50.2,  130.71),
    new PlanetExpP0( 0.000007,   27.0,   168.6),
    new PlanetExpP0( 0.000006,  320.0,   145.8)
  ];

  var MarsP = new PlanetExpP1(
     249.3542,   191.41696,
      -0.0149,       40.01, 382.819,
      10.6886,     0.00010, 273.768, 191.399,
      0.03227,      200.00, 191.409,
    -0.040421, -0.00000039, 273.768, 191.399, 0.183844
  );

  //
  // Jupiter
  //
  var JupiterN = [
    new PlanetExpP0( 0.3323, 162.78,   0.385),
    new PlanetExpP0( 0.0541,  38.46, -36.256),
    new PlanetExpP0( 0.0447, 293.42, -29.941),
    new PlanetExpP0( 0.0342,  44.50,  -5.907),
    new PlanetExpP0( 0.0230, 201.25, -24.035),
    new PlanetExpP0( 0.0222, 109.99, -18.128),
    new PlanetExpP0(-0.0048,  248.6,  -19.34),
    new PlanetExpP0( 0.0047,  184.6,  -11.81),
    new PlanetExpP0( 0.0045,  150.1,  -54.38),
    new PlanetExpP0( 0.0042,  130.7,  -42.16),
    new PlanetExpP0( 0.0039,    7.6,    6.31),
    new PlanetExpP0( 0.0031,  163.2,   12.22),
    new PlanetExpP0( 0.0031,  145.6,    0.77),
    new PlanetExpP0( 0.0024,  191.3,   -0.23),
    new PlanetExpP0( 0.0019,  148.4,   24.44),
    new PlanetExpP0( 0.0017,  197.9, -29.941),
    new PlanetExpP0( 0.0010,  307.9,   36.66),
    new PlanetExpP0( 0.0010,  252.6,  -72.51),
    new PlanetExpP0( 0.0010,  269.0,  -60.29),
    new PlanetExpP0( 0.0010,  278.7,  -29.53),
    new PlanetExpP0( 0.0008,   52.0,   -66.6),
    new PlanetExpP0( 0.0008,   24.0,   -35.8),
    new PlanetExpP0( 0.0005,  356.0,    -5.5)
  ];

  var JupiterB = [
    new PlanetExpP0(0.0010, 291.9, -29.94),
    new PlanetExpP0(0.0003, 196.0,  -24.0)
  ];

  var JupiterQ = [
    new PlanetExpP0(0.000230,  38.47, -36.256),
    new PlanetExpP0(0.000168, 293.36, -29.941),
    new PlanetExpP0(0.000074, 200.50,  -24.03),
    new PlanetExpP0(0.000055,  110.0,  -18.13),
    new PlanetExpP0(0.000038,   39.3,   -5.91),
    new PlanetExpP0(0.000024,  150.9,  -54.38),
    new PlanetExpP0(0.000023,  336.4,    0.41),
    new PlanetExpP0(0.000019,  131.7,  -42.16),
    new PlanetExpP0(0.000009,  180.0,   -11.8),
    new PlanetExpP0(0.000007,  277.0,   -60.3),
    new PlanetExpP0(0.000006,  330.0,    24.4),
    new PlanetExpP0(0.000006,   53.0,   -66.6),
    new PlanetExpP0(0.000006,  188.0,     6.3),
    new PlanetExpP0(0.000006,  251.0,   -72.5),
    new PlanetExpP0(0.000006,  198.0,   -29.9),
    new PlanetExpP0(0.000005,  353.5,   12.22)
  ];

  var JupiterP = new PlanetExpP2(
     13.6526, 0.01396,
      0.0075,    5.94,
      5.5280,  0.1666, 0.0070, 0.0003,
    0.022889, 272.975, 0.0128, 0.00010, 35.52,
    5.190688, 0.048254
  );

  //
  // Saturn
  //
  var SaturnN = [
    new PlanetExpP0( 0.8081, 342.74,   0.385),
    new PlanetExpP0( 0.1900,   3.57, -11.813),
    new PlanetExpP0( 0.1173, 224.52,  -5.907),
    new PlanetExpP0( 0.0093,  176.6,    6.31),
    new PlanetExpP0( 0.0089,  218.5,  -36.26),
    new PlanetExpP0( 0.0080,   10.4,   -0.23),
    new PlanetExpP0( 0.0078,   56.8,    0.63),
    new PlanetExpP0( 0.0074,  325.4,    0.77),
    new PlanetExpP0( 0.0073,  209.4,  -24.03),
    new PlanetExpP0( 0.0064,  202.0,  -11.59),
    new PlanetExpP0(-0.0048,  248.6,  -19.34),
    new PlanetExpP0( 0.0034,  105.2,  -30.35),
    new PlanetExpP0( 0.0034,   23.6,  -15.87),
    new PlanetExpP0( 0.0025,  348.4,  -11.41),
    new PlanetExpP0( 0.0022,  102.5,   -7.94),
    new PlanetExpP0( 0.0021,   53.5,   -3.65),
    new PlanetExpP0( 0.0020,  220.4,  -18.13),
    new PlanetExpP0( 0.0018,  326.7,  -54.38),
    new PlanetExpP0( 0.0017,  173.0,   -5.50),
    new PlanetExpP0( 0.0014,  165.5,   -5.91),
    new PlanetExpP0( 0.0013,  307.9,  -42.16)
  ];

  var SaturnB = [
    new PlanetExpP0(0.0024,   3.9, -11.81),
    new PlanetExpP0(0.0008, 269.0,   -5.9),
    new PlanetExpP0(0.0005, 135.0,  -30.3)
  ];

  var SaturnQ = [
    new PlanetExpP0(0.000701,   3.43, -11.813),
    new PlanetExpP0(0.000378, 110.54, -18.128),
    new PlanetExpP0(0.000244, 219.13,  -5.907),
    new PlanetExpP0(0.000114, 158.22,   0.383),
    new PlanetExpP0(0.000064,  218.1,  -36.26),
    new PlanetExpP0(0.000042,  215.8,  -24.03),
    new PlanetExpP0(0.000024,  201.8,  -11.59),
    new PlanetExpP0(0.000024,    1.3,    6.31),
    new PlanetExpP0(0.000019,  307.7,   12.22),
    new PlanetExpP0(0.000015,  326.3,  -54.38),
    new PlanetExpP0(0.000010,  311.1,  -42.16),
    new PlanetExpP0(0.000010,   83.2,   24.44),
    new PlanetExpP0(0.000009,  348.0,   -11.4),
    new PlanetExpP0(0.000008,  129.0,   -30.3),
    new PlanetExpP0(0.000006,  295.0,   -29.9),
    new PlanetExpP0(0.000006,  148.0,   -48.5),
    new PlanetExpP0(0.000006,  103.0,    -7.9),
    new PlanetExpP0(0.000005,  318.0,    24.4),
    new PlanetExpP0(0.000005,   24.0,   -15.9)
  ];

  var SaturnP = new PlanetExpP2(
     91.8560,  0.01396,
      0.0272,   135.53,
      6.4215,   0.2248, 0.0109, 0.0006,
    0.043519,  337.763, 0.0286, 0.00023, 77.06,
    9.508863, 0.056061
  );

  //
  // Uranus
  //
  var UranusLambda = [
    new PlanetExpP0(5.35857, 460.61987, 48.85031),
    new PlanetExpP0(0.58964,  919.0429, 188.3245),
    new PlanetExpP0(0.12397, 1065.1192, 354.5935),
    new PlanetExpP0(0.01475,  2608.702,  351.028),
    new PlanetExpP0(0.00090,    1968.3,    247.7),
    new PlanetExpP0(0.00036,    5647.4,     10.4),
    new PlanetExpP0(0.00017,    2356.6,    183.6),
    new PlanetExpP0(0.00017,    2873.2,    321.9),
    new PlanetExpP0(0.00014,    3157.9,    308.1)
  ];

  var UranusBeta = [
    new PlanetExpP0(1.15483, 419.91739, 128.15303),
    new PlanetExpP0(0.67756,  652.9504,  273.6644),
    new PlanetExpP0(0.13490,  998.0302,   83.3517),
    new PlanetExpP0(0.00025,    3030.9,     194.2)
  ];

  var UranusR = [
    new PlanetExpP0(0.905790, 408.729, 320.313),
    new PlanetExpP0(0.062710,  799.95,   67.99),
    new PlanetExpP0(0.004897,  2613.7,    80.4),
    new PlanetExpP0(0.000656,  1527.0,   202.0),
    new PlanetExpP0(0.000223,  2120.0,   321.0),
    new PlanetExpP0(0.000205,  3104.0,    37.0),
    new PlanetExpP0(0.000120,  5652.0,   100.0)
  ];

  //
  // Neptune
  //
  var NeptuneLambda = [
    new PlanetExpP0(0.97450, 221.3904, 167.7269),
    new PlanetExpP0(0.01344,  986.281,   50.826),
    new PlanetExpP0(0.00945,  2815.89,     0.09),
    new PlanetExpP0(0.00235,  2266.50,   309.35),
    new PlanetExpP0(0.00225,  2279.43,   127.61),
    new PlanetExpP0(0.00023,   5851.6,     19.2)
  ];

  var NeptuneBeta = [
    new PlanetExpP0(1.76958, 218.87906, 83.11018),
    new PlanetExpP0(0.01366,   447.128,  338.864),
    new PlanetExpP0(0.00015,    1107.1,    224.7),
    new PlanetExpP0(0.00015,    2596.7,    187.5),
    new PlanetExpP0(0.00012,    3035.0,    243.9)
  ];

  var NeptuneR = [
    new PlanetExpP0(0.260457, 222.371, 79.994),
    new PlanetExpP0(0.004944,  2815.4,   90.1),
    new PlanetExpP0(0.003364,   524.0,  308.1),
    new PlanetExpP0(0.002579,  1025.1,  104.0),
    new PlanetExpP0(0.000120,  5845.0,  111.0)
  ];

  //
  // Sun
  //
  var SunLambda = [
    new PlanetExpP0( 0.0200,  353.06,  719.981),
    new PlanetExpP0(-0.0048,  248.64,  -19.341),
    new PlanetExpP0( 0.0020,   285.0,   329.64),
    new PlanetExpP0( 0.0018,   334.2, -4452.67),
    new PlanetExpP0( 0.0018,   293.7,    -0.20),
    new PlanetExpP0( 0.0015,   242.4,   450.37),
    new PlanetExpP0( 0.0013,   211.1,   225.18),
    new PlanetExpP0( 0.0008,   208.0,   659.29),
    new PlanetExpP0( 0.0007,    53.5,    90.38),
    new PlanetExpP0( 0.0007,    12.1,   -30.35),
    new PlanetExpP0( 0.0006,   239.1,   337.18),
    new PlanetExpP0( 0.0005,    10.1,    -1.50),
    new PlanetExpP0( 0.0005,    99.1,   -22.81),
    new PlanetExpP0( 0.0004,   264.8,   315.56),
    new PlanetExpP0( 0.0004,   233.8,   299.30),
    new PlanetExpP0(-0.0004,   198.1,   720.02),
    new PlanetExpP0( 0.0003,   349.6,  1079.97),
    new PlanetExpP0( 0.0003,   241.2,   -44.43)
  ];

  var SunQ = [
    new PlanetExpP0(-0.000091,  353.1,   719.98),
    new PlanetExpP0( 0.000013,  205.8,  4452.67),
    new PlanetExpP0( 0.000007,   62.0,    450.4),
    new PlanetExpP0( 0.000007,  105.0,    329.6)
  ];

  /**
   * Get Position of the Earth
   */
  var getPosExp0 = function(fT) {
    var i, fLambda = 279.0358 + 360.00769 *
        fT + ( 1.9159 - 0.00005 * fT) *
        UdMath.udsin((356.531)+ ( 359.991) * fT);

    for (i = 0; i < SunLambda.length; i++) {
      fLambda += SunLambda[i].a * UdMath.udsin(SunLambda[i].b + SunLambda[i].c * fT);
    }

    fLambda += 0.0057;
    fLambda = UdMath.deg2rad(UdMath.degmal(fLambda));
    var fBeta = 0.0;

    var fq = (- 0.007261+0.0000002 * fT) *
        UdMath.udcos((356.53) +
        (359.991) * fT) + 0.000030;

    for (i = 0; i < SunQ.length; i++) {
      fq += SunQ[i].a * UdMath.udcos(SunQ[i].b + SunQ[i].b * fT);
    }

    var fRadius = Math.pow(10.0, fq);

    return new Xyz(-fRadius * Math.cos(fBeta) * Math.cos(fLambda),
             -fRadius * Math.cos(fBeta) * Math.sin(fLambda),
             -fRadius * Math.sin(fBeta));
  };

  /**
   * Get Position of Venus and Mars
   */
  var getPosExp1 = function(planetNo, fT) {
    var ParamL0, ParamL1, ParamQ;
    var i, ParamP;

    switch (planetNo) {
      case Planets.Venus:
        ParamL0 = VenusL0;
        ParamL1 = VenusL1;
        ParamQ  = VenusQ;
        ParamP  = VenusP;
        break;
      case Planets.Mars:
        ParamL0 = MarsL0;
        ParamL1 = MarsL1;
        ParamQ  = MarsQ;
        ParamP  = MarsP;
        break;
      default:
        throw 'Arithmetic Exception';
    }

    var L1 = (ParamP.L6 + ParamP.L7 * fT) * UdMath.udsin(ParamP.L8 + ParamP.L9 * fT);
    for (i = 0; i < ParamL1.length; i++) {
      L1 += ParamL1[i].a * UdMath.udsin(ParamL1[i].b + ParamL1[i].c * fT);
    }

    var L0 = ParamP.L1 + ParamP.L2 * fT +
        ParamP.L3 * UdMath.udsin(ParamP.L4 + ParamP.L5 * fT + 2.0 * L1);
    for (i = 0; i < ParamL0.length; i++) {
      L0 += ParamL0[i].a * UdMath.udsin(ParamL0[i].b + ParamL0[i].c * fT);
    }

    var fLambda = UdMath.deg2rad(UdMath.degmal(L0 + L1));
    var fBeta = Math.asin(ParamP.B1 * UdMath.udsin(ParamP.B2 + ParamP.B3 * fT + L1));
    var fq = (ParamP.q1 + ParamP.q2 * fT) *
        UdMath.udcos(ParamP.q3 + ParamP.q4 * fT) + ParamP.q5;
    for (i = 0; i < ParamQ.length; i++) {
      fq += ParamQ[i].a * UdMath.udcos(ParamQ[i].b + ParamQ[i].c * fT);
    }

    var fRadius = Math.pow(10.0, fq);

    return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
             fRadius * Math.cos(fBeta) * Math.sin(fLambda),
             fRadius * Math.sin(fBeta));
  };

  /**
   * Get Position of Jupiter and Saturn
   */
  var getPosExp2 = function(planetNo, fT) {
    var ParamN, ParamB, ParamQ;
    var i, ParamP;
    var fq, fN;

    switch (planetNo) {
      case Planets.Jupiter:
        ParamN = JupiterN;
        ParamB = JupiterB;
        ParamQ = JupiterQ;
        ParamP = JupiterP;
        fN  = 341.5208 + 30.34907 * fT;
        fN += (0.0350 + 0.00028 * fT) * UdMath.udsin(245.94 - 30.349 * fT)+ 0.0004;
        fN -= (0.0019 + 0.00002 * fT) * UdMath.udsin(162.78 +  0.38 * fT);
        fq  = (0.000132 + 0.0000011 * fT) * UdMath.udcos(245.93 - 30.349 * fT);
        break;
      case Planets.Saturn:
        ParamN = SaturnN;
        ParamB = SaturnB;
        ParamQ = SaturnQ;
        ParamP = SaturnP;
        fN  = 12.3042 +12.22117 * fT;
        fN += (0.0934 + 0.00075 * fT) * UdMath.udsin(250.29 + 12.221 * fT)+ 0.0008;
        fN += (0.0057 + 0.00005 * fT) * UdMath.udsin(265.8  - 11.81 * fT);
        fN += (0.0049 + 0.00004 * fT) * UdMath.udsin(162.7  +  0.38 * fT);
        fN += (0.0019 + 0.00002 * fT) * UdMath.udsin(262.0  + 24.44 * fT);
        fq  = (0.000354 + 0.0000028 * fT) * UdMath.udcos( 70.28 + 12.22 * fT) + 0.000183;
        fq += (0.000021 + 0.0000002 * fT) * UdMath.udcos(265.80 - 11.81  * fT);
        break;
      default:
        throw "Arithmetic Exception";
    }

    // Lambda
    for (i = 0; i < ParamN.length; i++) {
      fN += ParamN[i].a * UdMath.udsin(ParamN[i].b + ParamN[i].c * fT);
    }

    var ff = fN + ParamP.f1 * UdMath.udsin(fN) +
          ParamP.f2 * UdMath.udsin(2.0 * fN) +
          ParamP.f3 * UdMath.udsin(3.0 * fN) +
          ParamP.f4 * UdMath.udsin(4.0 * fN);
    var fV = ParamP.V1 * UdMath.udsin(2.0 * ff + ParamP.V2);

    var fLambda = UdMath.deg2rad(UdMath.degmal(ff + fV +
                      ParamP.L1 + ParamP.L2 * fT));

    // Beta
    var fBeta = Math.asin(ParamP.B1 * UdMath.udsin(ff + ParamP.B2)) +
                UdMath.deg2rad((ParamP.B3 + ParamP.B4 * fT) +
                UdMath.udsin(ff + ParamP.B5));
    for (i = 0; i < ParamB.length; i++) {
      fBeta += ParamB[i].a * UdMath.udsin(ParamB[i].b + ParamB[i].c * fT);
    }

    // Radius
    for (i = 0; i < ParamQ.length; i++) {
      fq += ParamQ[i].a * UdMath.udcos(ParamQ[i].b + ParamQ[i].c * fT);
    }

    var fr = Math.pow(10.0, fq);
    var fRadius = fr * ParamP.r1 / ( 1.0 + ParamP.r2 * UdMath.udcos(ff));

    return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
             fRadius * Math.cos(fBeta) * Math.sin(fLambda),
             fRadius * Math.sin(fBeta));
  };

  /**
   * Get Position of Mercury, Uranus, Nneptune, Pluto
   */
  var getPosExp3 = function(planetNo, fT2) {
    var ParamL, ParamB, ParamR;
    var fLambda, fBeta, fRadius;

    switch (planetNo) {
      case Planets.Mercury:
        ParamL = MercuryLambda;
        ParamB = MercuryBeta;
        ParamR = MercuryR;

        fLambda = 252.2502 + 149474.0714 * fT2;
        fLambda += (23.4405 + 0.0023 * fT2) *
            UdMath.udcos(149472.5153 * fT2 + 84.7947);
        fLambda += ( 2.9818 + 0.0006 * fT2) *
            UdMath.udcos(298945.031 * fT2 + 259.589);

        fBeta = (6.7057 + 0.0017 * fT2) *
            UdMath.udcos(149472.886 * fT2 + 113.919);
        fBeta += (1.4396 + 0.0005 * fT2) *
            UdMath.udcos(0.37 * fT2 + 119.12);
        fBeta += (1.3643 + 0.0005 * fT2) *
            UdMath.udcos(298945.40 * fT2 + 288.71);

        fRadius = 0.395283 + 0.000002 * fT2;
        fRadius += (0.078341 + 0.000008 * fT2) *
            UdMath.udcos(149472.515 * fT2 + 354.795);
        fRadius += (0.007955 + 0.000002 * fT2) *
            UdMath.udcos(298945.03 * fT2 + 169.59);
        break;
      case Planets.Uranus:
        ParamL = UranusLambda;
        ParamB = UranusBeta;
        ParamR = UranusR;

        fLambda = 313.33676 + 428.72880 * fT2;
        fLambda += 3.20671 * fT2 * UdMath.udcos(705.15539 * fT2 + 114.02740);
        fLambda += 2.69325 * fT2 * UdMath.udcos(597.77389 * fT2 + 317.76510);
        fLambda += 0.00015 * fT2 * UdMath.udcos(3798.6 * fT2 + 313.4);

        fBeta = -0.02997;
        fBeta += 1.78488 * fT2 * UdMath.udcos(507.52281 * fT2 + 188.32394);
        fBeta += 0.56518 * fT2 * UdMath.udcos(892.2869 * fT2 + 354.9571);
        fBeta += 0.00036 * fT2 * UdMath.udcos(1526.5 * fT2 + 263.0);

        fRadius = 19.203034 + 0.042617 * fT2;
        fRadius += 0.361949 * fT2 * UdMath.udcos(440.702 * fT2 + 19.879);
        fRadius += 0.166685 * fT2 * UdMath.udcos(702.024 * fT2 + 307.419);
        break;
      case Planets.Neptune:
        ParamL = NeptuneLambda;
        ParamB = NeptuneBeta;
        ParamR = NeptuneR;

        fLambda = - 55.13323 + 219.93503 * fT2;
        fLambda += 0.04403 * fT2 * UdMath.udcos(684.128 * fT2 + 332.797);
        fLambda += 0.02928 * fT2 * UdMath.udcos(904.371 * fT2 + 342.114);

        fBeta = 0.01725;

        fRadius = 30.073033;
        fRadius += 0.009784 * fT2 * UdMath.udcos(515.2 * fT2 + 195.7);
        break;
      default:
        throw "Arithmetic Exception";
    }

    for(i = 0; i < ParamL.length; i++) {
      fLambda += ParamL[i].a * UdMath.udcos(ParamL[i].b * fT2 + ParamL[i].c);
    }
    fLambda = UdMath.deg2rad(UdMath.degmal(fLambda));

    for(i = 0; i < ParamB.length; i++) {
      fBeta += ParamB[i].a * UdMath.udcos(ParamB[i].b * fT2 + ParamB[i].c);
    }
    fBeta = UdMath.deg2rad(fBeta);

    for(i = 0; i < ParamR.length; i++) {
      fRadius += ParamR[i].a * UdMath.udcos(ParamR[i].b * fT2 + ParamR[i].c);
    }

    return new Xyz(fRadius * Math.cos(fBeta) * Math.cos(fLambda),
             fRadius * Math.cos(fBeta) * Math.sin(fLambda),
             fRadius * Math.sin(fBeta));
  };

};

function getPosition (planetNo, atime) {
  switch (planetNo) {
    case Planets.Earth:
      return getPosExp0(atime.getTime1());
    case Planets.Venus:
    case Planets.Mars:
      return getPosExp1(planetNo, atime.getTime1());
    case Planets.Jupiter:
    case Planets.Saturn:
      return getPosExp2(planetNo, atime.getTime1());
    case Planets.Mercury:
    case Planets.Uranus:
    case Planets.Neptune:
      return getPosExp3(planetNo, atime.getTime2());
  }
  return null;
}

module.exports.getPosition = getPosition;

function PlanetExpP0(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

function PlanetExpP1( /* Venus and Mars */
  L1, L2, L3,
  L4, L5, L6,
  L7, L8, L9,
  B1, B2, B3,
  q1, q2, q3,
  q4, q5) {
  this.L1 = L1; this.L2 = L2; this.L3 = L3;
  this.L4 = L4; this.L5 = L5; this.L6 = L6;
  this.L7 = L7; this.L8 = L8; this.L9 = L9;
  this.B1 = B1; this.B2 = B2; this.B3 = B3;
  this.q1 = q1; this.q2 = q2; this.q3 = q3;
  this.q4 = q4; this.q5 = q5;
}

function PlanetExpP2( /* Jupiter and Saturn */
  L1, L2,
  V1, V2,
  f1, f2, f3, f4,
  B1, B2, B3, B4, B5,
  r1, r2) {
  this.L1 = L1; this.L2 = L2;
  this.V1 = V1; this.V2 = V2;
  this.f1 = f1; this.f2 = f2; this.f3 = f3; this.f4 = f4;
  this.B1 = B1; this.B2 = B2; this.B3 = B3; this.B4 = B4; this.B5 = B5;
  this.r1 = r1; this.r2 = r2;
}

},{"./planet":9,"./udmath":11,"./xyz":12}],8:[function(require,module,exports){
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

},{"./xyz":12}],9:[function(require,module,exports){
var UdMath    = require('./udmath');
var PlanetElm = require('./planet-elm');
var PlanetExp = require('./planet-exp');

/**
 * Planet module
 */

var julianStart = 2433282.5;  // 1950.0
var julianEnd   = 2473459.5;  // 2060.0

var planet = {

  /**
   * Get Planet Position in Ecliptic Coordinates (Equinox Date)
   */
  getPosition: function(planetNo, atime) {
    if (julianStart < atime.julian && atime.julian < julianEnd) {
      return PlanetExp.getPosition(planetNo, atime);
    } else {
      var planetElm = new PlanetElm(planetNo, atime);
      return planetElm.getPosition();
    }
  }

};

module.exports = planet;




},{"./planet-elm":6,"./planet-exp":7,"./udmath":11}],10:[function(require,module,exports){
module.exports = {
  Sun     : 0,
  Mercury : 1,
  Venus   : 2,
  Earth   : 3,
  Mars    : 4,
  Jupiter : 5,
  Saturn  : 6,
  Uranus  : 7,
  Neptune : 8
};


},{}],11:[function(require,module,exports){
/**
 * Common Mathematic Functions
 */

module.exports = {

  /**
   * modulo for double value
   */
  fmod: function(x, y) {
    return x - Math.ceil(x / y) * y;
  },

  /**
   * sin for degree
   */
  udsin: function(x) {
    return Math.sin(x * Math.PI / 180.0);
  },

  /**
   * cos for degree
   */
  udcos: function(x) {
    return Math.cos(x * Math.PI / 180.0);
  },

  /**
   * tan for degree
   */
  udtan: function(x) {
    return Math.tan(x * Math.PI / 180.0);
  },

  /**
   * Rounding degree angle between 0 to 360
   */
  degmal: function(x) {
    var y = 360.0 * (x / 360.0 - Math.floor(x / 360.0));
    if (y < 0.0) {
      y += 360.0;
    }
    if (y >= 360.0) {
      y -= 360.0;
    }
    return y;
  },

  /**
   * Rounding radian angle between 0 to 2*PI
   */
  radmal: function(x) {
    var y = Math.PI * 2.0 * (x / (Math.PI * 2.0) -
            Math.floor(x / (Math.PI * 2.0)));
    if (y < 0.0) {
      y += Math.PI * 2.0;
    }
    if (y >= Math.PI * 2.0) {
      y -= Math.PI * 2.0;
    }
    return y;
  },

  /**
   * Degree to Radian
   */
  deg2rad: function(x) {
    return x * Math.PI / 180.0;
  },

  /**
   * Radian to Degree
   */
  rad2deg: function(x) {
    return x * 180.0 / Math.PI;
  },

  /**
   * arccosh
   */
  arccosh: function(x) {
    return Math.log(x + Math.sqrt(x * x - 1.0));
  },

  /**
   * sinh
   */
  sinh: function(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2.0;
  },

  /**
   * cosh
   */
  cosh: function(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2.0;
  }

};

},{}],12:[function(require,module,exports){
/**
 * 3-Dimensional Vector
 */

module.exports = Xyz;

function Xyz(x, y, z){

  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;

  /**
   * Rotation of Vector with Matrix
   */
  this.rotate = function(mtx) {
    var x = mtx.fA11 * this.x + mtx.fA12 * this.y + mtx.fA13 * this.z;
    var y = mtx.fA21 * this.x + mtx.fA22 * this.y + mtx.fA23 * this.z;
    var z = mtx.fA31 * this.x + mtx.fA32 * this.y + mtx.fA33 * this.z;
    return new Xyz(x, y, z);
  };

  /**
   * V := V1 + V2
   */
  this.add = function(xyz) {
    var x = this.x + xyz.x;
    var y = this.y + xyz.y;
    var z = this.z + xyz.z;
    return new Xyz(x, y, z);
  };

  /**
   * V := V1 - V2
   */
  this.sub = function(xyz) {
    var x = this.x - xyz.x;
    var y = this.y - xyz.y;
    var z = this.z - xyz.z;
    return new Xyz(x, y, z);
  };

  /**
   * V := x * V;
   */
  this.mul = function(a) {
    var x = this.x * a;
    var y = this.y * a;
    var z = this.z * a;
    return new Xyz(x, y, z);
  };

  /**
   * x := abs(V);
   */
  this.abs = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  };

}

},{}],13:[function(require,module,exports){
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

},{"./src/astro":1,"./src/atime":2,"./src/comet":4,"./src/comet-orbit":3,"./src/matrix":5,"./src/planet":9,"./src/planet-orbit":8,"./src/planets":10,"./src/xyz":12}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9hc3Ryby5qcyIsInNyYy9hdGltZS5qcyIsInNyYy9jb21ldC1vcmJpdC5qcyIsInNyYy9jb21ldC5qcyIsInNyYy9tYXRyaXguanMiLCJzcmMvcGxhbmV0LWVsbS5qcyIsInNyYy9wbGFuZXQtZXhwLmpzIiwic3JjL3BsYW5ldC1vcmJpdC5qcyIsInNyYy9wbGFuZXQuanMiLCJzcmMvcGxhbmV0cy5qcyIsInNyYy91ZG1hdGguanMiLCJzcmMveHl6LmpzIiwidmlld2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQXN0cm9ub21pY2FsIENvbnN0YW50c1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgR0FVU1M6IDAuMDE3MjAyMDk4OTUsXG4gIEpEMjAwMDogMjQ1MTU0NS4wLCAvLyAyMDAwLjEuMSAxMmggRVRcbiAgSkQxOTAwOiAyNDE1MDIxLjAgIC8vIDE5MDAuMS4xIDEyaCBFVFxufTtcbiIsInZhciBBc3RybyA9IHJlcXVpcmUoJy4vYXN0cm8nKTtcblxuLyoqXG4gKiBBc3Ryb25vbWljYWwgdGltZSBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGV0aW1lKSB7XG5cbiAgLy8gYWJicmV2aWF0ZWQgbW9udGggbmFtZXNcbiAgdmFyIG1vbnRocyA9IFtcbiAgICBcIkphbi5cIiwgXCJGZWIuXCIsIFwiTWFyLlwiLCBcIkFwci5cIiwgXCJNYXkgXCIsIFwiSnVuZVwiLFxuICAgIFwiSnVseVwiLCBcIkF1Zy5cIiwgXCJTZXAuXCIsIFwiT2N0LlwiLCBcIk5vdi5cIiwgXCJEZWMuXCJcbiAgXTtcblxuICAvLyBmbGFncyBmb3IgY2hhbmdlRGF0ZVxuICB0aGlzLmludFRpbWUgPSAxO1xuICB0aGlzLmRlY1RpbWUgPSAtMTtcblxuICB0aGlzLnllYXIgPSBkYXRldGltZS55ZWFyO1xuICB0aGlzLm1vbnRoID0gZGF0ZXRpbWUubW9udGg7XG4gIHRoaXMuZGF5ID0gTWF0aC5mbG9vcihkYXRldGltZS5kYXkgfHwgMC4wKTtcblxuICBpZihkYXRldGltZS50aW1lem9uZSA9PT0gbnVsbCB8fCBkYXRldGltZS50aW1lem9uZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgJ1RpbWV6b25lIGlzIHJlcXVpcmVkJztcbiAgfVxuXG4gIHRoaXMuaG91ciA9IGRhdGV0aW1lLmhvdXI7XG4gIGlmKCFkYXRldGltZS5ob3VyKSB7XG4gICAgdGhpcy5ob3VyID0gTWF0aC5mbG9vcigoKGRhdGV0aW1lLmRheSB8fCAwLjApIC0gdGhpcy5kYXkpICogMjQuMCk7XG4gIH1cblxuICB0aGlzLm1pbnV0ZSA9IGRhdGV0aW1lLm1pbnV0ZTtcbiAgaWYoIWRhdGV0aW1lLm1pbnV0ZSkge1xuICAgIHRoaXMubWludXRlID0gTWF0aC5mbG9vcigoKGRhdGV0aW1lLmhvdXIgfHwgMC4wKSAtIHRoaXMuaG91cikgKiA2MC4wKTtcbiAgfVxuXG4gIHRoaXMuc2Vjb25kID0gZGF0ZXRpbWUuc2Vjb25kO1xuICBpZighZGF0ZXRpbWUuc2Vjb25kKSB7XG4gICAgdGhpcy5zZWNvbmQgPSBNYXRoLmZsb29yKCgoZGF0ZXRpbWUubWludXRlIHx8IDAuMCkgLSB0aGlzLm1pbnV0ZSkgKiA2MC4wKTtcbiAgfVxuXG4gIHRoaXMudGltZXpvbmUgPSBkYXRldGltZS50aW1lem9uZTtcblxuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMuanVsaWFuID0gZGF0ZXRpbWUuanVsaWFuIHx8IHRoaXMubWFrZUp1bGlhbigpIC0gZGF0ZXRpbWUudGltZXpvbmUgLyAyNC4wO1xuICAgIHRoaXMudGltZTEgPSB0aGlzLm1ha2VUaW1lMSgpOyAvLyBPcmlnaW4gMTk3NC8xMi8zMSAgMGggRVRcbiAgICB0aGlzLnRpbWUyID0gdGhpcy5tYWtlVGltZTIoKTsgLy8gT3JpZ2luIDIwMDAvMDEvMDEgMTJoIEVUXG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCBBYmJyZXZpYXRlZCBNb250aCBOYW1lXG4gICAqL1xuICB0aGlzLmdldE1vbnRoQWJiciA9IGZ1bmN0aW9uKG1vbnRoKSB7XG4gICAgcmV0dXJuIG1vbnRoc1ttb250aCAtIDFdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBZTUQvSE1TIC0+IEp1bGlhbiBEYXRlXG4gICAqL1xuICB0aGlzLm1ha2VKdWxpYW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeWVhciAgPSB0aGlzLnllYXI7XG4gICAgdmFyIG1vbnRoID0gdGhpcy5tb250aDtcbiAgICB2YXIgZGF0ZSA9IHRoaXMuZGF5ICtcbiAgICAgICAgICAgICAgIHRoaXMuaG91ciAgLyAyNC4wICtcbiAgICAgICAgICAgICAgIHRoaXMubWludXRlIC8gMjQuMCAvIDYwLjAgK1xuICAgICAgICAgICAgICAgdGhpcy5zZWNvbmQgLyAyNC4wIC8gNjAuMCAvIDYwLjA7XG4gICAgaWYgKG1vbnRoIDwgMykge1xuICAgICAgbW9udGggKz0gMTI7XG4gICAgICB5ZWFyICAtPSAgMTtcbiAgICB9XG4gICAgdmFyIGp1bGlhbiA9IE1hdGguZmxvb3IoMzY1LjI1ICogeWVhcikgK1xuICAgICAgICAgICAgICAgICBNYXRoLmZsb29yKDMwLjU5ICogKG1vbnRoIC0gMikpICtcbiAgICAgICAgICAgICAgICAgZGF0ZSArMTcyMTA4Ni41O1xuICAgIGlmIChqdWxpYW4gPiAyMjk5MTYwLjUpIHtcbiAgICAgIGp1bGlhbiArPSBNYXRoLmZsb29yKHllYXIgLyA0MDAuMCkgLVxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoeWVhciAvIDEwMC4wKSArIDIuMDtcbiAgICB9XG4gICAgcmV0dXJuIGp1bGlhbjtcbiAgfTtcblxuICAvKipcbiAgICogVGltZSBQYXJhbWV0ZXIgT3JpZ2luIG9mIDE5NzQvMTIvMzEgIDBoIEVUXG4gICAqL1xuICB0aGlzLm1ha2VUaW1lMSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIDI0NDI0MTIuNSA9IDE5NzQuMTIuMzEgMGggRVRcbiAgICB2YXIgZnQgPSAodGhpcy5qdWxpYW4gLSAyNDQyNDEyLjUpIC8gMzY1LjI1O1xuICAgIHZhciB0aW1lMSA9IGZ0ICsgKDAuMDMxNyAqIGZ0ICsgMS40MykgKiAwLjAwMDAwMTtcbiAgICByZXR1cm4gdGltZTE7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRpbWUgUGFyYW1ldGVyIE9yaWdpbiBvZiAyMDAwLzAxLzAxIDEyaCBFVFxuICAgKi9cbiAgdGhpcy5tYWtlVGltZTIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnQgPSAodGhpcy5qdWxpYW4gLSBBc3Ryby5KRDIwMDApIC8gMzY1MjUuMDtcbiAgICByZXR1cm4gZnQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEp1bGlhbiBEYXRlIC0+IFlNRC9ITVNcbiAgICovXG4gIHZhciBnZXREYXRlID0gZnVuY3Rpb24oanVsaWFuKSB7XG4gICAganVsaWFuICs9IDAuNTtcbiAgICB2YXIgYSA9IE1hdGguZmxvb3IoanVsaWFuKTtcbiAgICBpZiAoYSA+PSAyMjk5MTYwLjUpIHtcbiAgICAgIHZhciB0ID0gTWF0aC5mbG9vcigoYSAtIDE4NjcyMTYuMjUpIC8gMzY1MjQuMjUpO1xuICAgICAgYSArPSB0IC0gTWF0aC5mbG9vcih0IC8gNC4wKSArIDEuMDtcbiAgICB9XG4gICAgdmFyIGIgPSBNYXRoLmZsb29yKGEpICsgMTUyNDtcbiAgICB2YXIgYyA9IE1hdGguZmxvb3IoKGIgLSAxMjIuMSkgLyAzNjUuMjUpO1xuICAgIHZhciBrID0gTWF0aC5mbG9vcigoMzY1LjI1KSAqIGMpO1xuICAgIHZhciBlID0gTWF0aC5mbG9vcigoYiAtIGspIC8gMzAuNjAwMSk7XG4gICAgdmFyIGRheSA9IGIgLSBrIC0gTWF0aC5mbG9vcigzMC42MDAxICogZSkgK1xuICAgICAgICAgICAgICAoanVsaWFuIC0gTWF0aC5mbG9vcihqdWxpYW4pKTtcbiAgICB0aGlzLm1vbnRoID0gTWF0aC5mbG9vcihlIC0gKChlID49IDEzLjUpID8gMTMgOiAxKSArIDAuNSk7XG4gICAgdGhpcy55ZWFyICA9IE1hdGguZmxvb3IoYyAtICgodGhpcy5tb250aCA+IDIpID8gNDcxNiA6IDQ3MTUpICsgMC41KTtcbiAgICB0aGlzLmRheSAgID0gTWF0aC5mbG9vcihkYXkpO1xuICAgIHZhciBob3VyID0gKGRheSAtIHRoaXMuZGF5KSAqIDI0LjA7XG4gICAgdGhpcy5ob3VyICA9IE1hdGguZmxvb3IoaG91cik7XG4gICAgdmFyIG1pbiA9IChob3VyIC0gdGhpcy5ob3VyKSAqIDYwLjA7XG4gICAgdGhpcy5taW51dGUgICA9IE1hdGguZmxvb3IobWluKTtcbiAgICB0aGlzLnNlY29uZCAgID0gKG1pbiAtIHRoaXMubWludXRlKSAqIDYwLjA7XG4gIH07XG5cbiAgdGhpcy5jaGFuZ2VEYXRlID0gZnVuY3Rpb24oc3BhbiwgaW5jT3JEZWMpIHtcbiAgICAvL1xuICAgIC8vIEZpcnN0LCBjYWxjdWxhdGUgbmV3IEhvdXIsIE1pbnV0ZSwgYW5kIFNlY29uZFxuICAgIC8vXG4gICAgdmFyIGZIbXMxID0gdGhpcy5ob3VyICogNjAuMCAqIDYwLjAgKyB0aGlzLm1pbnV0ZSAgKiA2MC4wICsgdGhpcy5zZWNvbmQ7XG4gICAgdmFyIGZIbXMyID0gc3Bhbi5ob3VyICogNjAuMCAqIDYwLjAgKyBzcGFuLm1pbnV0ZSAgKiA2MC4wICsgc3Bhbi5zZWNvbmQ7XG4gICAgZkhtczEgKz0gKGluY09yRGVjID09IGluY1RpbWUpID8gZkhtczIgOiAtZkhtczI7XG4gICAgdmFyIG5EYXkxO1xuICAgIGlmICgwLjAgPD0gZkhtczEgJiYgZkhtczEgPCAyNC4wICogNjAuMCAqIDYwLjApIHtcbiAgICAgIG5EYXkxID0gMDtcbiAgICB9IGVsc2UgaWYgKGZIbXMxID49IDI0LjAgKiA2MC4wICogNjAuMCkge1xuICAgICAgbkRheTEgPSBNYXRoLmZsb29yKGZIbXMxIC8gMjQuMCAvIDYwLjAgLyA2MC4wKTtcbiAgICAgIGZIbXMxID0gVWRNYXRoLmZtb2QoZkhtczEsIDI0LjAgKiA2MC4wICogNjAuMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5EYXkxID0gTWF0aC5jZWlsKGZIbXMxIC8gMjQuMCAvIDYwLjAgLyA2MC4wKSAtIDE7XG4gICAgICBmSG1zMSA9IFVkTWF0aC5mbW9kKGZIbXMxLCAyNC4wICogNjAuMCAqIDYwLjApICsgMjQuMCAqIDYwLjAgKiA2MC4wO1xuICAgIH1cblxuICAgIHZhciBuTmV3SG91ciA9IE1hdGguZmxvb3IoZkhtczEgLyA2MC4wIC8gNjAuMCk7XG4gICAgdmFyIG5OZXdNaW4gID0gTWF0aC5mbG9vcihmSG1zMSAvIDYwLjApIC0gbk5ld0hvdXIgKiA2MDtcbiAgICB2YXIgZk5ld1NlYyAgPSBmSG1zMSAtIChuTmV3SG91ciAqIDYwLjAgKiA2MC4wICsgbk5ld01pbiAqIDYwLjApO1xuXG4gICAgLy9cbiAgICAvLyBOZXh0LCBjYWxjdWxhdGUgbmV3IFllYXIsIE1vbnRoLCBEYXlcbiAgICAvL1xuICAgIHZhciBuZXdEYXRlID0gbmV3IEFUaW1lKHRoaXMuZ2V0WWVhcigpLCB0aGlzLmdldE1vbnRoKCksXG4gICAgICAgICAgICAgICAgICB0aGlzLmdldERheSgpLCAxMiwgMCwgMC4wLCAwLjApO1xuICAgIHZhciBqdWxpYW4gPSBuZXdEYXRlLmdldEpkKCk7XG4gICAganVsaWFuICs9IChuSW5jT3JEZWMgPT0gaW5jVGltZSkgPyBuRGF5MSArIHNwYW4uZGF5IDogbkRheTEgLSBzcGFuLmRheTtcbiAgICBuZXdEYXRlID0gbmV3IEFUaW1lKGp1bGlhbiwgMC4wKTtcblxuICAgIHZhciBuTmV3WWVhciAgPSBuZXdEYXRlLmdldFllYXIoKTtcbiAgICB2YXIgbk5ld01vbnRoID0gbmV3RGF0ZS5nZXRNb250aCgpO1xuICAgIHZhciBuTmV3RGF5ICAgPSBuZXdEYXRlLmdldERheSgpO1xuICAgIG5OZXdNb250aCArPSAobkluY09yRGVjID09IGluY1RpbWUpID8gc3Bhbi5tb250aCA6IC1zcGFuLm1vbnRoO1xuICAgIGlmICgxID4gbk5ld01vbnRoKSB7XG4gICAgICBuTmV3WWVhciAtPSBuTmV3TW9udGggLyAxMiArIDE7XG4gICAgICBuTmV3TW9udGggPSAxMiArIG5OZXdNb250aCAlIDEyO1xuICAgIH0gZWxzZSBpZiAobk5ld01vbnRoID4gMTIpIHtcbiAgICAgIG5OZXdZZWFyICs9IG5OZXdNb250aCAvIDEyO1xuICAgICAgbk5ld01vbnRoID0gMSArIChuTmV3TW9udGggLSAxKSAlIDEyO1xuICAgIH1cbiAgICBuTmV3WWVhciArPSAobkluY09yRGVjID09IGluY1RpbWUpID8gc3Bhbi55ZWFyIDogLXNwYW4ueWVhcjtcblxuICAgIC8vIGNoZWNrIGJvdW5kIGJldHdlZW4ganVsaWFuIGFuZCBncmVnb3JpYW5cbiAgICBpZiAobk5ld1llYXIgPT0gMTU4MiAmJiBuTmV3TW9udGggPT0gMTApIHtcbiAgICAgIGlmICg1IDw9IG5OZXdEYXkgJiYgbk5ld0RheSA8IDEwKSB7XG4gICAgICAgIG5OZXdEYXkgPSA0O1xuICAgICAgfSBlbHNlIGlmICgxMCA8PSBuTmV3RGF5ICYmIG5OZXdEYXkgPCAxNSkge1xuICAgICAgICBuTmV3RGF5ID0gMTU7XG4gICAgICB9XG4gICAgfVxuICAgIG5ld0RhdGUgICA9IG5ldyBBVGltZShuTmV3WWVhciwgbk5ld01vbnRoLCBuTmV3RGF5LCAxMiwgMCwgMCwgMC4wKTtcbiAgICBuTmV3WWVhciAgPSBuZXdEYXRlLmdldFllYXIoKTtcbiAgICBuTmV3TW9udGggPSBuZXdEYXRlLmdldE1vbnRoKCk7XG4gICAgbk5ld0RheSAgID0gbmV3RGF0ZS5nZXREYXkoKTtcblxuICAgIHRoaXMueWVhciAgID0gbk5ld1llYXI7XG4gICAgdGhpcy5tb250aCAgPSBuTmV3TW9udGg7XG4gICAgdGhpcy5kYXkgICAgPSBuTmV3RGF5O1xuICAgIHRoaXMuaG91ciAgID0gbk5ld0hvdXI7XG4gICAgdGhpcy5taW51dGUgPSBuTmV3TWluO1xuICAgIHRoaXMuc2Vjb25kID0gZk5ld1NlYztcbiAgICB0aGlzLmp1bGlhbiA9IG1ha2VKdWxpYW4oKSAtIHRpbWV6b25lIC8gMjQuMDtcbiAgICB0aGlzLnRpbWUxICA9IG1ha2VUaW1lMSgpO1xuICAgIHRoaXMudGltZTIgID0gbWFrZVRpbWUyKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFByaW50IHRvIFN0YW5kYXJkIE91dHB1dFxuICAgKi9cbiAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnllYXIgICAgICsgXCIvXCIgICArXG4gICAgICAgICAgIHRoaXMubW9udGggICAgKyBcIi9cIiAgICtcbiAgICAgICAgICAgdGhpcy5kYXkgICAgICArIFwiIFwiICAgK1xuICAgICAgICAgICB0aGlzLmhvdXIgICAgICsgXCI6XCIgICArXG4gICAgICAgICAgIHRoaXMubWludXRlICAgKyBcIjpcIiAgICtcbiAgICAgICAgICAgdGhpcy5zZWNvbmQgICArIFwiID0gXCIgKyB0aGlzLmp1bGlhbiArIFwiIChUWjpcIiArXG4gICAgICAgICAgIHRoaXMudGltZXpvbmUgKyBcIilcIjtcbiAgfTtcblxuICB0aGlzLmluaXQoKTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMuZ2V0RXAgPSBnZXRFcDtcblxuLyoqXG4gKiBPYmxpcXVpdHkgb2YgRWNsaXB0aWMgKFN0YXRpYyBGdW5jdGlvbilcbiAqL1xuZnVuY3Rpb24gZ2V0RXAoanVsaWFuKSB7XG4gIHZhciBmdCA9ICh0aGlzLmp1bGlhbiAtIEFzdHJvLkpEMjAwMCkgLyAzNjUyNS4wO1xuICBpZiAoZnQgPiAzMC4wKXsgICAvLyBPdXQgb2YgQ2FsY3VsYXRpb24gUmFuZ2VcbiAgICBmdCA9IDMwLjA7XG4gIH0gZWxzZSBpZiAoZnQgPCAtMzAuMCl7XG4gICAgZnQgPSAtMzAuMDtcbiAgfVxuICB2YXIgZkVwID0gIDIzLjQzOTI5MTExIC1cbiAgICAgICAgICAgICA0Ni44MTUwICAvIDYwLjAgLyA2MC4wICogZnQgLVxuICAgICAgICAgICAgIDAuMDAwNTkgIC8gNjAuMCAvIDYwLjAgKiBmdCAqIGZ0ICtcbiAgICAgICAgICAgICAwLjAwMTgxMyAvIDYwLjAgLyA2MC4wICogZnQgKiBmdCAqIGZ0O1xuICByZXR1cm4gZkVwICogTWF0aC5QSSAvIDE4MC4wO1xufVxuXG4iLCJ2YXIgWHl6ICAgID0gcmVxdWlyZSgnLi94eXonKTtcbnZhciBBc3RybyAgPSByZXF1aXJlKCcuL2FzdHJvJyk7XG52YXIgQVRpbWUgID0gcmVxdWlyZSgnLi9hdGltZScpO1xudmFyIFVkTWF0aCA9IHJlcXVpcmUoJy4vdWRtYXRoJyk7XG52YXIgTWF0cml4ID0gcmVxdWlyZSgnLi9tYXRyaXgnKTtcblxuLyoqXG4gKiBDb21ldE9yYml0IG1vZHVsZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29tZXQsIGRpdmlzaW9uKSB7XG5cbiAgdmFyIG9yYml0ID0gW107IC8vIGFjdHVhbCBvcmJpdCBkYXRhXG4gIHZhciBtYXhPcmJpdCA9IDkwLjA7XG4gIHZhciB0b2xlcmFuY2UgPSAxLjBlLTE2O1xuXG4gIHRoaXMuZGl2aXNpb24gPSBkaXZpc2lvbjtcblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvcih2YXIgZCA9IDA7IGQgPD0gZGl2aXNpb247IGQrKykge1xuICAgICAgb3JiaXQucHVzaChuZXcgWHl6KCkpO1xuICAgIH1cblxuICAgIGlmIChjb21ldC5lIDwgMS4wIC0gdG9sZXJhbmNlKSB7XG4gICAgICBnZXRPcmJpdEVsbGlwKGNvbWV0KTtcbiAgICB9IGVsc2UgaWYgKGNvbWV0LmUgPiAxLjAgKyB0b2xlcmFuY2UpIHtcbiAgICAgIGdldE9yYml0SHlwZXIoY29tZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnZXRPcmJpdFBhcmEoY29tZXQpO1xuICAgIH1cblxuICAgIHZhciB2ZWMgPSBjb21ldC52ZWN0b3JDb25zdGFudDtcbiAgICB2YXIgcHJlYyA9IE1hdHJpeC5wcmVjTWF0cml4KGNvbWV0LmdldEVxdWlub3hKZCgpLCBBc3Ryby5KRDIwMDApO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGRpdmlzaW9uOyBpKyspIHtcbiAgICAgIG9yYml0W2ldID0gb3JiaXRbaV0ucm90YXRlKHZlYykucm90YXRlKHByZWMpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogIEVsbGlwdGljYWwgT3JiaXRcbiAgICovXG4gIHZhciBnZXRPcmJpdEVsbGlwID0gZnVuY3Rpb24oY29tZXQpIHtcbiAgICB2YXIgZkF4aXMgPSBjb21ldC5xIC8gKDEuMCAtIGNvbWV0LmUpO1xuICAgIHZhciBmYWUyID0gLTIuMCAqIGZBeGlzICogY29tZXQuZTtcbiAgICB2YXIgZnQgPSBNYXRoLnNxcnQoMS4wIC0gY29tZXQuZSAqIGNvbWV0LmUpO1xuICAgIHZhciBpLCBuSWR4MSwgbklkeDIsIGZFLCBmUkNvc1YsIGZSU2luVjtcbiAgICBpZiAoZkF4aXMgKiAoMS4wICsgY29tZXQuZSkgPiBtYXhPcmJpdCkge1xuICAgICAgdmFyIGZkRSA9IE1hdGguYWNvcygoMS4wIC0gbWF4T3JiaXQgLyBmQXhpcykgLyBjb21ldC5lKSAvXG4gICAgICAgICAgKChkaXZpc2lvbiAvIDIpICogKGRpdmlzaW9uIC8gMikpO1xuICAgICAgbklkeDEgPSBuSWR4MiA9IGRpdmlzaW9uIC8gMjtcbiAgICAgIGZvciAoaSA9IDA7IGkgPD0gKGRpdmlzaW9uIC8gMik7IGkrKykge1xuICAgICAgICBmRSA9IGZkRSAqIGkgKiBpO1xuICAgICAgICBmUkNvc1YgPSBmQXhpcyAqIChNYXRoLmNvcyhmRSkgLSBjb21ldC5lKTtcbiAgICAgICAgZlJTaW5WID0gZkF4aXMgKiBmdCAqIE1hdGguc2luKGZFKTtcbiAgICAgICAgb3JiaXRbbklkeDErK10gPSBuZXcgWHl6KGZSQ29zViwgIGZSU2luViwgMC4wKTtcbiAgICAgICAgb3JiaXRbbklkeDItLV0gPSBuZXcgWHl6KGZSQ29zViwgLWZSU2luViwgMC4wKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG5JZHgzLCBuSWR4NDtcbiAgICAgIG5JZHgxID0gMDtcbiAgICAgIG5JZHgyID0gbklkeDMgPSBkaXZpc2lvbiAvIDI7XG4gICAgICBuSWR4NCA9IGRpdmlzaW9uO1xuICAgICAgZkUgPSAwLjA7XG4gICAgICBmb3IgKGkgPSAwOyBpIDw9IChkaXZpc2lvbiAvIDQpO1xuICAgICAgICAgaSsrLCBmRSArPSAoMi4wICogTWF0aC5QSSAvIGRpdmlzaW9uKSkge1xuICAgICAgICBmUkNvc1YgPSBmQXhpcyAqIChNYXRoLmNvcyhmRSkgLSBjb21ldC5lKTtcbiAgICAgICAgZlJTaW5WID0gZkF4aXMgKiBmdCAqIE1hdGguc2luKGZFKTtcbiAgICAgICAgb3JiaXRbbklkeDErK10gPSBuZXcgWHl6KGZSQ29zViwgICAgICAgICBmUlNpblYsIDAuMCk7XG4gICAgICAgIG9yYml0W25JZHgyLS1dID0gbmV3IFh5eihmYWUyIC0gZlJDb3NWLCAgZlJTaW5WLCAwLjApO1xuICAgICAgICBvcmJpdFtuSWR4MysrXSA9IG5ldyBYeXooZmFlMiAtIGZSQ29zViwgLWZSU2luViwgMC4wKTtcbiAgICAgICAgb3JiaXRbbklkeDQtLV0gPSBuZXcgWHl6KGZSQ29zViwgICAgICAgIC1mUlNpblYsIDAuMCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBIeXBlcmJvbGljIE9yYml0XG4gICAqL1xuICB2YXIgZ2V0T3JiaXRIeXBlciA9IGZ1bmN0aW9uKGNvbWV0KSB7XG4gICAgdmFyIG5JZHgxLCBuSWR4MjtcbiAgICB2YXIgZnQgPSBNYXRoLnNxcnQoY29tZXQuZSAqIGNvbWV0LmUgLSAxLjApO1xuICAgIHZhciBmQXhpcyA9IGNvbWV0LmUgLyAoY29tZXQuZSAtIDEuMCk7XG4gICAgdmFyIGZkRiA9IFVkTWF0aC5hcmNjb3NoKChtYXhPcmJpdCArIGZBeGlzKSAvXG4gICAgICAgICAgICAgIChmQXhpcyAqIGNvbWV0LmUpKSAvIChkaXZpc2lvbiAvIDIpO1xuICAgIHZhciBmRiA9IDAuMDtcbiAgICBuSWR4MSA9IG5JZHgyID0gZGl2aXNpb24gLyAyO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IChkaXZpc2lvbiAvIDIpOyBpKyssIGZGICs9IGZkRikge1xuICAgICAgdmFyIGZSQ29zViA9IGZBeGlzICogKGNvbWV0LmUgLSBVZE1hdGguY29zaChmRikpO1xuICAgICAgdmFyIGZSU2luViA9IGZBeGlzICogZnQgKiBVZE1hdGguc2luaChmRik7XG4gICAgICBvcmJpdFtuSWR4MSsrXSA9IG5ldyBYeXooZlJDb3NWLCAgZlJTaW5WLCAwLjApO1xuICAgICAgb3JiaXRbbklkeDItLV0gPSBuZXcgWHl6KGZSQ29zViwgLWZSU2luViwgMC4wKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcmFib2xpYyBPcmJpdFxuICAgKi9cbiAgdmFyIGdldE9yYml0UGFyYSA9IGZ1bmN0aW9uKGNvbWV0KSB7XG4gICAgdmFyIG5JZHgxLCBuSWR4MjtcbiAgICB2YXIgZmRWID0gKE1hdGguYXRhbihNYXRoLnNxcnQobWF4T3JiaXQgLyBjb21ldC5lIC0gMS4wKSkgKlxuICAgICAgICAgICAgICAyLjApIC8gKGRpdmlzaW9uIC8gMik7XG4gICAgdmFyIGZWID0gMC4wO1xuICAgIG5JZHgxID0gbklkeDIgPSBkaXZpc2lvbiAvIDI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gKGRpdmlzaW9uIC8gMik7IGkrKywgZlYgKz0gZmRWKSB7XG4gICAgICB2YXIgZlRhblYyID0gTWF0aC5zaW4oZlYgLyAyLjApIC8gTWF0aC5jb3MoZlYgLyAyLjApO1xuICAgICAgdmFyIGZSQ29zViA9IGNvbWV0LmUgKiAoMS4wIC0gZlRhblYyICogZlRhblYyKTtcbiAgICAgIHZhciBmUlNpblYgPSAyLjAgKiBjb21ldC5lICogZlRhblYyO1xuICAgICAgb3JiaXRbbklkeDErK10gPSBuZXcgWHl6KGZSQ29zViwgIGZSU2luViwgMC4wKTtcbiAgICAgIG9yYml0W25JZHgyLS1dID0gbmV3IFh5eihmUkNvc1YsIC1mUlNpblYsIDAuMCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgT3JiaXQgUG9pbnRcbiAgICovXG4gIHRoaXMuZ2V0QXQgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBvcmJpdFtpbmRleF07XG4gIH07XG5cbiAgaW5pdCgpO1xuXG59O1xuIiwidmFyIFh5eiAgICA9IHJlcXVpcmUoJy4veHl6Jyk7XG52YXIgQVRpbWUgID0gcmVxdWlyZSgnLi9hdGltZScpO1xudmFyIEFzdHJvICA9IHJlcXVpcmUoJy4vYXN0cm8nKTtcbnZhciBNYXRyaXggPSByZXF1aXJlKCcuL21hdHJpeCcpO1xuLy8gcmVxdWlyZShcIi4uL2Jvd2VyX2NvbXBvbmVudHMvbnVtYmVyc1wiKTtcblxuLyoqXG4gKiBDb21ldCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNvbWV0KSB7XG5cbiAgdGhpcy5uYW1lICAgID0gY29tZXQubmFtZTtcbiAgdGhpcy50ICAgICAgID0gY29tZXQudDtcbiAgdGhpcy5lICAgICAgID0gY29tZXQuZTtcbiAgdGhpcy5xICAgICAgID0gY29tZXQucTtcbiAgdGhpcy5wZXJpICAgID0gY29tZXQucGVyaTtcbiAgdGhpcy5ub2RlICAgID0gY29tZXQubm9kZTtcbiAgdGhpcy5pbmNsICAgID0gY29tZXQuaW5jbDtcbiAgdGhpcy5lcXVpbm94ID0gY29tZXQuZXF1aW5veDtcblxuICB2YXIgbWF4QXBwcm94ID0gODA7XG4gIHZhciB0b2xlcmFuY2UgPSAxLjBlLTEyO1xuXG4gIC8vIEVxdWlub3ggLT4gQVRpbWVcbiAgdmFyIG5FcW54WWVhciAgPSBNYXRoLmZsb29yKGNvbWV0LmVxdWlub3gpO1xuICB2YXIgZkVxbnhNb250aCA9IChjb21ldC5lcXVpbm94IC0gbkVxbnhZZWFyKSAqIDEyLjA7XG4gIHZhciBuRXFueE1vbnRoID0gTWF0aC5mbG9vcihmRXFueE1vbnRoKTtcbiAgdmFyIGZFcW54RGF5ICAgPSAoZkVxbnhNb250aCAtIG5FcW54TW9udGgpICogMzAuMDtcbiAgdmFyIGRhdGUgPSB7XG4gICAgeWVhcjogbkVxbnhZZWFyLFxuICAgIG1vbnRoOiBuRXFueE1vbnRoLFxuICAgIGRheTogZkVxbnhEYXksXG4gICAgdGltZXpvbmU6IDAuMFxuICB9O1xuICB0aGlzLmVxdWlub3hUaW1lID0gbmV3IEFUaW1lKGRhdGUpO1xuXG4gIC8vIFZlY3RvciBDb25zdGFudFxuICB0aGlzLnZlY3RvckNvbnN0YW50ID0gTWF0cml4LnZlY3RvckNvbnN0YW50KHRoaXMucGVyaSwgdGhpcy5ub2RlLCB0aGlzLmluY2wsIHRoaXMuZXF1aW5veFRpbWUpO1xuXG4gIC8qKlxuICAgKiBHZXQgUG9zaXRpb24gb24gT3JiaXRhbCBQbGFuZSBmb3IgRWxsaXB0aWNhbCBPcmJpdFxuICAgKi9cbiAgdmFyIGNvbWV0U3RhdHVzRWxsaXAgPSBmdW5jdGlvbihqdWxpYW4pIHtcbiAgICBpZiAodGhpcy5xID09PSAwLjApIHtcbiAgICAgIHRocm93ICdBcml0aG1ldGljIEV4Y2VwdGlvbic7XG4gICAgfVxuICAgIHZhciBmQXhpcyA9IHRoaXMucSAvICgxLjAgLSB0aGlzLmUpO1xuICAgIHZhciBmTSA9IEFzdHJvLkdBVVNTICogKGp1bGlhbiAtIHRoaXMudCkgLyAoTWF0aC5zcXJ0KGZBeGlzKSAqIGZBeGlzKTtcbiAgICB2YXIgZkUxID0gZk0gKyB0aGlzLmUgKiBNYXRoLnNpbihmTSk7XG4gICAgdmFyIG5Db3VudCA9IG1heEFwcHJveDtcbiAgICBpZiAodGhpcy5lIDwgMC42KSB7XG4gICAgICB2YXIgZkUyO1xuICAgICAgZG8ge1xuICAgICAgICBmRTIgPSBmRTE7XG4gICAgICAgIGZFMSA9IGZNICsgdGhpcy5lICogTWF0aC5zaW4oZkUyKTtcbiAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGZFMSAtIGZFMikgPiB0b2xlcmFuY2UgJiYgLS1uQ291bnQgPiAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGZEdjtcbiAgICAgIGRvIHtcbiAgICAgICAgdmFyIGZEdjEgPSAoZk0gKyB0aGlzLmUgKiBNYXRoLnNpbihmRTEpIC0gZkUxKTtcbiAgICAgICAgdmFyIGZEdjIgPSAoMS4wIC0gdGhpcy5lICogTWF0aC5jb3MoZkUxKSk7XG4gICAgICAgIGlmIChNYXRoLmFicyhmRHYxKSA8IHRvbGVyYW5jZSB8fCBNYXRoLmFicyhmRHYyKSA8IHRvbGVyYW5jZSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGZEdiA9IGZEdjEgLyBmRHYyO1xuICAgICAgICBmRTEgKz0gZkR2O1xuICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoZkR2KSA+IHRvbGVyYW5jZSAmJiAtLW5Db3VudCA+IDApO1xuICAgIH1cbiAgICBpZiAobkNvdW50ID09PSAwKSB7XG4gICAgICB0aHJvdyAnQXJpdGhtZXRpYyBFeGNlcHRpb24nO1xuICAgIH1cbiAgICB2YXIgZlggPSBmQXhpcyAqIChNYXRoLmNvcyhmRTEpIC0gdGhpcy5lKTtcbiAgICB2YXIgZlkgPSBmQXhpcyAqIE1hdGguc3FydCgxLjAgLSB0aGlzLmUgKiB0aGlzLmUpICogTWF0aC5zaW4oZkUxKTtcblxuICAgIHJldHVybiBuZXcgWHl6KGZYLCBmWSwgMC4wKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IFBvc2l0aW9uIG9uIE9yYml0YWwgUGxhbmUgZm9yIFBhcmFib2xpYyBPcmJpdFxuICAgKi9cbiAgdmFyIGNvbWV0U3RhdHVzUGFyYSA9IGZ1bmN0aW9uKGp1bGlhbikge1xuICAgIGlmICh0aGlzLnEgPT09IDAuMCkge1xuICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICB9XG4gICAgdmFyIGZOID0gQXN0cm8uR0FVU1MgKiAoanVsaWFuIC0gdGhpcy50KSAvXG4gICAgICAgIChNYXRoLnNxcnQoMi4wKSAqIHRoaXMucSAqIE1hdGguc3FydCh0aGlzLnEpKTtcbiAgICB2YXIgZlRhblYyID0gZk47XG4gICAgdmFyIGZPbGRUYW5WMiwgZlRhbjJWMjtcbiAgICB2YXIgbkNvdW50ID0gbWF4QXBwcm94O1xuICAgIGRvIHtcbiAgICAgIGZPbGRUYW5WMiA9IGZUYW5WMjtcbiAgICAgIGZUYW4yVjIgPSBmVGFuVjIgKiBmVGFuVjI7XG4gICAgICBmVGFuVjIgPSAoZlRhbjJWMiAqIGZUYW5WMiAqIDIuMCAvIDMuMCArIGZOKSAvICgxLjAgKyBmVGFuMlYyKTtcbiAgICB9IHdoaWxlIChNYXRoLmFicyhmVGFuVjIgLSBmT2xkVGFuVjIpID4gdG9sZXJhbmNlICYmIC0tbkNvdW50ID4gMCk7XG4gICAgaWYgKG5Db3VudCA9PT0gMCkge1xuICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICB9XG4gICAgZlRhbjJWMiA9IGZUYW5WMiAqIGZUYW5WMjtcbiAgICB2YXIgZlggPSB0aGlzLnEgKiAoMS4wIC0gZlRhbjJWMik7XG4gICAgdmFyIGZZID0gMi4wICogdGhpcy5xICogZlRhblYyO1xuXG4gICAgcmV0dXJuIG5ldyBYeXooZlgsIGZZLCAwLjApO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgUG9zaXRpb24gb24gT3JiaXRhbCBQbGFuZSBmb3IgTmVhcmx5IFBhcmFib2xpYyBPcmJpdFxuICAgKi9cbiAgdmFyIGNvbWV0U3RhdHVzTmVhclBhcmEgPSBmdW5jdGlvbihqdWxpYW4pIHtcbiAgICBpZiAodGhpcy5xID09PSAwLjApIHtcbiAgICAgIHRocm93ICdBcml0aG1ldGljIEV4Y2VwdGlvbic7XG4gICAgfVxuICAgIHZhciBmQSA9IE1hdGguc3FydCgoMS4wICsgOS4wICogdGhpcy5lKSAvIDEwLjApO1xuICAgIHZhciBmQiA9IDUuMCAqICgxIC0gdGhpcy5lKSAvICgxLjAgKyA5LjAgKiB0aGlzLmUpO1xuICAgIHZhciBmQTEsIGZCMSwgZlgxLCBmQTAsIGZCMCwgZlgwLCBmTjtcbiAgICBmQTEgPSBmQjEgPSBmWDEgPSAxLjA7XG4gICAgdmFyIG5Db3VudDEgPSBtYXhBcHByb3g7XG4gICAgZG8ge1xuICAgICAgZkEwID0gZkExO1xuICAgICAgZkIwID0gZkIxO1xuICAgICAgZk4gPSBmQjAgKiBmQSAqIEFzdHJvLkdBVVNTICogKGp1bGlhbiAtIHRoaXMudCkgL1xuICAgICAgICAgICAoTWF0aC5zcXJ0KDIuMCkgKiB0aGlzLnEgKiBNYXRoLnNxcnQodGhpcy5xKSk7XG4gICAgICB2YXIgbkNvdW50MiA9IG1heEFwcHJveDtcbiAgICAgIGRvIHtcbiAgICAgICAgZlgwID0gZlgxO1xuICAgICAgICB2YXIgZlRtcCA9IGZYMCAqIGZYMDtcbiAgICAgICAgZlgxID0gKGZUbXAgKiBmWDAgKiAyLjAgLyAzLjAgKyBmTikgLyAoMS4wICsgZlRtcCk7XG4gICAgICB9IHdoaWxlIChNYXRoLmFicyhmWDEgLSBmWDApID4gdG9sZXJhbmNlICYmIC0tbkNvdW50MiA+IDApO1xuICAgICAgaWYgKG5Db3VudDIgPT09IDApIHtcbiAgICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICAgIH1cbiAgICAgIGZBMSA9IGZCICogZlgxICogZlgxO1xuICAgICAgZkIxID0gKC0zLjgwOTUyNGUtMDMgKiBmQTEgLSAwLjAxNzE0Mjg1NykgKiBmQTEgKiBmQTEgKyAxLjA7XG4gICAgfSB3aGlsZSAoTWF0aC5hYnMoZkExIC0gZkEwKSA+IHRvbGVyYW5jZSAmJiAtLW5Db3VudDEgPiAwKTtcbiAgICBpZiAobkNvdW50MSA9PT0gMCkge1xuICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICB9XG4gICAgdmFyIGZDMSA9ICgoMC4xMjQ5NTIzOCAqIGZBMSArIDAuMjE3MTQyODYpICogZkExICsgMC40KSAqIGZBMSArIDEuMDtcbiAgICB2YXIgZkQxID0gKCgwLjAwNTcxNDI5ICogZkExICsgMC4yICAgICAgICkgKiBmQTEgLSAxLjApICogZkExICsgMS4wO1xuICAgIHZhciBmVGFuVjIgPSBNYXRoLnNxcnQoNS4wICogKDEuMCArIHRoaXMuZSkgL1xuICAgICAgICAgICAgICAgICAoMS4wICsgOS4wICogdGhpcy5lKSkgKiBmQzEgKiBmWDE7XG4gICAgdmFyIGZYID0gdGhpcy5xICogZkQxICogKDEuMCAtIGZUYW5WMiAqIGZUYW5WMik7XG4gICAgdmFyIGZZID0gMi4wICogdGhpcy5xICogZkQxICogZlRhblYyO1xuICAgIHJldHVybiBuZXcgWHl6KGZYLCBmWSwgMC4wKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IFBvc2l0aW9uIGluIEhlbGlvY2VudHJpYyBFcXVhdG9yaWFsIENvb3JkaW5hdGVzIDIwMDAuMFxuICAgKi9cbiAgdGhpcy5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGp1bGlhbikge1xuICAgIHZhciB4eXo7XG4gICAgLy8gQ29tZXRTdGF0dXMnIG1heSBiZSB0aHJvdyBBcml0aG1ldGljRXhjZXB0aW9uXG4gICAgaWYgKHRoaXMuZSA8IDAuOTgpIHtcbiAgICAgIHh5eiA9IGNvbWV0U3RhdHVzRWxsaXAoanVsaWFuKTtcbiAgICB9IGVsc2UgaWYgKE1hdGguYWJzKHRoaXMuZSAtIDEuMCkgPCB0b2xlcmFuY2UpIHtcbiAgICAgIHh5eiA9IGNvbWV0U3RhdHVzUGFyYShqdWxpYW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB4eXogPSBjb21ldFN0YXR1c05lYXJQYXJhKGp1bGlhbik7XG4gICAgfVxuICAgIHh5eiA9IHh5ei5yb3RhdGUodGhpcy52ZWN0b3JDb25zdGFudCk7XG4gICAgdmFyIG10eFByZWMgPSBNYXRyaXgucHJlY01hdHJpeCh0aGlzLmVxdWlub3hUaW1lLmp1bGlhbiwgQXN0cm8uSkQyMDAwKTtcbiAgICByZXR1cm4geHl6LnJvdGF0ZShtdHhQcmVjKTtcbiAgfTtcblxuICB0aGlzLmdldEVxdWlub3hKZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVxdWlub3hUaW1lLmp1bGlhbjtcbiAgfTtcblxufTtcbiIsInZhciBBc3RybyA9IHJlcXVpcmUoJy4vYXN0cm8nKTtcbnZhciBBVGltZSA9IHJlcXVpcmUoJy4vYXRpbWUnKTtcblxuTWF0cml4LnJvdGF0ZVggPSByb3RhdGVYO1xuTWF0cml4LnJvdGF0ZVkgPSByb3RhdGVZO1xuTWF0cml4LnJvdGF0ZVogPSByb3RhdGVaO1xuTWF0cml4LnByZWNNYXRyaXggPSBwcmVjTWF0cml4O1xuTWF0cml4LnZlY3RvckNvbnN0YW50ID0gdmVjdG9yQ29uc3RhbnQ7XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0cml4O1xuXG4vKipcbiAqIE1hdHJpeCAoM3gzKVxuICovXG5cbmZ1bmN0aW9uIE1hdHJpeChcbiAgZkExMSwgZkExMiwgZkExMyxcbiAgZkEyMSwgZkEyMiwgZkEyMyxcbiAgZkEzMSwgZkEzMiwgZkEzMyl7XG5cbiAgdGhpcy5mQTExID0gZkExMSB8fCAwLjA7XG4gIHRoaXMuZkExMiA9IGZBMTIgfHwgMC4wO1xuICB0aGlzLmZBMTMgPSBmQTEzIHx8IDAuMDtcbiAgdGhpcy5mQTIxID0gZkEyMSB8fCAwLjA7XG4gIHRoaXMuZkEyMiA9IGZBMjIgfHwgMC4wO1xuICB0aGlzLmZBMjMgPSBmQTIzIHx8IDAuMDtcbiAgdGhpcy5mQTMxID0gZkEzMSB8fCAwLjA7XG4gIHRoaXMuZkEzMiA9IGZBMzIgfHwgMC4wO1xuICB0aGlzLmZBMzMgPSBmQTMzIHx8IDAuMDtcblxuICAvKipcbiAgICogTXVsdGlwbGljYXRpb24gb2YgTWF0cml4XG4gICAqL1xuICB0aGlzLm11bHRpcGx5V2l0aE1hdHJpeCA9IGZ1bmN0aW9uKG10eCkge1xuICAgIHZhciBmQTExID0gdGhpcy5mQTExICogbXR4LmZBMTEgKyB0aGlzLmZBMTIgKiBtdHguZkEyMSArXG4gICAgICAgIHRoaXMuZkExMyAqIG10eC5mQTMxO1xuICAgIHZhciBmQTIxID0gdGhpcy5mQTIxICogbXR4LmZBMTEgKyB0aGlzLmZBMjIgKiBtdHguZkEyMSArXG4gICAgICAgIHRoaXMuZkEyMyAqIG10eC5mQTMxO1xuICAgIHZhciBmQTMxID0gdGhpcy5mQTMxICogbXR4LmZBMTEgKyB0aGlzLmZBMzIgKiBtdHguZkEyMSArXG4gICAgICAgIHRoaXMuZkEzMyAqIG10eC5mQTMxO1xuXG4gICAgdmFyIGZBMTIgPSB0aGlzLmZBMTEgKiBtdHguZkExMiArIHRoaXMuZkExMiAqIG10eC5mQTIyICtcbiAgICAgICAgdGhpcy5mQTEzICogbXR4LmZBMzI7XG4gICAgdmFyIGZBMjIgPSB0aGlzLmZBMjEgKiBtdHguZkExMiArIHRoaXMuZkEyMiAqIG10eC5mQTIyICtcbiAgICAgICAgdGhpcy5mQTIzICogbXR4LmZBMzI7XG4gICAgdmFyIGZBMzIgPSB0aGlzLmZBMzEgKiBtdHguZkExMiArIHRoaXMuZkEzMiAqIG10eC5mQTIyICtcbiAgICAgICAgdGhpcy5mQTMzICogbXR4LmZBMzI7XG5cbiAgICB2YXIgZkExMyA9IHRoaXMuZkExMSAqIG10eC5mQTEzICsgdGhpcy5mQTEyICogbXR4LmZBMjMgK1xuICAgICAgICB0aGlzLmZBMTMgKiBtdHguZkEzMztcbiAgICB2YXIgZkEyMyA9IHRoaXMuZkEyMSAqIG10eC5mQTEzICsgdGhpcy5mQTIyICogbXR4LmZBMjMgK1xuICAgICAgICB0aGlzLmZBMjMgKiBtdHguZkEzMztcbiAgICB2YXIgZkEzMyA9IHRoaXMuZkEzMSAqIG10eC5mQTEzICsgdGhpcy5mQTMyICogbXR4LmZBMjMgK1xuICAgICAgICB0aGlzLmZBMzMgKiBtdHguZkEzMztcblxuICAgIHJldHVybiBuZXcgTWF0cml4KGZBMTEsIGZBMTIsIGZBMTMsXG4gICAgICAgICAgICAgICAgICAgICAgZkEyMSwgZkEyMiwgZkEyMyxcbiAgICAgICAgICAgICAgICAgICAgICBmQTMxLCBmQTMyLCBmQTMzKTtcbiAgfTtcblxuICAvKipcbiAgICogTXVsdGlwbGljYXRpb24gb2YgTWF0cml4IGJ5IGRvdWJsZVxuICAgKi9cbiAgdGhpcy5tdWx0aXBseVdpdGhEb3VibGUgPSBmdW5jdGlvbih4KSB7XG4gICAgdmFyIGZBMTEgPSB0aGlzLmZBMTEgKiB4O1xuICAgIHZhciBmQTIxID0gdGhpcy5mQTIxICogeDtcbiAgICB2YXIgZkEzMSA9IHRoaXMuZkEzMSAqIHg7XG5cbiAgICB2YXIgZkExMiA9IHRoaXMuZkExMiAqIHg7XG4gICAgdmFyIGZBMjIgPSB0aGlzLmZBMjIgKiB4O1xuICAgIHZhciBmQTMyID0gdGhpcy5mQTMyICogeDtcblxuICAgIHZhciBmQTEzID0gdGhpcy5mQTEzICogeDtcbiAgICB2YXIgZkEyMyA9IHRoaXMuZkEyMyAqIHg7XG4gICAgdmFyIGZBMzMgPSB0aGlzLmZBMzMgKiB4O1xuXG4gICAgcmV0dXJuIG5ldyBNYXRyaXgoZkExMSwgZkExMiwgZkExMyxcbiAgICAgICAgICAgICAgICAgICAgICBmQTIxLCBmQTIyLCBmQTIzLFxuICAgICAgICAgICAgICAgICAgICAgIGZBMzEsIGZBMzIsIGZBMzMpO1xuICB9O1xuXG4gIHRoaXMubXVsID0gZnVuY3Rpb24oZmFjdG9yKXtcbiAgICBpZih0eXBlb2YgZmFjdG9yID09PSAnbnVtYmVyJyl7XG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseVdpdGhEb3VibGUoZmFjdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbHlXaXRoTWF0cml4KGZhY3Rvcik7XG4gIH07XG5cbiAgLyoqXG4gICAqIEludmVydCBNYXRyaXhcbiAgICovXG4gIHRoaXMuaW52ZXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGEgPSAxLjAgL1xuICAgICAgKHRoaXMuZkExMSAqICh0aGlzLmZBMjIgKiB0aGlzLmZBMzMgLSB0aGlzLmZBMjMgKiB0aGlzLmZBMzIpIC1cbiAgICAgICB0aGlzLmZBMTIgKiAodGhpcy5mQTIxICogdGhpcy5mQTMzIC0gdGhpcy5mQTIzICogdGhpcy5mQTMxKSArXG4gICAgICAgdGhpcy5mQTEzICogKHRoaXMuZkEyMSAqIHRoaXMuZkEzMiAtIHRoaXMuZkEyMiAqIHRoaXMuZkEzMSkpO1xuXG4gICAgdmFyIGZBMTEgPSAgMS4wICogYSAqICh0aGlzLmZBMjIgKiB0aGlzLmZBMzMgLSB0aGlzLmZBMjMgKiB0aGlzLmZBMzIpO1xuICAgIHZhciBmQTEyID0gLTEuMCAqIGEgKiAodGhpcy5mQTEyICogdGhpcy5mQTMzIC0gdGhpcy5mQTEzICogdGhpcy5mQTMyKTtcbiAgICB2YXIgZkExMyA9ICAxLjAgKiBhICogKHRoaXMuZkExMiAqIHRoaXMuZkEyMyAtIHRoaXMuZkExMyAqIHRoaXMuZkEyMik7XG5cbiAgICB2YXIgZkEyMSA9IC0xLjAgKiBhICogKHRoaXMuZkEyMSAqIHRoaXMuZkEzMyAtIHRoaXMuZkEyMyAqIHRoaXMuZkEzMSk7XG4gICAgdmFyIGZBMjIgPSAgMS4wICogYSAqICh0aGlzLmZBMTEgKiB0aGlzLmZBMzMgLSB0aGlzLmZBMTMgKiB0aGlzLmZBMzEpO1xuICAgIHZhciBmQTIzID0gLTEuMCAqIGEgKiAodGhpcy5mQTExICogdGhpcy5mQTIzIC0gdGhpcy5mQTEzICogdGhpcy5mQTIxKTtcblxuICAgIHZhciBmQTMxID0gIDEuMCAqIGEgKiAodGhpcy5mQTIxICogdGhpcy5mQTMyIC0gdGhpcy5mQTIyICogdGhpcy5mQTMxKTtcbiAgICB2YXIgZkEzMiA9IC0xLjAgKiBhICogKHRoaXMuZkExMSAqIHRoaXMuZkEzMiAtIHRoaXMuZkExMiAqIHRoaXMuZkEzMSk7XG4gICAgdmFyIGZBMzMgPSAgMS4wICogYSAqICh0aGlzLmZBMTEgKiB0aGlzLmZBMjIgLSB0aGlzLmZBMTIgKiB0aGlzLmZBMjEpO1xuXG4gICAgdGhpcy5mQTExID0gZkExMTtcbiAgICB0aGlzLmZBMTIgPSBmQTEyO1xuICAgIHRoaXMuZkExMyA9IGZBMTM7XG4gICAgdGhpcy5mQTIxID0gZkEyMTtcbiAgICB0aGlzLmZBMjIgPSBmQTIyO1xuICAgIHRoaXMuZkEyMyA9IGZBMjM7XG4gICAgdGhpcy5mQTMxID0gZkEzMTtcbiAgICB0aGlzLmZBMzIgPSBmQTMyO1xuICAgIHRoaXMuZkEzMyA9IGZBMzM7XG4gIH07XG5cbn1cblxuLyoqXG4gKiBHZXQgVmVjdG9yIENvbnN0YW50IGZyb20gQW5nbGUgRWxlbWVudHNcbiAqL1xuZnVuY3Rpb24gdmVjdG9yQ29uc3RhbnQgKGZQZXJpLCBmTm9kZSwgZkluY2wsIGVxdWlub3gpIHtcbiAgLy8gRXF1aW5veFxuICB2YXIgZlQxID0gZXF1aW5veC50aW1lMTtcbiAgdmFyIGZUMiA9IGVxdWlub3gudGltZTI7XG5cbiAgLy8gT2JsaXF1aXR5IG9mIEVjbGlwdGljXG4gIHZhciBmRXBzO1xuICBpZiAoZlQyIDwgLTQwLjApIHtcbiAgICBmRXBzID0gMjMuODMyNTMgKiBNYXRoLlBJIC8gMTgwLjA7XG4gIH0gZWxzZSBpZihmVDIgPiA0MC4wKSB7XG4gICAgZkVwcyA9IDIzLjA1MjUzICogTWF0aC5QSSAvIDE4MC4wO1xuICB9IGVsc2V7XG4gICAgZkVwcyA9IDIzLjQ0MjUzIC0gMC4wMDAxMyAqIGZUMSArXG4gICAgICAgICAgIDAuMDAyNTYgKiBNYXRoLmNvcygoMjQ5LjAgLSAgMTkuMyAqIGZUMSkgKiBNYXRoLlBJIC8gMTgwLjApICtcbiAgICAgICAgICAgMC4wMDAxNSAqIE1hdGguY29zKCgxOTguMCArIDcyMC4wICogZlQxKSAqIE1hdGguUEkgLyAxODAuMCk7XG4gICAgZkVwcyAqPSBNYXRoLlBJIC8gMTgwLjA7XG4gIH1cbiAgdmFyIGZTaW5FcHMgPSBNYXRoLnNpbihmRXBzKTtcbiAgdmFyIGZDb3NFcHMgPSBNYXRoLmNvcyhmRXBzKTtcblxuICB2YXIgZlNpblBlcmkgPSBNYXRoLnNpbihmUGVyaSk7XG4gIHZhciBmU2luTm9kZSA9IE1hdGguc2luKGZOb2RlKTtcbiAgdmFyIGZTaW5JbmNsID0gTWF0aC5zaW4oZkluY2wpO1xuICB2YXIgZkNvc1BlcmkgPSBNYXRoLmNvcyhmUGVyaSk7XG4gIHZhciBmQ29zTm9kZSA9IE1hdGguY29zKGZOb2RlKTtcbiAgdmFyIGZDb3NJbmNsID0gTWF0aC5jb3MoZkluY2wpO1xuICB2YXIgZldhID0gIGZDb3NQZXJpICogZlNpbk5vZGUgKyBmU2luUGVyaSAqIGZDb3NJbmNsICogZkNvc05vZGU7XG4gIHZhciBmV2IgPSAtZlNpblBlcmkgKiBmU2luTm9kZSArIGZDb3NQZXJpICogZkNvc0luY2wgKiBmQ29zTm9kZTtcblxuICB2YXIgZkExMSA9IGZDb3NQZXJpICogZkNvc05vZGUgIC0gZlNpblBlcmkgKiBmQ29zSW5jbCAqIGZTaW5Ob2RlO1xuICB2YXIgZkEyMSA9IGZXYSAqIGZDb3NFcHMgLSBmU2luUGVyaSAqIGZTaW5JbmNsICogZlNpbkVwcztcbiAgdmFyIGZBMzEgPSBmV2EgKiBmU2luRXBzICsgZlNpblBlcmkgKiBmU2luSW5jbCAqIGZDb3NFcHM7XG4gIHZhciBmQTEyID0gLWZTaW5QZXJpICogZkNvc05vZGUgLSBmQ29zUGVyaSAqIGZDb3NJbmNsICogZlNpbk5vZGU7XG4gIHZhciBmQTIyID0gZldiICogZkNvc0VwcyAtIGZDb3NQZXJpICogZlNpbkluY2wgKiBmU2luRXBzO1xuICB2YXIgZkEzMiA9IGZXYiAqIGZTaW5FcHMgKyBmQ29zUGVyaSAqIGZTaW5JbmNsICogZkNvc0VwcztcblxuICByZXR1cm4gbmV3IE1hdHJpeChmQTExLCBmQTEyLCAwLjAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZkEyMSwgZkEyMiwgMC4wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZBMzEsIGZBMzIsIDAuMCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIFByZWNlc3Npb24gTWF0cml4XG4gKi9cbnZhciBmR2VuZXJhbFByZWMgPSAzNjAuMC8yNTkyMDtcbnZhciBmUHJlY0xpbWl0ID0gMzAuMDtcbmZ1bmN0aW9uIHByZWNNYXRyaXgoZk9sZEVwb2NoLCBmTmV3RXBvY2gpIHtcbiAgdmFyIGZKZCA9IDAuMDtcbiAgdmFyIGJTd2FwRXBvY2ggPSBmYWxzZTtcbiAgdmFyIGJPdXRlck5ld2NvbWIgPSBmYWxzZTtcbiAgaWYgKGZOZXdFcG9jaCA9PSBmT2xkRXBvY2gpIHtcbiAgICByZXR1cm4gbmV3IE1hdHJpeCgxLjAsIDAuMCwgMC4wLFxuICAgICAgICAgICAgICAgICAgICAgIDAuMCwgMS4wLCAwLjAsXG4gICAgICAgICAgICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCk7XG4gIH1cbiAgdmFyIGZUID0gKGZPbGRFcG9jaCAtIEFzdHJvLkpEMjAwMCkgLyAzNjUyNS4wO1xuICBpZiAoZlQgPCAtZlByZWNMaW1pdCB8fCBmUHJlY0xpbWl0IDwgZlQpIHtcbiAgICBiU3dhcEVwb2NoID0gdHJ1ZTtcbiAgICB2YXIgZlRtcCA9IGZOZXdFcG9jaDtcbiAgICBmTmV3RXBvY2ggPSBmT2xkRXBvY2g7XG4gICAgZk9sZEVwb2NoID0gZlRtcDtcbiAgICBmVCA9IChmT2xkRXBvY2ggLSBBc3Ryby5KRDIwMDApIC8gMzY1MjUuMDtcbiAgfVxuXG4gIHZhciBmVDIgPSBmVCAqIGZUO1xuICB2YXIgZnR0LCBmdDtcbiAgZnR0ID0gZnQgPSAoZk5ld0Vwb2NoIC0gZk9sZEVwb2NoKSAvIDM2NTI1LjA7XG4gIGlmIChmdHQgPCAtZlByZWNMaW1pdCkge1xuICAgIGJPdXRlck5ld2NvbWIgPSB0cnVlO1xuICAgIGZ0ID0gLWZQcmVjTGltaXQ7XG4gICAgZkpkID0gLWZQcmVjTGltaXQgKiAzNjUyNS4wICsgQXN0cm8uSkQyMDAwO1xuICB9XG4gIGlmIChmUHJlY0xpbWl0IDwgZnR0KSB7XG4gICAgYk91dGVyTmV3Y29tYiA9IHRydWU7XG4gICAgZnQgPSBmUHJlY0xpbWl0O1xuICAgIGZKZCA9ICBmUHJlY0xpbWl0ICogMzY1MjUuMCArIEFzdHJvLkpEMjAwMDtcbiAgfVxuXG4gIHZhciBmdDIgPSBmdCAqIGZ0O1xuICB2YXIgZnQzID0gZnQyICogZnQ7XG5cbiAgdmFyIGZ6ZXRhMCA9ICggKDIzMDYuMjE4MSArIDEuMzk2NTYqZlQgLSAwLjAwMDEzOSpmVDIpKmZ0ICtcbiAgICAgICAgKDAuMzAxODggLSAwLjAwMDM0NCpmVCkqZnQyICsgMC4wMTc5OTgqZnQzICkgLyAzNjAwLjA7XG4gIHZhciBmenBjICAgPSAoICgyMzA2LjIxODEgKyAxLjM5NjU2KmZUIC0gMC4wMDAxMzkqZlQyKSpmdCArXG4gICAgICAgICgxLjA5NDY4ICsgMC4wMDAwNjYqZlQpKmZ0MiArIDAuMDE4MjAzKmZ0MyApIC8gMzYwMC4wO1xuICB2YXIgZnRoZXRhID0gKCAoMjAwNC4zMTA5IC0gMC44NTMzMCpmVCAtIDAuMDAwMjE3KmZUMikqZnQgLVxuICAgICAgICAoMC40MjY2NSArIDAuMDAwMjE3KmZUKSpmdDIgLSAwLjA0MTgzMypmdDMgKSAvIDM2MDAuMDtcblxuICB2YXIgbXR4MSwgbXR4MiwgbXR4MztcbiAgbXR4MSA9IHJvdGF0ZVooKDkwLjAgLSBmemV0YTApICogTWF0aC5QSSAvIDE4MC4wKTtcbiAgbXR4MiA9IHJvdGF0ZVgoZnRoZXRhICogTWF0aC5QSSAvIDE4MC4wKTtcbiAgbXR4MyA9IG10eDIubXVsKG10eDEpO1xuICBtdHgxID0gcm90YXRlWigoLTkwIC0gZnpwYykgKiBNYXRoLlBJIC8gMTgwLjApO1xuXG4gIHZhciBtdHhQcmVjID0gbXR4MS5tdWwobXR4Myk7XG5cbiAgaWYgKGJPdXRlck5ld2NvbWIpIHtcbiAgICB2YXIgZkRqZDtcbiAgICBpZiAoZnR0IDwgLWZQcmVjTGltaXQpIHtcbiAgICAgIGZEamQgPSAoZk5ld0Vwb2NoIC0gZk9sZEVwb2NoKSArIGZQcmVjTGltaXQgKiAzNjUyNS4wO1xuICAgIH0gZWxzZSB7XG4gICAgICBmRGpkID0gKGZOZXdFcG9jaCAtIGZPbGRFcG9jaCkgLSBmUHJlY0xpbWl0ICogMzY1MjUuMDtcbiAgICB9XG4gICAgdmFyIGZQcmVjUHJtID0gLWZEamQgLyAzNjUuMjQgKiBmR2VuZXJhbFByZWMgKiBNYXRoLlBJIC8gMTgwLjA7XG4gICAgdmFyIGZFcHMgPSBBVGltZS5nZXRFcChmSmQpO1xuICAgIG10eDEgPSByb3RhdGVYKGZFcHMpO1xuICAgIG10eDIgPSByb3RhdGVaKGZQcmVjUHJtKTtcbiAgICBtdHgzID0gbXR4Mi5tdWwobXR4MSk7XG4gICAgbXR4MiA9IHJvdGF0ZVgoLWZFcHMpO1xuICAgIG10eDEgPSBtdHgyLm11bChtdHgzKTtcbiAgICBtdHhQcmVjID0gbXR4MS5tdWwobXR4UHJlYyk7XG4gIH1cblxuICBpZihiU3dhcEVwb2NoKXtcbiAgICBtdHhQcmVjLmludmVydCgpO1xuICB9XG5cbiAgcmV0dXJuIG10eFByZWM7XG59XG5cbi8qKlxuICogQ3JlYXRlIFJvdGF0aW9uIE1hdHJpeCBBcm91bmQgWC1BeGlzXG4gKi9cbmZ1bmN0aW9uIHJvdGF0ZVgoYW5nbGUpIHtcbiAgdmFyIGZBMTEgPSAgMS4wO1xuICB2YXIgZkExMiA9ICAwLjA7XG4gIHZhciBmQTEzID0gIDAuMDtcbiAgdmFyIGZBMjEgPSAgMC4wO1xuICB2YXIgZkEyMiA9ICBNYXRoLmNvcyhhbmdsZSk7XG4gIHZhciBmQTIzID0gIE1hdGguc2luKGFuZ2xlKTtcbiAgdmFyIGZBMzEgPSAgMC4wO1xuICB2YXIgZkEzMiA9IC1NYXRoLnNpbihhbmdsZSk7XG4gIHZhciBmQTMzID0gIE1hdGguY29zKGFuZ2xlKTtcblxuICByZXR1cm4gbmV3IE1hdHJpeChmQTExLCBmQTEyLCBmQTEzLFxuICAgICAgICAgICAgICAgICAgICBmQTIxLCBmQTIyLCBmQTIzLFxuICAgICAgICAgICAgICAgICAgICBmQTMxLCBmQTMyLCBmQTMzKTtcbn1cblxuLyoqXG4gKiAgQ3JlYXRlIFJvdGF0aW9uIE1hdHJpeCBBcm91bmQgWS1BeGlzXG4gKi9cbmZ1bmN0aW9uIHJvdGF0ZVkoYW5nbGUpIHtcbiAgdmFyIGZBMTEgPSAgTWF0aC5jb3MoYW5nbGUpO1xuICB2YXIgZkExMiA9ICAwLjA7XG4gIHZhciBmQTEzID0gLU1hdGguc2luKGFuZ2xlKTtcbiAgdmFyIGZBMjEgPSAgMC4wO1xuICB2YXIgZkEyMiA9ICAxLjA7XG4gIHZhciBmQTIzID0gIDAuMDtcbiAgdmFyIGZBMzEgPSAgTWF0aC5zaW4oYW5nbGUpO1xuICB2YXIgZkEzMiA9ICAwLjA7XG4gIHZhciBmQTMzID0gIE1hdGguY29zKGFuZ2xlKTtcblxuICByZXR1cm4gbmV3IE1hdHJpeChmQTExLCBmQTEyLCBmQTEzLFxuICAgICAgICAgICAgICAgICAgICBmQTIxLCBmQTIyLCBmQTIzLFxuICAgICAgICAgICAgICAgICAgICBmQTMxLCBmQTMyLCBmQTMzKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgUm90YXRpb24gTWF0cml4IEFyb3VuZCBaLUF4aXNcbiAqL1xuZnVuY3Rpb24gcm90YXRlWihhbmdsZSkge1xuICB2YXIgZkExMSA9ICBNYXRoLmNvcyhhbmdsZSk7XG4gIHZhciBmQTEyID0gIE1hdGguc2luKGFuZ2xlKTtcbiAgdmFyIGZBMTMgPSAgMC4wO1xuICB2YXIgZkEyMSA9IC1NYXRoLnNpbihhbmdsZSk7XG4gIHZhciBmQTIyID0gIE1hdGguY29zKGFuZ2xlKTtcbiAgdmFyIGZBMjMgPSAgMC4wO1xuICB2YXIgZkEzMSA9ICAwLjA7XG4gIHZhciBmQTMyID0gIDAuMDtcbiAgdmFyIGZBMzMgPSAgMS4wO1xuXG4gIHJldHVybiBuZXcgTWF0cml4KGZBMTEsIGZBMTIsIGZBMTMsXG4gICAgICAgICAgICAgICAgICAgIGZBMjEsIGZBMjIsIGZBMjMsXG4gICAgICAgICAgICAgICAgICAgIGZBMzEsIGZBMzIsIGZBMzMpO1xufVxuIiwidmFyIFh5eiAgICA9IHJlcXVpcmUoJy4veHl6Jyk7XG52YXIgQXN0cm8gID0gcmVxdWlyZSgnLi9hc3RybycpO1xudmFyIFVkTWF0aCA9IHJlcXVpcmUoJy4vdWRtYXRoJyk7XG52YXIgUGxhbmV0cyA9IHJlcXVpcmUoJy4vcGxhbmV0cycpO1xuXG4vKipcbiAqIFBsYW5ldEVsbSBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBsYW5ldE5vLCBhdGltZSkge1xuXG4gIHZhciBsOyAgIC8qIE0rcGVyaStub2RlICovXG4gIHZhciBub2RlOyAgLyogQXNjZW5kaW5nIE5vZGUgKi9cbiAgdmFyIHBlcmk7ICAvKiBBcmd1bWVudCBvZiBQZXJpaGVsaW9uICovXG4gIHZhciBheGlzOyAgLyogU2VtaW1ham9yIEF4aXMgKi9cbiAgdmFyIGU7ICAgLyogRWNjZW50cmljaXR5ICovXG4gIHZhciBpbmNsOyAgLyogSW5jbGluYXRpb24gKi9cblxuICB2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIHN3aXRjaCAocGxhbmV0Tm8pIHtcbiAgICAgIGNhc2UgUGxhbmV0cy5FYXJ0aDpcbiAgICAgICAgZ2V0UGxhbmV0RWxtRWFydGgoYXRpbWUuanVsaWFuKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuTWVyY3VyeTpcbiAgICAgIGNhc2UgUGxhbmV0cy5WZW51czpcbiAgICAgIGNhc2UgUGxhbmV0cy5NYXJzOlxuICAgICAgY2FzZSBQbGFuZXRzLkp1cGl0ZXI6XG4gICAgICBjYXNlIFBsYW5ldHMuU2F0dXJuOlxuICAgICAgICBnZXRQbGFuZXRFbG0xKHBsYW5ldE5vLCBhdGltZS5qdWxpYW4pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUGxhbmV0cy5VcmFudXM6XG4gICAgICBjYXNlIFBsYW5ldHMuTmVwdHVuZTpcbiAgICAgICAgZ2V0UGxhbmV0RWxtMihwbGFuZXRObywgYXRpbWUuanVsaWFuKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBcIkFyaXRobWV0aWMgRXhjZXB0aW9uXCI7XG4gICAgfVxuICB9O1xuXG4gIC8vXG4gIC8vIE1lcmN1cnlcbiAgLy9cbiAgdmFyIE1lcmN1cnlFID0gbmV3IFBsYW5ldEVsbVAxKFxuICAgICAxODIuMjcxNzUsICAxNDk0NzQuMDcyNDQsICAgMi4wMTk0NEUtMywgIDAuMCxcbiAgICAgIDc1Ljg5NzE3LCAgICAgIDEuNTUzNDY5LCAgIDMuMDg2MzlFLTQsICAwLjAsXG4gICAgIDQ3LjE0NDczNiwgICAgICAgMS4xODQ3NiwgICAyLjIzMTk0RS00LCAgMC4wLFxuICAgICAgNy4wMDMwMTQsICAgIDEuNzM4MzNFLTMsICAtMS41NTU1NUUtNSwgIDAuMCxcbiAgICAwLjIwNTYxNDk0LCAgICAgMC4wMjAzRS0zLCAgICAgLTAuMDRFLTYsICAwLjAsXG4gICAgIDAuMzg3MDk4NFxuICApO1xuXG4gIC8vXG4gIC8vIFZlbnVzXG4gIC8vXG4gIHZhciBWZW51c0UgPSBuZXcgUGxhbmV0RWxtUDEoXG4gICAgIDM0NC4zNjkzNiwgIDU4NTE5LjIxMjYsICAgOS44MDU1RS00LCAgMC4wLFxuICAgICAxMzAuMTQwNTcsICAgICAxLjM3MjMwLCAgLTEuNjQ3MkUtMywgIDAuMCxcbiAgICAgICA3NS43ODgxLCAgICAgMC45MTQwMywgICAgNC4xODlFLTQsICAwLjAsXG4gICAgICAgIDMuMzkzNiwgICAxLjI1MjJFLTMsICAgLTQuMzMzRS02LCAgMC4wLFxuICAgIDAuMDA2ODE2MzYsICAtMC41Mzg0RS00LCAgICAwLjEyNkUtNiwgIDAuMCxcbiAgICAwLjcyMzMzMDE1XG4gICk7XG5cbiAgLy9cbiAgLy8gTWFyc1xuICAvL1xuICB2YXIgTWFyc0UgPSBuZXcgUGxhbmV0RWxtUDEoXG4gICAgMjk0LjI2NDc4LCAgMTkxNDEuNjk2MjUsICAgMy4xNTAyOEUtNCwgIDAuMCxcbiAgICAzMzQuMjE4MzMsICAgICAxLjg0MDM5NCwgICAzLjM1OTE3RS00LCAgMC4wLFxuICAgICA0OC43ODY3MCwgICAgIDAuNzc2OTQ0LCAgLTYuMDI3NzhFLTQsICAwLjAsXG4gICAgICAxLjg1MDMwLCAgLTYuNDkwMjhFLTQsICAgICAyLjYyNUUtNSwgIDAuMCxcbiAgICAwLjA5MzMwODgsICAwLjA5NTI4NEUtMywgICAgLTAuMTIyRS02LCAgMC4wLFxuICAgIDEuNTIzNjc4MVxuICApO1xuXG4gIC8vXG4gIC8vIEp1cGl0ZXJcbiAgLy9cbiAgdmFyIEp1cGl0ZXJFID0gbmV3IFBsYW5ldEVsbVAxKFxuICAgIDIzOC4xMzIzODYsICAzMDM2LjMwMTk4NiwgIDMuMzQ2ODNFLTQsICAtMS42NDg4OUUtNixcbiAgICAgMTIuNzIwOTcyLCAgICAxLjYwOTk2MTcsICAxLjA1NjI3RS0zLCAgIC0zLjQzMzNFLTYsXG4gICAgIDk5LjQ0MzQxNCwgICAgICAxLjAxMDUzLCAgMy41MjIyMkUtNCwgIC04LjUxMTExRS02LFxuICAgICAgMS4zMDg3MzYsICAtNS42OTYxMUUtMywgIDMuODg4ODlFLTYsICAgICAgICAgIDAuMCxcbiAgICAgMC4wNDgzMzQ4LCAgMC4xNjQxODBFLTMsICAtMC40Njc2RS02LCAgICAgIC0xLjdFLTksXG4gICAgNS4yMDI4MDVcbiAgKTtcblxuICAvL1xuICAvLyBTYXR1cm5cbiAgLy9cbiAgdmFyIFNhdHVybkUgPSBuZXcgUGxhbmV0RWxtUDEoXG4gICAgMjY2LjU5Nzg3NSwgICAxMjIzLjUwOTg4LCAgICAzLjI0NTQyRS00LCAgLTUuODMzMzNFLTcsXG4gICAgICA5MS4wOTgyMSwgICAgIDEuOTU4NDE2LCAgICA4LjI2MzYxRS00LCAgIDQuNjExMTFFLTYsXG4gICAgMTEyLjc5MDQxNCwgICAgIDAuODczMTk1LCAgLTEuNTIxODEwRS00LCAgLTUuMzA1NTVFLTYsXG4gICAgICAgMi40OTI1MiwgIC0zLjkxODg5RS0zLCAgIC0xLjU0ODg5RS01LCAgIDQuNDQ0NDRFLTgsXG4gICAgMC4wNTU4OTIzMSwgIC0wLjM0NTUwRS0zLCAgICAgLTAuNzI4RS02LCAgICAgIDAuNzRFLTksXG4gICAgOS41NTQ3NFxuICApO1xuXG4gIC8vXG4gIC8vIFVyYW51c1xuICAvL1xuICB2YXIgVXJhbnVzRSA9IG5ldyBQbGFuZXRFbG1QMihcbiAgICAzMTQuMDU1MDA1LCAgMC4wMTE3NjkwMzY0NCwgICAgMC4wMDAzMDQzLFxuICAgIDE3My4wMDUxNTksICAgICAgMS40ODYzNzg0LCAgICAwLjAwMDIxNDUsXG4gICAgIDc0LjAwNTk0NywgICAgICAwLjUyMTEyNTgsICAgIDAuMDAxMzM5OSxcbiAgICAxOS4yMTg0NDYxLCAgIC0wLjAwMDAwMDAzNywgICAgICAgICAgMC4wLFxuICAgIDAuMDQ2Mjk1OTAsICAgLTAuMDAwMDI3MzM3LCAgMC4wMDAwMDAwNzksXG4gICAgIDAuNzczMTk2LCAgICAgICAwLjAwMDc3NDQsICAgIDAuMDAwMDM3NVxuICApO1xuXG4gIC8vXG4gIC8vIE5lcHR1bmVcbiAgLy9cbiAgdmFyIE5lcHR1bmVFID0gbmV3IFBsYW5ldEVsbVAyKFxuICAgIDMwNC4zNDg2NjUsICAwLjAwNjAyMDA3NjkxLCAgICAgMC4wMDAzMDkzLFxuICAgICA0OC4xMjM2OTEsICAgICAgMS40MjYyNjc4LCAgICAgMC4wMDAzNzkyLFxuICAgIDEzMS43ODQwNTcsICAgICAgMS4xMDIyMDM1LCAgICAgMC4wMDAyNjAwLFxuICAgIDMwLjExMDM4NjksICAgLTAuMDAwMDAwMTY2LCAgICAgICAgICAgMC4wLFxuICAgIDAuMDA4OTg4MDksICAgIDAuMDAwMDA2NDA4LCAgLTAuMDAwMDAwMDAxLFxuICAgICAgMS43Njk5NTIsICAgICAtMC4wMDkzMDgyLCAgICAtMC4wMDAwMDcxXG4gICk7XG5cbiAgLy9cbiAgLy8gUGVydHVyYmF0aW9uIGNvcnJlY3Rpb24gZm9yIEp1cGl0ZXJcbiAgLy9cbiAgdmFyIHBlcnR1cmJKdXAxID0gW1xuICAgIC0yMCwgLTI3LCAtNDQsIC0zNiwgLTIwLCAgMTAsICAyMSwgIDI3LCAgMzMsICAyNSwgIDE4LCAgIDgsIC0yMCxcbiAgICAtMTQsIC0yNSwgLTU3LCAtNzUsIC03MCwgLTU1LCAtMjUsIC0xNSwgIC0yLCAgIDgsICAgMSwgIC00LCAtMTUsXG4gICAgICA1LCAgLTUsIC0yMSwgLTU1LCAtNjcsIC03MiwgLTU1LCAtMjgsIC0xMywgICAwLCAgIDcsICAxMCwgICA1LFxuICAgICAyNCwgIDIxLCAgIDksIC0xMSwgLTM3LCAtNTcsIC01NSwgLTM3LCAtMTUsICAgMywgIDEzLCAgMTgsICAyMyxcbiAgICAgMjcsICAyOSwgIDI3LCAgMTUsICAgNCwgLTI1LCAtNDUsIC0zOCwgLTIyLCAgLTUsICAxMCwgIDI1LCAgMzAsXG4gICAgIDE1LCAgMjcsICAzOSwgIDMzLCAgMjUsICAtNSwgLTI3LCAtMzQsIC0zMCwgLTE5LCAgLTYsICAyMCwgIDIxLFxuICAgICAgNywgIDE1LCAgMjUsICAzMSwgIDI0LCAgIDgsIC0xMSwgLTI2LCAtMzIsIC0yNywgLTE5LCAgLTYsICAxNixcbiAgICAgLTMsICAgMywgIDE1LCAgMjMsICAyMiwgIDE1LCAgIDAsIC0xNSwgLTI2LCAtMjksIC0yNSwgLTIwLCAgLTQsXG4gICAgLTE1LCAgLTUsICAgMywgIDE3LCAgMjIsICAyMCwgIDExLCAgIDUsIC0xMSwgLTI2LCAtMjcsIC0yNSwgLTE2LFxuICAgIC0xNywgIC00LCAgMTAsICAyMCwgIDI1LCAgMzEsICAyNSwgIDI0LCAgMTUsICAtNiwgLTE1LCAtMTgsIC0xMyxcbiAgICAgIDAsICAgMiwgIDEzLCAgMjgsICAzOSwgIDQ5LCAgNDgsICAzOCwgIDMzLCAgMjcsICAxMywgIC0xLCAgLTIsXG4gICAgIC0xLCAgIDAsICAgNiwgIDIzLCAgMzksICA0OSwgIDYzLCAgNTMsICA0OCwgIDQxLCAgMzUsICAxNywgICA0LFxuICAgIC0yNiwgLTMwLCAtMzAsIC0yNSwgIC05LCAgMTcsICAzMSwgIDM0LCAgMzQsICAyNSwgIDIyLCAgMTMsICAgNlxuICBdO1xuXG4gIHZhciBwZXJ0dXJiSnVwMiA9IFtcbiAgICAgIDQsICAxNSwgIDMwLCAgNDAsICA0MCwgIDI1LCAgIDYsICAgOCwgLTI3LCAtNDMsIC00MywgLTI4LCAgLTUsXG4gICAgLTI0LCAgLTksICAgNywgIDEwLCAgMjcsICAzMCwgIDMxLCAgMTcsICAtNCwgLTI5LCAtNDMsIC00MCwgLTI3LFxuICAgIC0zMSwgLTI0LCAtMjUsICAtNSwgIDE0LCAgMzEsICA0MywgIDQzLCAgMTksICAtNiwgLTI5LCAtNDMsIC0zMixcbiAgICAtMzksIC0yOSwgLTIxLCAtMTMsICAtNCwgIDE5LCAgMzYsICA1MiwgIDM1LCAgMTUsIC0xMSwgLTMwLCAtMzYsXG4gICAgLTMxLCAtMzAsIC0yNCwgLTE5LCAtMTMsICAgMCwgIDIwLCAgMzUsICA0NiwgIDMxLCAgIDksIC0xNywgLTMwLFxuICAgIC0yNiwgLTI4LCAtMjgsIC0yMCwgLTE3LCAtMTUsICAgMCwgIDI0LCAgNDYsICA0NSwgIDI1LCAgIDAsIC0yOCxcbiAgICAtMTAsIC0yMywgLTI3LCAtMjMsIC0yMSwgLTIyLCAtMTQsICAgNCwgIDI5LCAgNDAsICAzNywgIDE3LCAgLTUsXG4gICAgIDE1LCAgLTksIC0yMCwgLTIyLCAtMjMsIC0yNywgLTIxLCAtMTMsICAxMiwgIDMxLCAgNDAsICAzMywgIDE1LFxuICAgICAyOSwgIDEzLCAtMTAsIC0xOCwgLTIyLCAtMjcsIC0zMCwgLTI1LCAtMTEsICAxNiwgIDM2LCAgNDIsICAzMSxcbiAgICAgNDUsICAyOCwgICA4LCAtMTAsIC0yMCwgLTI4LCAtMzMsIC0zMywgLTI2LCAgIDksICAyMiwgIDQ1LCAgNDQsXG4gICAgIDQxLCAgNDUsICAxOSwgICA5LCAgLTksIC0yMSwgLTM0LCAtMzQsIC0zNCwgLTE5LCAgLTQsICAyNiwgIDQyLFxuICAgICAyMiwgIDM2LCAgNDIsICAyNSwgIDE0LCAgIDAsIC0xOCwgLTI3LCAtMzQsIC0zMiwgLTIxLCAgLTcsICAyNixcbiAgICAgIDAsICAxMSwgIDI2LCAgMzksICAzNiwgIDI1LCAgIDgsICAtOCwgLTI2LCAtMzgsIC0zOCwgLTI4LCAgLTIsXG4gIF07XG5cbiAgdmFyIHBlcnR1cmJKdXAzID0gW1xuICAgICA0MSwgIDMzLCAgMTksICAgNCwgLTEzLCAtMjgsIC0zNywgLTQyLCAtMjcsICAtOSwgIDE2LCAgMzAsICA0NCxcbiAgICAgMjcsICAzMywgIDMzLCAgMjMsICAxNSwgICAzLCAtMjIsIC0zNiwgLTQzLCAtMjUsIC0xMCwgIDE0LCAgMjcsXG4gICAgIDEzLCAgMjMsICAzMiwgIDMzLCAgMjcsICAyMiwgICA4LCAtMjIsIC0zNywgLTQyLCAtMjcsIC0xMCwgIDEyLFxuICAgICAtNSwgIDEwLCAgMTgsICAyMywgIDM0LCAgMzIsICAyNSwgICA1LCAtMjYsIC00NSwgLTQ3LCAtMjYsICAtNSxcbiAgICAtMTcsICAtMiwgIDEwLCAgMTgsICAyNiwgIDM1LCAgMzcsICAyMiwgIC00LCAtMjcsIC00NCwgLTQyLCAtMjcsXG4gICAgLTMzLCAtMTUsICAtMSwgICA3LCAgMTYsICAyMiwgIDM2LCAgMzUsICAxNiwgIC03LCAtMjgsIC00MCwgLTM2LFxuICAgIC00NCwgLTI3LCAtMTIsICAtNiwgICA0LCAgMTYsICAzMiwgIDU0LCAgMzEsICAxMiwgLTEwLCAtMzEsIC00MyxcbiAgICAtMzcsIC0zNywgLTI0LCAtMTIsICAtMiwgICA3LCAgMTcsICAzMCwgIDQyLCAgMjQsICAxMSwgLTE1LCAtMzMsXG4gICAgLTMxLCAtMzYsIC0zNSwgLTI0LCAtMTMsICAtNCwgICA3LCAgMjEsICAzNSwgIDM4LCAgMjAsICAgNiwgLTE1LFxuICAgIC0xOSwgLTMyLCAtNDAsIC0zMSwgLTIxLCAtMTgsICAtNSwgIDEyLCAgMjUsICAzOCwgIDQyLCAgMjYsICAtNixcbiAgICAgMTEsIC0xNCwgLTMwLCAtNDQsIC0zMywgLTI3LCAtMTMsICAtMSwgIDE1LCAgMjksICA0MiwgIDM5LCAgMTgsXG4gICAgIDMxLCAgMTMsICAtNiwgLTIyLCAtMzQsIC0yOSwgLTI3LCAtMjcsICAgOSwgIDE1LCAgMjUsICA0MCwgIDM1LFxuICAgICA0MCwgIDMxLCAgMTgsICAgNiwgLTE1LCAtMjgsIC0zOCwgLTQwLCAtMjksIC0xMywgIDE1LCAgMjUsICA0MCxcbiAgXTtcblxuICAvL1xuICAvLyBQZXJ0dXJiYXRpb24gY29ycmVjdGlvbiBmb3IgU2F0dXJuXG4gIC8vXG4gIHZhciBwZXJ0dXJiU2F0MSA9IFtcbiAgICA1NywgIDU5LCAgNTcsICA2MCwgIDU2LCAgNDgsICA0MiwgIDQxLCAgNDEsICA0MiwgIDQ2LCAgNTAsICA1NSxcbiAgICA2MSwgIDY0LCAgNzAsICA3MywgIDc0LCAgNjYsICA2MSwgIDU3LCAgNTUsICA1NSwgIDU1LCAgNTYsICA1NixcbiAgICA1OCwgIDYxLCAgNjUsICA3MSwgIDc2LCAgNzYsICA3MiwgIDY2LCAgNjMsICA2MSwgIDYwLCAgNTgsICA1NixcbiAgICA1NSwgIDU1LCAgNTgsICA2MywgIDY4LCAgNzQsICA3MywgIDcxLCAgNjcsICA2MywgIDYxLCAgNTcsICA1NSxcbiAgICA1MiwgIDUxLCAgNTEsICA1NSwgIDYxLCAgNjcsICA3MCwgIDcwLCAgNjcsICA2MiwgIDU4LCAgNTUsICA1MyxcbiAgICA0OSwgIDQ4LCAgNDcsICA0OCwgIDUyLCAgNTgsICA2MywgIDY1LCAgNjMsICA2MCwgIDU2LCAgNTIsICA1MCxcbiAgICA0OCwgIDQ2LCAgNDQsICA0MywgIDQ1LCAgNDksICA1NCwgIDU3LCAgNTgsICA1NiwgIDUzLCAgNTAsICA0OCxcbiAgICA0NiwgIDQ0LCAgNDEsICA0MCwgIDM5LCAgNDAsICA0NSwgIDQ4LCAgNTAsICA1MSwgIDUwLCAgNDgsICA0NixcbiAgICA0NCwgIDQyLCAgMzksICAzNywgIDM2LCAgMzUsICAzNiwgIDM5LCAgNDMsICA0NSwgIDQ2LCAgNDUsICA0NCxcbiAgICA0MiwgIDQwLCAgMzYsICAzNCwgIDMyLCAgMzEsICAzMSwgIDMzLCAgMzcsICAzOSwgIDQxLCAgNDIsICA0NCxcbiAgICA0MiwgIDM5LCAgMzcsICAzMywgIDMwLCAgMjksICAyOSwgIDMwLCAgMzIsICAzNCwgIDM3LCAgNDAsICA0NCxcbiAgICA0NSwgIDQ1LCAgNDMsICAzOSwgIDM1LCAgMzAsICAyOSwgIDMwLCAgMzMsICAzNSwgIDM4LCAgNDIsICA0NSxcbiAgICA1NSwgIDU3LCAgNjEsICA1NiwgIDQ5LCAgNDUsICA0MiwgIDQwLCAgNDIsICA0MywgIDQ2LCAgNTAsICA1NCxcbiAgXTtcblxuICB2YXIgcGVydHVyYlNhdDIgPSBbXG4gICAgMzMsICAzNywgIDQ0LCAgNTIsICA2MCwgIDY2LCAgNjcsICA2NSwgIDU3LCAgNDYsICAzNywgIDMyLCAgMzEsXG4gICAgMzQsICA0MCwgIDUwLCAgNjAsICA2NywgIDcwLCAgNjcsICA2MCwgIDUwLCAgNDAsICAzMywgIDI5LCAgMzEsXG4gICAgMzYsICA0MiwgIDUwLCAgNjAsICA2OCwgIDcyLCAgNjgsICA1OSwgIDQ3LCAgMzgsICAzNCwgIDM0LCAgMzcsXG4gICAgNDUsICA0OCwgIDUyLCAgNTcsICA2MiwgIDY1LCAgNjMsICA1NSwgIDQ1LCAgNDAsICAzOSwgIDQyLCAgNDQsXG4gICAgNTQsICA1NSwgIDU0LCAgNTMsICA1NCwgIDU1LCAgNTQsICA0OSwgIDQ1LCAgNDMsICA0NCwgIDQ4LCAgNTQsXG4gICAgNTcsICA2MCwgIDU1LCAgNTEsICA0NiwgIDQ1LCAgNDQsICA0NiwgIDQ3LCAgNDgsICA1MSwgIDU1LCAgNTcsXG4gICAgNTcsICA1OSwgIDU2LCAgNTAsICA0MywgIDM5LCAgMzksICA0NCwgIDQ5LCAgNTIsICA1NSwgIDU3LCAgNTcsXG4gICAgNTMsICA1NCwgIDUyLCAgNDksICA0NCwgIDQwLCAgNDEsICA0NSwgIDUxLCAgNTUsICA1NywgIDU0LCAgNTQsXG4gICAgNDYsICA0NCwgIDQ1LCAgNDcsICA0NywgIDQ4LCAgNDgsICA1MSwgIDU1LCAgNTcsICA1NSwgIDUxLCAgNDcsXG4gICAgMzcsICAzNSwgIDM3LCAgNDUsICA1MiwgIDU3LCAgNjAsICA1OSwgIDU4LCAgNTYsICA1MiwgIDQ1LCAgMzksXG4gICAgMzEsICAyOSwgIDMzLCAgNDMsICA1NSwgIDY1LCAgNjksICA2NiwgIDYwLCAgNTUsICA0OCwgIDQwLCAgMzQsXG4gICAgMzIsICAzMCwgIDM1LCAgNDUsICA1NiwgIDY4LCAgNzIsICA2OSwgIDYwLCAgNTIsICA0MywgIDM2LCAgMzIsXG4gICAgMzMsICAzNiwgIDQzLCAgNTEsICA1OSwgIDY1LCAgNjgsICA2NSwgIDU3LCAgNDcsICAzOCwgIDM0LCAgMzEsXG4gIF07XG5cbiAgdmFyIHBlcnR1cmJTYXQzID0gW1xuICAgIDUxLCAgNjAsICA2NiwgIDY3LCAgNjIsICA1NiwgIDQ2LCAgNDAsICAzNCwgIDMxLCAgMzcsICA0NSwgIDUzLFxuICAgIDU5LCAgNjYsICA3MCwgIDY3LCAgNjAsICA1MSwgIDQwLCAgMzMsICAzMCwgIDMzLCAgNDAsICA1MCwgIDYwLFxuICAgIDYwLCAgNjUsICA2NywgIDY2LCAgNTksICA1MCwgIDM4LCAgMzEsICAzMCwgIDM1LCAgNDMsICA1MiwgIDU5LFxuICAgIDU4LCAgNTksICA2MCwgIDU5LCAgNTUsICA0OSwgIDQwLCAgMzYsICAzNiwgIDQzLCAgNTAsICA1NSwgIDU3LFxuICAgIDU1LCAgNTIsICA1MCwgIDUwLCAgNDksICA0NywgIDQ1LCAgNDUsICA0NSwgIDUwLCAgNTUsICA1NiwgIDU1LFxuICAgIDUzLCAgNDgsICA0NCwgIDQyLCAgNDMsICA0NiwgIDUwLCAgNTMsICA1NSwgIDU2LCAgNTcsICA1NSwgIDUzLFxuICAgIDUxLCAgNDcsICA0MSwgIDM4LCAgNDAsICA0NywgIDU1LCAgNTksICA2MSwgIDU5LCAgNTYsICA1MywgIDUxLFxuICAgIDQ4LCAgNDIsICA0NCwgIDQyLCAgNDQsICA0OCwgIDU1LCAgNTgsICA1OCwgIDU1LCAgNTEsICA1MCwgIDQ4LFxuICAgIDQ1LCAgNDksICA1MCwgIDUwLCAgNTAsICA1MSwgIDUzLCAgNTUsICA1NCwgIDUwLCAgNDUsICA0MywgIDQ1LFxuICAgIDQ2LCAgNTIsICA1OSwgIDYyLCAgNjEsICA1NiwgIDUzLCAgNTAsICA0NiwgIDQyLCAgMzksICAzOCwgIDQxLFxuICAgIDQ1LCAgNTQsICA2NSwgIDcxLCAgNzEsICA2MywgIDUzLCAgNDMsICAzOSwgIDM1LCAgMzQsICAzNSwgIDQyLFxuICAgIDQ4LCAgNTUsICA2NSwgIDcxLCAgNzAsICA2MywgIDUxLCAgNDAsICAzNCwgIDMxLCAgMzMsICAzOCwgIDQ0LFxuICAgIDUxLCAgNjAsICA2NiwgIDY4LCAgNjUsICA1OCwgIDQ2LCAgMzgsICAzMywgIDMyLCAgMzcsICA0NiwgIDU0LFxuICBdO1xuXG4gIHZhciBwZXJ0dXJiU2F0NCA9IFtcbiAgICA4MywgIDgyLCAgODAsICA3OCwgIDc1LCAgNzQsICA3MywgIDczLCAgNzUsICA3NywgIDc5LCAgODEsICA4MyxcbiAgICA4MSwgIDgyLCAgODIsICA4MSwgIDgwLCAgNzcsICA3NSwgIDcyLCAgNzIsICA3NSwgIDc3LCAgODAsICA4MSxcbiAgICA3NywgIDcwLCAgNzcsICA3NSwgIDc1LCAgNzUsICA3MCwgIDY3LCAgNjUsICA2NCwgIDY1LCAgNjgsICA3MCxcbiAgICA1MCwgIDUxLCAgNTQsICA1OCwgIDYwLCAgNjEsICA1OSwgIDU2LCAgNTIsICA0OSwgIDQ3LCAgNDcsICA0OSxcbiAgICAzMCwgIDMyLCAgMzQsICAzNywgIDQwLCAgNDIsICA0MiwgIDQwLCAgMzYsICAzMSwgIDMwLCAgMjksICAzMCxcbiAgICAxNywgIDE4LCAgMTksICAyMCwgIDIyLCAgMjQsICAyNywgIDI2LCAgMjEsICAxOSwgIDE3LCAgMTUsICAxNyxcbiAgICAxMywgIDEzLCAgMTIsICAxMiwgIDE0LCAgMTUsICAxNywgIDE4LCAgMTcsICAxNiwgIDE1LCAgMTQsICAxMyxcbiAgICAyMCwgIDE5LCAgMTgsICAxNywgIDE3LCAgMTgsICAyMCwgIDIxLCAgMjQsICAyNCwgIDIzLCAgMjEsICAyMCxcbiAgICAzMSwgIDMxLCAgMzIsICAzMiwgIDMxLCAgMzEsICAzMiwgIDM1LCAgMzcsICAzOCwgIDM2LCAgMzQsICAzMixcbiAgICA1MCwgIDUwLCAgNTMsICA1MywgIDUyLCAgNTEsICA1MSwgIDUyLCAgNTMsICA1MywgIDUyLCAgNTAsICA1MCxcbiAgICA2OCwgIDY5LCAgNzEsICA3MiwgIDcyLCAgNzAsICA2OSwgIDY4LCAgNjgsICA2OCwgIDcwLCAgNzAsICA2NyxcbiAgICA4MCwgIDgwLCAgNzksICA4MCwgIDgwLCAgNzksICA3NywgIDc2LCAgNzQsICA3NiwgIDc3LCAgODAsICA4MCxcbiAgICA4MywgIDgzLCAgODAsICA3OCwgIDc1LCAgNzUsICA3NiwgIDc2LCAgNzYsICA3NiwgIDc5LCAgODEsICA4MyxcbiAgXTtcblxuICAvKipcbiAgICogQ29ycmVjdGlvbiBmb3IgUGVydHVyYmF0aW9uXG4gICAqL1xuICB2YXIgcGVydHVyYmF0aW9uRWxlbWVudCA9IGZ1bmN0aW9uKGV0YSwgemV0YSwgdGJsKSB7XG4gICAgdmFyIGUxID0gZXRhLzMwLjA7XG4gICAgdmFyIGUyID0gZTEgKyAxO1xuICAgIHZhciB6MSA9IHpldGEvMzAuMDtcbiAgICB2YXIgejIgPSB6MSArIDE7XG4gICAgdmFyIHYxLCB2MiwgdjMsIHY0LCBwMSwgcDIsIHAzLCBwNDtcblxuICAgIGlmKGUxID49IDEyICYmIHoxID49IDEyKXtcbiAgICAgIHJldHVybiB0YmxbejEqMTMgKyBlMV07XG4gICAgfVxuXG4gICAgaWYoZTEgPj0gMTIpe1xuICAgICAgdjEgPSB0YmxbejEqMTMgKyBlMV07XG4gICAgICB2MyA9IHRibFt6MioxMyArIGUxXTtcbiAgICAgIHAzID0gdjEgKyAodjMgLSB2MSkqKHpldGEvMzAuMCAtIHoxKTtcbiAgICAgIHJldHVybiBwMztcbiAgICB9XG5cbiAgICBpZih6MSA+PSAxMil7XG4gICAgICB2MSA9IHRibFt6MSoxMyArIGUxXTtcbiAgICAgIHYyID0gdGJsW3oxKjEzICsgZTJdO1xuICAgICAgcDMgPSB2MSArICh2MiAtIHYxKSooZXRhLzMwLjAgLSBlMSk7XG4gICAgICByZXR1cm4gcDM7XG4gICAgfVxuXG4gICAgdjEgPSB0YmxbejEqMTMgKyBlMV07XG4gICAgdjIgPSB0YmxbejEqMTMgKyBlMl07XG4gICAgdjMgPSB0YmxbejIqMTMgKyBlMV07XG4gICAgdjQgPSB0YmxbejIqMTMgKyBlMl07XG4gICAgcDEgPSB2MSArICh2MyAtIHYxKSooemV0YS8zMC4wIC0gejEpO1xuICAgIHAyID0gdjIgKyAodjQgLSB2MikqKHpldGEvMzAuMCAtIHoxKTtcbiAgICBwMyA9IHAxICsgKHAyIC0gcDEpKihldGEvMzAuMCAtIGUxKTtcblxuICAgIHJldHVybiBwMztcbiAgfTtcblxuICAvKipcbiAgICogTWVhbiBvcmJpdGFsIGVsZW1lbnQgb2YgSnVwaXRlciB3aXRoIHBlcnR1cmJhdGlvblxuICAgKi9cbiAgdmFyIHBlcnR1cmJhdGlvbkp1cGl0ZXIgPSBmdW5jdGlvbihqZCkge1xuICAgIHZhciB5ZWFyID0gKGpkIC0gMTcyMTQyMy41KSAvIDM2NS4yNDQgKyAxLjA7XG4gICAgdmFyIFQgPSB5ZWFyLzEwMDAuMDtcblxuICAgIHZhciBMNyA9ICgwLjQyIC0gMC4wNzUqVCArIDAuMDE1KlQqVCAtIDAuMDAzKlQqVCpUKSAqXG4gICAgICAgIFVkTWF0aC51ZHNpbiggKFQgLSAwLjYyKSozNjAuMC8wLjkyNSApO1xuICAgIHZhciBQUzcgPSAwLjAyICogVWRNYXRoLnVkc2luKCAoVCArIDAuMSkqMzYwLjAvMC45MjUgKTtcbiAgICB2YXIgUEg3ID0gMC4wMyAqIFVkTWF0aC51ZHNpbiggKFQgKyAwLjM2KSozNjAuMC8wLjkyNSApO1xuICAgIHZhciBFVEEgPSBVZE1hdGguZGVnbWFsKDg2LjEgKyAwLjAzMzQ1OSAqICggamQgLSAxNzIxMDU3LjAgKSk7XG4gICAgdmFyIFpFVEEgPSBVZE1hdGguZGVnbWFsKDg5LjEgKyAwLjA0OTYzMCAqICggamQgLSAxNzIxMDU3LjAgKSk7XG4gICAgdmFyIEw4ID0gcGVydHVyYmF0aW9uRWxlbWVudChFVEEsIFpFVEEsIHBlcnR1cmJKdXAxKS8xMDAwLjA7XG4gICAgdmFyIFBTOCA9IHBlcnR1cmJhdGlvbkVsZW1lbnQoRVRBLCBaRVRBLCBwZXJ0dXJiSnVwMikvMTAwMC4wO1xuICAgIHZhciBQSDggPSBwZXJ0dXJiYXRpb25FbGVtZW50KEVUQSwgWkVUQSwgcGVydHVyYkp1cDMpLzEwMDAuMDtcbiAgICB2YXIgUEggID0gMi41OCArIDAuMSpUO1xuXG4gICAgaWYgKFBIID4gMy41KSBQSCA9IDMuNTtcbiAgICBpZiAoUEggPCAxLjUpIFBIID0gMS41O1xuXG4gICAgbCArPSAoIEw3ICsgTDggKTtcbiAgICBwZXJpICs9IChQUzcgKyBQUzgpIC8gVWRNYXRoLnVkc2luKFBIKTtcbiAgICBlID0gVWRNYXRoLnVkc2luKFBIICsgUEg3ICsgUEg4KTtcbiAgfTtcblxuICAvKipcbiAgICogTWVhbiBvcmJpdGFsIGVsZW1lbnQgb2YgU2F0dXJuIHdpdGggcGVydHVyYmF0aW9uXG4gICAqL1xuICB2YXIgcGVydHVyYmF0aW9uU2F0dXJuID0gZnVuY3Rpb24oamQpIHtcbiAgICB2YXIgeWVhciA9IChqZCAtIDE3MjE0MjMuNSkgLyAzNjUuMjQ0ICsgMS4wO1xuICAgIHZhciBUID0geWVhci8xMDAwLjA7XG5cbiAgICB2YXIgQVQgPSAwLjg4IC0gMC4wNjMzKlQgKyAwLjAzKlQqVCAtIDAuMDAwNipUKlQqVDtcbiAgICB2YXIgTDcgPSAtMC41MCArIEFUKlVkTWF0aC51ZHNpbigoVCAtIDAuMTQ1KSozNjAuMC8wLjk1KTtcbiAgICB2YXIgUFM3ID0gLTAuNTAgKyAoMC4xMCAtIDAuMDA1KlQpICogVWRNYXRoLnVkc2luKChUIC0gMC41NCkqMzYwLjAvMC45NSk7XG4gICAgdmFyIFBINyA9IC0wLjUwICsgKDAuMTAgLSAwLjAwNSpUKSAqIFVkTWF0aC51ZHNpbigoVCAtIDAuMzIpKjM2MC4wLzAuOTUpO1xuICAgIHZhciBBWDcgPSAtMC4wNTAgKyAoMC4wMDQgLSAwLjAwMDUqVCkgKiBVZE1hdGgudWRzaW4oKFQgLSAwLjM1KSozNjAuMC8wLjk1KTtcbiAgICB2YXIgRVRBID0gVWRNYXRoLmRlZ21hbCg4Ni4xICsgMC4wMzM0NTkgKiAoIGpkIC0gMTcyMTA1Ny4wICkpO1xuICAgIHZhciBaRVRBID0gVWRNYXRoLmRlZ21hbCg4OS4xICsgMC4wNDk2MzAgKiAoIGpkIC0gMTcyMTA1Ny4wICkpO1xuICAgIHZhciBMOCA9IHBlcnR1cmJhdGlvbkVsZW1lbnQoRVRBLCBaRVRBLCBwZXJ0dXJiU2F0MSkvMTAwLjA7XG4gICAgdmFyIFBTOCA9IHBlcnR1cmJhdGlvbkVsZW1lbnQoRVRBLCBaRVRBLCBwZXJ0dXJiU2F0MikvMTAwLjA7XG4gICAgdmFyIFBIOCA9IHBlcnR1cmJhdGlvbkVsZW1lbnQoRVRBLCBaRVRBLCBwZXJ0dXJiU2F0MykvMTAwLjA7XG4gICAgdmFyIEFYOCA9IHBlcnR1cmJhdGlvbkVsZW1lbnQoRVRBLCBaRVRBLCBwZXJ0dXJiU2F0NCkvMTAwMC4wO1xuICAgIHZhciBQSCAgPSAzLjU2IC0gMC4xNzUqVCAtIDAuMDA1KlQqVDtcblxuICAgIC8qIGlmIHllYXIgPiA3MDAwIHRoZW4gUEggPCAyLjAgKi9cbiAgICBpZiAoUEggPCAyLjApIFBIID0gMi4wO1xuXG4gICAgbCArPSAoIEw3ICsgTDggKTtcbiAgICBwZXJpICs9IChQUzcgKyBQUzgpIC8gVWRNYXRoLnVkc2luKFBIKTtcbiAgICBlID0gVWRNYXRoLnVkc2luKFBIICsgUEg3ICsgUEg4KTtcbiAgICBheGlzICs9IEFYNyArIEFYODtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IG1lYW4gb3JiaXRhbCBlbGVtZW50cyAoTWVyY3VyeSwgVmVudXMsIE1hcnMsIEp1cGl0ZXIsIFNhdHVybilcbiAgICovXG4gIHZhciBnZXRQbGFuZXRFbG0xID0gZnVuY3Rpb24ocGxhbmV0Tm8sIGpkKSB7XG4gICAgdmFyIEMxID0gKGpkIC0gQXN0cm8uSkQxOTAwKSAvIDM2NTI1LjA7XG4gICAgdmFyIEMyID0gQzEgKiBDMTtcbiAgICB2YXIgZWxtQ2Y7XG4gICAgc3dpdGNoIChwbGFuZXRObykge1xuICAgICAgY2FzZSBQbGFuZXRzLk1lcmN1cnk6XG4gICAgICAgIGVsbUNmID0gTWVyY3VyeUU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQbGFuZXRzLlZlbnVzOlxuICAgICAgICBlbG1DZiA9IFZlbnVzRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuTWFyczpcbiAgICAgICAgZWxtQ2YgPSBNYXJzRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuSnVwaXRlcjpcbiAgICAgICAgZWxtQ2YgPSBKdXBpdGVyRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuU2F0dXJuOlxuICAgICAgICBlbG1DZiA9IFNhdHVybkU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICB9XG4gICAgLyogTStwZXJpK25vZGUgKi9cbiAgICBsID0gVWRNYXRoLmRlZ21hbChlbG1DZi5sICsgZWxtQ2YuTDEgKiBDMSArXG4gICAgICAgICAgICAgICBlbG1DZi5MMiAqIEMyICsgZWxtQ2YuTDMgKiBDMSAqIEMyKTtcbiAgICAvKiBBc2NlbmRpbmcgTm9kZSAqL1xuICAgIG5vZGUgPSBVZE1hdGguZGVnbWFsKGVsbUNmLm5vZGUgKyBlbG1DZi5uMSAqIEMxICtcbiAgICAgICAgICAgICAgIGVsbUNmLm4yICogQzIgKyBlbG1DZi5uMyAqIEMxICogQzIpO1xuICAgIC8qIEFyZ3VtZW50IG9mIFBlcmloZWxpb24gKi9cbiAgICBwZXJpID0gVWRNYXRoLmRlZ21hbChlbG1DZi5wZXJpICsgZWxtQ2YucDEgKiBDMSArXG4gICAgICAgICAgICAgICBlbG1DZi5wMiAqIEMyICsgZWxtQ2YucDMgKiBDMSAqIEMyIC0gbm9kZSk7XG4gICAgLyogU2VtaW1ham9yIEF4aXMgKi9cbiAgICBheGlzID0gZWxtQ2YuYXhpcztcbiAgICAvKiBFY2NlbnRyaWNpdHkgKi9cbiAgICBlICAgID0gVWRNYXRoLmRlZ21hbChlbG1DZi5lICsgZWxtQ2YuZTEgKiBDMSArXG4gICAgICAgICAgICAgICBlbG1DZi5lMiAqIEMyICsgZWxtQ2YuZTMgKiBDMSAqIEMyICk7XG4gICAgLyogSW5jbGluYXRpb24gKi9cbiAgICBpbmNsID0gVWRNYXRoLmRlZ21hbChlbG1DZi5pbmNsICsgZWxtQ2YuaTEgKiBDMSArXG4gICAgICAgICAgICAgICBlbG1DZi5pMiAqIEMyICsgZWxtQ2YuaTMgKiBDMSAqIEMyKTtcblxuICAgIHN3aXRjaCAocGxhbmV0Tm8pIHtcbiAgICAgIGNhc2UgUGxhbmV0cy5KdXBpdGVyOlxuICAgICAgICBwZXJ0dXJiYXRpb25KdXBpdGVyKGpkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuU2F0dXJuOlxuICAgICAgICBwZXJ0dXJiYXRpb25TYXR1cm4oamQpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCBtZWFuIG9yYml0YWwgZWxlbWVudHMgKFVyYW51cywgTmVwdHVuZSwgUGx1dG8pXG4gICAqL1xuICB2YXIgZ2V0UGxhbmV0RWxtMiA9IGZ1bmN0aW9uKHBsYW5ldE5vLCBqZCkge1xuICAgIHZhciBUMSA9ICggamQgLSBBc3Ryby5KRDIwMDAgKSAvIDM2NTI1LjA7XG4gICAgdmFyIFQyID0gVDEgKiBUMTtcbiAgICB2YXIgZCAgPSBUMSAqIDM2NTI1LjA7XG4gICAgdmFyIGVsbUNmID0gbnVsbDtcbiAgICBzd2l0Y2ggKHBsYW5ldE5vKSB7XG4gICAgICBjYXNlIFBsYW5ldHMuVXJhbnVzOlxuICAgICAgICBlbG1DZiA9IFVyYW51c0U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQbGFuZXRzLk5lcHR1bmU6XG4gICAgICAgIGVsbUNmID0gTmVwdHVuZUU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgXCJBcml0aG1ldGljIEV4Y2VwdGlvblwiO1xuICAgIH1cbiAgICAvKiBNK3Blcmkrbm9kZSAqL1xuICAgIGwgICAgPSAgVWRNYXRoLmRlZ21hbChlbG1DZi5sICsgZWxtQ2YuTDEgKiBkICsgZWxtQ2YuTDIgKlQyKTtcbiAgICAvKiBBc2NlbmRpbmcgTm9kZSAqL1xuICAgIG5vZGUgPSAgVWRNYXRoLmRlZ21hbChlbG1DZi5ub2RlICsgZWxtQ2YubjEgKiBUMSArIGVsbUNmLm4yICpUMik7XG4gICAgLyogQXJndW1lbnQgb2YgUGVyaWhlbGlvbiAqL1xuICAgIHBlcmkgPSAgVWRNYXRoLmRlZ21hbChlbG1DZi5wZXJpICsgZWxtQ2YucDEgKiBUMSArIGVsbUNmLnAyICpUMiAtIG5vZGUpO1xuICAgIC8qIFNlbWltYWpvciBBeGlzICovXG4gICAgYXhpcyA9IFVkTWF0aC5kZWdtYWwoZWxtQ2YuYXhpcyArIGVsbUNmLmExICogVDEgKyBlbG1DZi5hMiAqVDIpO1xuICAgIC8qIEVjY2VudHJpY2l0eSAqL1xuICAgIGUgICAgPSAgVWRNYXRoLmRlZ21hbChlbG1DZi5lICsgZWxtQ2YuZTEgKiBUMSArIGVsbUNmLmUyICpUMik7XG4gICAgLyogSW5jbGluYXRpb24gKi9cbiAgICBpbmNsID0gIFVkTWF0aC5kZWdtYWwoZWxtQ2YuaW5jbCArIGVsbUNmLmkxICogVDEgKyBlbG1DZi5pMiAqVDIpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgbWVhbiBvcmJpdGFsIGVsZW1lbnRzIChFYXJ0aClcbiAgICovXG4gIHZhciBnZXRQbGFuZXRFbG1FYXJ0aCA9IGZ1bmN0aW9uKGpkKSB7XG4gICAgdmFyIGMgPSAoamQgLSBBc3Ryby5KRDE5MDApLzM2NTI1LjA7XG4gICAgdmFyIGMyID0gYyAqIGM7XG4gICAgbCA9IDE4MC4wICsgVWRNYXRoLmRlZ21hbCgyODAuNjgyNCArIDM2MDAwLjc2OTMyNSpjICsgNy4yMjIyMmUtNCpjMik7XG4gICAgcGVyaSA9IDE4MC4wICsgVWRNYXRoLmRlZ21hbCgyODEuMjIwNiArXG4gICAgICAxLjcxNzY5NypjICsgNC44MzMzM2UtNCpjMiArIDIuNzc3NzdlLTYqYypjMik7XG4gICAgbm9kZSA9IDAuMDsgLyogbm8gYXNjZW5kaW5nIG5vZGUgZm9yIHRoZSBFYXJ0aCAqL1xuICAgIGluY2wgPSAwLjA7IC8qIG5vIGluY2xpbmF0aW9uIGZvciB0aGUgRWFydGggKi9cbiAgICBlID0gMC4wMTY3NDk4IC0gNC4yNThlLTUqYyAtIDEuMzdlLTcqYzI7XG4gICAgYXhpcyA9IDEuMDAwMDAxMjk7XG4gIH07XG5cbiAgdGhpcy5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZSA9IHRoaXMuZSAqIDE4MC4wIC8gTWF0aC5QSTtcbiAgICB2YXIgRSwgTSwgb2xkRTtcbiAgICBFID0gTSA9IHRoaXMubCAtICh0aGlzLnBlcmkgKyB0aGlzLm5vZGUpO1xuICAgIGRvIHtcbiAgICAgIG9sZEUgPSBFO1xuICAgICAgRSA9IE0gKyByZSAqIFVkTWF0aC51ZHNpbihvbGRFKTtcbiAgICB9IHdoaWxlIChNYXRoLmFicyhFIC0gb2xkRSkgPiAxLjBlLTUgKiAxODAuMCAvIE1hdGguUEkpO1xuICAgIHZhciBweCA9IHRoaXMuYXhpcyAqIChVZE1hdGgudWRjb3MoRSkgLSB0aGlzLmUpO1xuICAgIHZhciBweSA9IHRoaXMuYXhpcyAqIE1hdGguc3FydCgxLjAgLSB0aGlzLmUgKiB0aGlzLmUpICpcbiAgICAgICAgVWRNYXRoLnVkc2luKEUpO1xuXG4gICAgdmFyIHNpbnBlcmkgPSBVZE1hdGgudWRzaW4odGhpcy5wZXJpKTtcbiAgICB2YXIgY29zcGVyaSA9IFVkTWF0aC51ZGNvcyh0aGlzLnBlcmkpO1xuICAgIHZhciBzaW5ub2RlID0gVWRNYXRoLnVkc2luKHRoaXMubm9kZSk7XG4gICAgdmFyIGNvc25vZGUgPSBVZE1hdGgudWRjb3ModGhpcy5ub2RlKTtcbiAgICB2YXIgc2luaW5jbCA9IFVkTWF0aC51ZHNpbih0aGlzLmluY2wpO1xuICAgIHZhciBjb3NpbmNsID0gVWRNYXRoLnVkY29zKHRoaXMuaW5jbCk7XG5cbiAgICB2YXIgeGMgPSAgcHggKiAoY29zbm9kZSAqIGNvc3BlcmkgLSBzaW5ub2RlICogY29zaW5jbCAqIHNpbnBlcmkpIC1cbiAgICAgICAgcHkgKiAoY29zbm9kZSAqIHNpbnBlcmkgKyBzaW5ub2RlICogY29zaW5jbCAqIGNvc3BlcmkpO1xuICAgIHZhciB5YyA9ICBweCAqIChzaW5ub2RlICogY29zcGVyaSArIGNvc25vZGUgKiBjb3NpbmNsICogc2lucGVyaSkgLVxuICAgICAgICBweSAqIChzaW5ub2RlICogc2lucGVyaSAtIGNvc25vZGUgKiBjb3NpbmNsICogY29zcGVyaSk7XG4gICAgdmFyIHpjID0gIHB4ICogKHNpbmluY2wgKiBzaW5wZXJpKSArIHB5ICogKHNpbmluY2wgKiBjb3NwZXJpKTtcblxuICAgIHJldHVybiBuZXcgWHl6KHhjLCB5YywgemMpO1xuICB9O1xuXG4gIGluaXQoKTtcblxufTtcblxuZnVuY3Rpb24gUGxhbmV0RWxtUDEoXG4gICAgICBsLCAgICBMMSwgTDIsIEwzLFxuICAgICAgcGVyaSwgcDEsIHAyLCBwMyxcbiAgICAgIG5vZGUsIG4xLCBuMiwgbjMsXG4gICAgICBpbmNsLCBpMSwgaTIsIGkzLFxuICAgICAgZSwgICAgZTEsIGUyLCBlMyxcbiAgICAgIGF4aXMpIHtcbiAgdGhpcy5sICAgID0gbDsgICAgdGhpcy5MMSA9IEwxOyB0aGlzLkwyID0gTDI7IHRoaXMuTDMgPSBMMztcbiAgdGhpcy5wZXJpID0gcGVyaTsgdGhpcy5wMSA9IHAxOyB0aGlzLnAyID0gcDI7IHRoaXMucDMgPSBwMztcbiAgdGhpcy5ub2RlID0gbm9kZTsgdGhpcy5uMSA9IG4xOyB0aGlzLm4yID0gbjI7IHRoaXMubjMgPSBuMztcbiAgdGhpcy5pbmNsID0gaW5jbDsgdGhpcy5pMSA9IGkxOyB0aGlzLmkyID0gaTI7IHRoaXMuaTMgPSBpMztcbiAgdGhpcy5lICAgID0gZTsgICAgdGhpcy5lMSA9IGUxOyB0aGlzLmUyID0gZTI7IHRoaXMuZTMgPSBlMztcbiAgdGhpcy5heGlzID0gYXhpcztcbn1cblxuZnVuY3Rpb24gUGxhbmV0RWxtUDIoXG4gICAgICAgICAgbCwgICAgTDEsIEwyLFxuICAgICAgICAgIHBlcmksIHAxLCBwMixcbiAgICAgICAgICBub2RlLCBuMSwgbjIsXG4gICAgICAgICAgYXhpcywgYTEsIGEyLFxuICAgICAgICAgIGUsICAgIGUxLCBlMixcbiAgICAgICAgICBpbmNsLCBpMSwgaTIpIHtcbiAgdGhpcy5sID0gbDsgICAgICAgdGhpcy5MMSA9IEwxOyB0aGlzLkwyID0gTDI7XG4gIHRoaXMucGVyaSA9IHBlcmk7IHRoaXMucDEgPSBwMTsgdGhpcy5wMiA9IHAyO1xuICB0aGlzLm5vZGUgPSBub2RlOyB0aGlzLm4xID0gbjE7IHRoaXMubjIgPSBuMjtcbiAgdGhpcy5heGlzID0gYXhpczsgdGhpcy5hMSA9IGExOyB0aGlzLmEyID0gYTI7XG4gIHRoaXMuZSA9IGU7ICAgICAgIHRoaXMuZTEgPSBlMTsgdGhpcy5lMiA9IGUyO1xuICB0aGlzLmluY2wgPSBpbmNsOyB0aGlzLmkxID0gaTE7IHRoaXMuaTIgPSBpMjtcbn1cbiIsInZhciBYeXogICAgPSByZXF1aXJlKCcuL3h5eicpO1xudmFyIFVkTWF0aCA9IHJlcXVpcmUoJy4vdWRtYXRoJyk7XG52YXIgUGxhbmV0cyA9IHJlcXVpcmUoJy4vcGxhbmV0Jyk7XG5cbi8qKlxuICogUGxhbmV0IFBvc2l0aW9uIGJ5IEV4cGFuc2lvblxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcblxuICAvL1xuICAvLyBNZXJjdXJ5XG4gIC8vXG4gIHZhciBNZXJjdXJ5TGFtYmRhID0gW1xuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjUyNTgsIDQ0ODQxNy41NSwgIDc0LjM4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4xNzk2LCAyOTg5NDUuNzcsIDEzNy44NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMTA2MSwgNTk3ODkwLjEwLCAgMjQ5LjIpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjA4NTAsICAxNDk0NzMuMywgIDE0My4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wNzYwLCAgNDQ4NDE4LjMsICAzMTIuNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDI1NiwgIDU5Nzg5MC44LCAgMTI3LjQpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAyMzAsICA3NDczNjIuNiwgICA2NC4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDgxLCAgNzQ3MzYzLjAsICAzMDIuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA2OSwgICAgICAgMS4wLCAgMTQ4LjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwNTIsICA4OTY4MzUuMCwgIDIzOS4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDIzLCAgODk2ODM2LjAsICAxMTcuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAxOSwgICAgNjM1Ni4wLCAgIDg1LjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMTEsIDEwNDYzMDguMCwgICA1NC4wKVxuICBdO1xuXG4gIHZhciBNZXJjdXJ5QmV0YSA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4zMTIzLCAgNDQ4NDE3LjkyLCAxMDMuNTEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjA3NTMsICAgNTk3ODkwLjQsICAyNzguMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDM2NywgICAxNDk0NzIuMSwgICA1NS43KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMTg3LCAgIDc0NzM2Mi45LCAgIDkzLjEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwNTAsICAgMjk4OTQ1LjAsICAyMzAuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA0NywgICA4OTY4MzUuMCwgIDI2OC4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDI4LCAgIDQ0ODQxOS4wLCAgMzQyLjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMjMsICAgMjk4OTQ2LjAsICAzNDcuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAyMCwgICA1OTc4OTEuMCwgIDE1Ny4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDEyLCAgMTA0NjMwOC4wLCAgIDgzLjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDksICAgNzQ3MzY0LjAsICAzMzEuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwOSwgICA0NDg3MTcuMCwgICA0NS4wKVxuICBdO1xuXG4gIHZhciBNZXJjdXJ5UiA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDEyMTQsIDQ0ODQxNy41NSwgMzQ0LjM4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAyMTgsICA1OTc4OTAuMSwgMTU5LjIwKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwNDIsICA3NDczNjMuMCwgIDMzNC4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDYsICA4OTY4MzUuMCwgIDE0OS4wKVxuICBdO1xuXG4gIC8vXG4gIC8vIFZlbnVzXG4gIC8vXG4gIHZhciBWZW51c0wwID0gW1xuICAgIG5ldyBQbGFuZXRFeHBQMCgtMC4wMDQ4LCAyNDguNiwgLTE5LjM0KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoLTAuMDAwNCwgMTk4LjAsICA3MjAuMClcbiAgXTtcblxuICB2YXIgVmVudXNMMSA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDMzLCAzNTcuOSwgMTE3MC4zNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAzMSwgMjQyLjMsICA0NTAuMzcpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMjAsIDI3My41LCAgNjc1LjU1KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDE0LCAgMzEuMSwgIDIyNS4xOClcbiAgXTtcblxuICB2YXIgVmVudXNRID0gW1xuICAgIG5ldyBQbGFuZXRFeHBQMCgtMC4wMDAwMTUsIDM1Ny45LCAxMTcwLjM1KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMDEwLCAgNjIuMywgIDQ1MC4zNyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwMDAwOCwgIDkzLjAsICAgNjc1LjYpXG4gIF07XG5cbiAgdmFyIFZlbnVzUCA9IG5ldyBQbGFuZXRFeHBQMShcbiAgICAgMzEwLjE3MzUsICA1ODUuMTkyMTIsXG4gICAgICAtMC4wNTAzLCAgICAgMTA3LjQ0LCAxMTcwLjM3LFxuICAgICAgIDAuNzc3NSwgICAtMC4wMDAwNSwgMTc4Ljk1NCwgNTg1LjE3OCxcbiAgICAgIDAuMDU5MjIsICAgICAyMzMuNzIsIDU4NS4xODMsXG4gICAgLTAuMDAyOTQ3LCAwLjAwMDAwMDIxLCAxNzguOTU0LCA1ODUuMTc4LCAtMC4xNDA2NThcbiAgKTtcblxuICAvL1xuICAvLyBNYXJzXG4gIC8vXG4gIHZhciBNYXJzTDAgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwNDgsIDI0OC42LCAtMTkuMzQpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgtMC4wMDA0LCAxOTguMCwgIDcyMC4wKVxuICBdO1xuXG4gIHZhciBNYXJzTDEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuNjIyNSwgMTg3LjU0LCAzODIuNzk3KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wNTAzLCAxMDEuMzEsIDU3NC4xOTYpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAxNDYsICA2Mi4zMSwgICAwLjE5OCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA3MSwgICA3MS44LCAgMTYxLjA1KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDYxLCAgMjMwLjIsICAxMzAuNzEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwNDYsICAgMTUuMSwgIDc2NS41OSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA0NSwgIDE0Ny41LCAgMzIyLjExKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDM5LCAgMjc5LjMsICAtMjIuODEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMjQsICAyMDcuNywgIDE2OC41OSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAyMCwgIDE0MC4xLCAgMTQ1Ljc4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDE4LCAgMjI0LjcsICAgMTAuOTgpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMTQsICAyMjEuOCwgIC00NS42MiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAxMCwgICA5MS40LCAgLTMwLjM0KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDA5LCAgICAyNjgsICAgMTAwLjQpXG4gIF07XG5cbiAgdmFyIE1hcnNRID0gW1xuICAgIG5ldyBQbGFuZXRFeHBQMCgtMC4wMDI4MjUsIDE4Ny41NCwgMzgyLjc5NyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwMDI0OSwgMTAxLjMxLCA1NzQuMTk2KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoLTAuMDAwMDI0LCAgIDE1LjEsICA3NjUuNTkpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDAwMjMsICAyNTEuNywgIDE2MS4wNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDAyMiwgIDMyNy42LCAgMzIyLjExKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMDE3LCAgIDUwLjIsICAxMzAuNzEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDAwMDcsICAgMjcuMCwgICAxNjguNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDAwNiwgIDMyMC4wLCAgIDE0NS44KVxuICBdO1xuXG4gIHZhciBNYXJzUCA9IG5ldyBQbGFuZXRFeHBQMShcbiAgICAgMjQ5LjM1NDIsICAgMTkxLjQxNjk2LFxuICAgICAgLTAuMDE0OSwgICAgICAgNDAuMDEsIDM4Mi44MTksXG4gICAgICAxMC42ODg2LCAgICAgMC4wMDAxMCwgMjczLjc2OCwgMTkxLjM5OSxcbiAgICAgIDAuMDMyMjcsICAgICAgMjAwLjAwLCAxOTEuNDA5LFxuICAgIC0wLjA0MDQyMSwgLTAuMDAwMDAwMzksIDI3My43NjgsIDE5MS4zOTksIDAuMTgzODQ0XG4gICk7XG5cbiAgLy9cbiAgLy8gSnVwaXRlclxuICAvL1xuICB2YXIgSnVwaXRlck4gPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjMzMjMsIDE2Mi43OCwgICAwLjM4NSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjA1NDEsICAzOC40NiwgLTM2LjI1NiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjA0NDcsIDI5My40MiwgLTI5Ljk0MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAzNDIsICA0NC41MCwgIC01LjkwNyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAyMzAsIDIwMS4yNSwgLTI0LjAzNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAyMjIsIDEwOS45OSwgLTE4LjEyOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwNDgsICAyNDguNiwgIC0xOS4zNCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNDcsICAxODQuNiwgIC0xMS44MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNDUsICAxNTAuMSwgIC01NC4zOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNDIsICAxMzAuNywgIC00Mi4xNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMzksICAgIDcuNiwgICAgNi4zMSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMzEsICAxNjMuMiwgICAxMi4yMiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMzEsICAxNDUuNiwgICAgMC43NyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMjQsICAxOTEuMywgICAtMC4yMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTksICAxNDguNCwgICAyNC40NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTcsICAxOTcuOSwgLTI5Ljk0MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTAsICAzMDcuOSwgICAzNi42NiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTAsICAyNTIuNiwgIC03Mi41MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTAsICAyNjkuMCwgIC02MC4yOSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTAsICAyNzguNywgIC0yOS41MyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDgsICAgNTIuMCwgICAtNjYuNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDgsICAgMjQuMCwgICAtMzUuOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDUsICAzNTYuMCwgICAgLTUuNSlcbiAgXTtcblxuICB2YXIgSnVwaXRlckIgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAxMCwgMjkxLjksIC0yOS45NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMywgMTk2LjAsICAtMjQuMClcbiAgXTtcblxuICB2YXIgSnVwaXRlclEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMjMwLCAgMzguNDcsIC0zNi4yNTYpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDE2OCwgMjkzLjM2LCAtMjkuOTQxKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwNzQsIDIwMC41MCwgIC0yNC4wMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDU1LCAgMTEwLjAsICAtMTguMTMpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAzOCwgICAzOS4zLCAgIC01LjkxKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMjQsICAxNTAuOSwgIC01NC4zOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDIzLCAgMzM2LjQsICAgIDAuNDEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAxOSwgIDEzMS43LCAgLTQyLjE2KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDksICAxODAuMCwgICAtMTEuOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDA3LCAgMjc3LjAsICAgLTYwLjMpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAwNiwgIDMzMC4wLCAgICAyNC40KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDYsICAgNTMuMCwgICAtNjYuNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDA2LCAgMTg4LjAsICAgICA2LjMpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAwNiwgIDI1MS4wLCAgIC03Mi41KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDYsICAxOTguMCwgICAtMjkuOSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDA1LCAgMzUzLjUsICAgMTIuMjIpXG4gIF07XG5cbiAgdmFyIEp1cGl0ZXJQID0gbmV3IFBsYW5ldEV4cFAyKFxuICAgICAxMy42NTI2LCAwLjAxMzk2LFxuICAgICAgMC4wMDc1LCAgICA1Ljk0LFxuICAgICAgNS41MjgwLCAgMC4xNjY2LCAwLjAwNzAsIDAuMDAwMyxcbiAgICAwLjAyMjg4OSwgMjcyLjk3NSwgMC4wMTI4LCAwLjAwMDEwLCAzNS41MixcbiAgICA1LjE5MDY4OCwgMC4wNDgyNTRcbiAgKTtcblxuICAvL1xuICAvLyBTYXR1cm5cbiAgLy9cbiAgdmFyIFNhdHVybk4gPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjgwODEsIDM0Mi43NCwgICAwLjM4NSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjE5MDAsICAgMy41NywgLTExLjgxMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjExNzMsIDIyNC41MiwgIC01LjkwNyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwOTMsICAxNzYuNiwgICAgNi4zMSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwODksICAyMTguNSwgIC0zNi4yNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwODAsICAgMTAuNCwgICAtMC4yMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNzgsICAgNTYuOCwgICAgMC42MyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNzQsICAzMjUuNCwgICAgMC43NyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNzMsICAyMDkuNCwgIC0yNC4wMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwNjQsICAyMDIuMCwgIC0xMS41OSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwNDgsICAyNDguNiwgIC0xOS4zNCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMzQsICAxMDUuMiwgIC0zMC4zNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMzQsICAgMjMuNiwgIC0xNS44NyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMjUsICAzNDguNCwgIC0xMS40MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMjIsICAxMDIuNSwgICAtNy45NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMjEsICAgNTMuNSwgICAtMy42NSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMjAsICAyMjAuNCwgIC0xOC4xMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTgsICAzMjYuNywgIC01NC4zOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTcsICAxNzMuMCwgICAtNS41MCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTQsICAxNjUuNSwgICAtNS45MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTMsICAzMDcuOSwgIC00Mi4xNilcbiAgXTtcblxuICB2YXIgU2F0dXJuQiA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDI0LCAgIDMuOSwgLTExLjgxKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDA4LCAyNjkuMCwgICAtNS45KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDA1LCAxMzUuMCwgIC0zMC4zKVxuICBdO1xuXG4gIHZhciBTYXR1cm5RID0gW1xuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDcwMSwgICAzLjQzLCAtMTEuODEzKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAzNzgsIDExMC41NCwgLTE4LjEyOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMjQ0LCAyMTkuMTMsICAtNS45MDcpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDExNCwgMTU4LjIyLCAgIDAuMzgzKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwNjQsICAyMTguMSwgIC0zNi4yNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDQyLCAgMjE1LjgsICAtMjQuMDMpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAyNCwgIDIwMS44LCAgLTExLjU5KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMjQsICAgIDEuMywgICAgNi4zMSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDE5LCAgMzA3LjcsICAgMTIuMjIpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAxNSwgIDMyNi4zLCAgLTU0LjM4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMTAsICAzMTEuMSwgIC00Mi4xNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDEwLCAgIDgzLjIsICAgMjQuNDQpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAwOSwgIDM0OC4wLCAgIC0xMS40KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDgsICAxMjkuMCwgICAtMzAuMyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDA2LCAgMjk1LjAsICAgLTI5LjkpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAwNiwgIDE0OC4wLCAgIC00OC41KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAwMDYsICAxMDMuMCwgICAgLTcuOSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMDA1LCAgMzE4LjAsICAgIDI0LjQpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDAwNSwgICAyNC4wLCAgIC0xNS45KVxuICBdO1xuXG4gIHZhciBTYXR1cm5QID0gbmV3IFBsYW5ldEV4cFAyKFxuICAgICA5MS44NTYwLCAgMC4wMTM5NixcbiAgICAgIDAuMDI3MiwgICAxMzUuNTMsXG4gICAgICA2LjQyMTUsICAgMC4yMjQ4LCAwLjAxMDksIDAuMDAwNixcbiAgICAwLjA0MzUxOSwgIDMzNy43NjMsIDAuMDI4NiwgMC4wMDAyMywgNzcuMDYsXG4gICAgOS41MDg4NjMsIDAuMDU2MDYxXG4gICk7XG5cbiAgLy9cbiAgLy8gVXJhbnVzXG4gIC8vXG4gIHZhciBVcmFudXNMYW1iZGEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDUuMzU4NTcsIDQ2MC42MTk4NywgNDguODUwMzEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjU4OTY0LCAgOTE5LjA0MjksIDE4OC4zMjQ1KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4xMjM5NywgMTA2NS4xMTkyLCAzNTQuNTkzNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDE0NzUsICAyNjA4LjcwMiwgIDM1MS4wMjgpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDkwLCAgICAxOTY4LjMsICAgIDI0Ny43KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAzNiwgICAgNTY0Ny40LCAgICAgMTAuNCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMTcsICAgIDIzNTYuNiwgICAgMTgzLjYpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDE3LCAgICAyODczLjIsICAgIDMyMS45KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAxNCwgICAgMzE1Ny45LCAgICAzMDguMSlcbiAgXTtcblxuICB2YXIgVXJhbnVzQmV0YSA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMS4xNTQ4MywgNDE5LjkxNzM5LCAxMjguMTUzMDMpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjY3NzU2LCAgNjUyLjk1MDQsICAyNzMuNjY0NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMTM0OTAsICA5OTguMDMwMiwgICA4My4zNTE3KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAyNSwgICAgMzAzMC45LCAgICAgMTk0LjIpXG4gIF07XG5cbiAgdmFyIFVyYW51c1IgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuOTA1NzkwLCA0MDguNzI5LCAzMjAuMzEzKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wNjI3MTAsICA3OTkuOTUsICAgNjcuOTkpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwNDg5NywgIDI2MTMuNywgICAgODAuNCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwNjU2LCAgMTUyNy4wLCAgIDIwMi4wKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAyMjMsICAyMTIwLjAsICAgMzIxLjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDIwNSwgIDMxMDQuMCwgICAgMzcuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMTIwLCAgNTY1Mi4wLCAgIDEwMC4wKVxuICBdO1xuXG4gIC8vXG4gIC8vIE5lcHR1bmVcbiAgLy9cbiAgdmFyIE5lcHR1bmVMYW1iZGEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuOTc0NTAsIDIyMS4zOTA0LCAxNjcuNzI2OSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDEzNDQsICA5ODYuMjgxLCAgIDUwLjgyNiksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA5NDUsICAyODE1Ljg5LCAgICAgMC4wOSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAyMzUsICAyMjY2LjUwLCAgIDMwOS4zNSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAyMjUsICAyMjc5LjQzLCAgIDEyNy42MSksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMjMsICAgNTg1MS42LCAgICAgMTkuMilcbiAgXTtcblxuICB2YXIgTmVwdHVuZUJldGEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKDEuNzY5NTgsIDIxOC44NzkwNiwgODMuMTEwMTgpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAxMzY2LCAgIDQ0Ny4xMjgsICAzMzguODY0KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDAxNSwgICAgMTEwNy4xLCAgICAyMjQuNyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMTUsICAgIDI1OTYuNywgICAgMTg3LjUpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMDEyLCAgICAzMDM1LjAsICAgIDI0My45KVxuICBdO1xuXG4gIHZhciBOZXB0dW5lUiA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4yNjA0NTcsIDIyMi4zNzEsIDc5Ljk5NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDA0OTQ0LCAgMjgxNS40LCAgIDkwLjEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCgwLjAwMzM2NCwgICA1MjQuMCwgIDMwOC4xKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoMC4wMDI1NzksICAxMDI1LjEsICAxMDQuMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKDAuMDAwMTIwLCAgNTg0NS4wLCAgMTExLjApXG4gIF07XG5cbiAgLy9cbiAgLy8gU3VuXG4gIC8vXG4gIHZhciBTdW5MYW1iZGEgPSBbXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAyMDAsICAzNTMuMDYsICA3MTkuOTgxKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoLTAuMDA0OCwgIDI0OC42NCwgIC0xOS4zNDEpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDIwLCAgIDI4NS4wLCAgIDMyOS42NCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTgsICAgMzM0LjIsIC00NDUyLjY3KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAxOCwgICAyOTMuNywgICAgLTAuMjApLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDE1LCAgIDI0Mi40LCAgIDQ1MC4zNyksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMTMsICAgMjExLjEsICAgMjI1LjE4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwOCwgICAyMDguMCwgICA2NTkuMjkpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDA3LCAgICA1My41LCAgICA5MC4zOCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDcsICAgIDEyLjEsICAgLTMwLjM1KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwNiwgICAyMzkuMSwgICAzMzcuMTgpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDA1LCAgICAxMC4xLCAgICAtMS41MCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKCAwLjAwMDUsICAgIDk5LjEsICAgLTIyLjgxKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwNCwgICAyNjQuOCwgICAzMTUuNTYpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDA0LCAgIDIzMy44LCAgIDI5OS4zMCksXG4gICAgbmV3IFBsYW5ldEV4cFAwKC0wLjAwMDQsICAgMTk4LjEsICAgNzIwLjAyKSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMywgICAzNDkuNiwgIDEwNzkuOTcpLFxuICAgIG5ldyBQbGFuZXRFeHBQMCggMC4wMDAzLCAgIDI0MS4yLCAgIC00NC40MylcbiAgXTtcblxuICB2YXIgU3VuUSA9IFtcbiAgICBuZXcgUGxhbmV0RXhwUDAoLTAuMDAwMDkxLCAgMzUzLjEsICAgNzE5Ljk4KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMDEzLCAgMjA1LjgsICA0NDUyLjY3KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMDA3LCAgIDYyLjAsICAgIDQ1MC40KSxcbiAgICBuZXcgUGxhbmV0RXhwUDAoIDAuMDAwMDA3LCAgMTA1LjAsICAgIDMyOS42KVxuICBdO1xuXG4gIC8qKlxuICAgKiBHZXQgUG9zaXRpb24gb2YgdGhlIEVhcnRoXG4gICAqL1xuICB2YXIgZ2V0UG9zRXhwMCA9IGZ1bmN0aW9uKGZUKSB7XG4gICAgdmFyIGksIGZMYW1iZGEgPSAyNzkuMDM1OCArIDM2MC4wMDc2OSAqXG4gICAgICAgIGZUICsgKCAxLjkxNTkgLSAwLjAwMDA1ICogZlQpICpcbiAgICAgICAgVWRNYXRoLnVkc2luKCgzNTYuNTMxKSsgKCAzNTkuOTkxKSAqIGZUKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBTdW5MYW1iZGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZMYW1iZGEgKz0gU3VuTGFtYmRhW2ldLmEgKiBVZE1hdGgudWRzaW4oU3VuTGFtYmRhW2ldLmIgKyBTdW5MYW1iZGFbaV0uYyAqIGZUKTtcbiAgICB9XG5cbiAgICBmTGFtYmRhICs9IDAuMDA1NztcbiAgICBmTGFtYmRhID0gVWRNYXRoLmRlZzJyYWQoVWRNYXRoLmRlZ21hbChmTGFtYmRhKSk7XG4gICAgdmFyIGZCZXRhID0gMC4wO1xuXG4gICAgdmFyIGZxID0gKC0gMC4wMDcyNjErMC4wMDAwMDAyICogZlQpICpcbiAgICAgICAgVWRNYXRoLnVkY29zKCgzNTYuNTMpICtcbiAgICAgICAgKDM1OS45OTEpICogZlQpICsgMC4wMDAwMzA7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgU3VuUS5sZW5ndGg7IGkrKykge1xuICAgICAgZnEgKz0gU3VuUVtpXS5hICogVWRNYXRoLnVkY29zKFN1blFbaV0uYiArIFN1blFbaV0uYiAqIGZUKTtcbiAgICB9XG5cbiAgICB2YXIgZlJhZGl1cyA9IE1hdGgucG93KDEwLjAsIGZxKTtcblxuICAgIHJldHVybiBuZXcgWHl6KC1mUmFkaXVzICogTWF0aC5jb3MoZkJldGEpICogTWF0aC5jb3MoZkxhbWJkYSksXG4gICAgICAgICAgICAgLWZSYWRpdXMgKiBNYXRoLmNvcyhmQmV0YSkgKiBNYXRoLnNpbihmTGFtYmRhKSxcbiAgICAgICAgICAgICAtZlJhZGl1cyAqIE1hdGguc2luKGZCZXRhKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCBQb3NpdGlvbiBvZiBWZW51cyBhbmQgTWFyc1xuICAgKi9cbiAgdmFyIGdldFBvc0V4cDEgPSBmdW5jdGlvbihwbGFuZXRObywgZlQpIHtcbiAgICB2YXIgUGFyYW1MMCwgUGFyYW1MMSwgUGFyYW1RO1xuICAgIHZhciBpLCBQYXJhbVA7XG5cbiAgICBzd2l0Y2ggKHBsYW5ldE5vKSB7XG4gICAgICBjYXNlIFBsYW5ldHMuVmVudXM6XG4gICAgICAgIFBhcmFtTDAgPSBWZW51c0wwO1xuICAgICAgICBQYXJhbUwxID0gVmVudXNMMTtcbiAgICAgICAgUGFyYW1RICA9IFZlbnVzUTtcbiAgICAgICAgUGFyYW1QICA9IFZlbnVzUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBsYW5ldHMuTWFyczpcbiAgICAgICAgUGFyYW1MMCA9IE1hcnNMMDtcbiAgICAgICAgUGFyYW1MMSA9IE1hcnNMMTtcbiAgICAgICAgUGFyYW1RICA9IE1hcnNRO1xuICAgICAgICBQYXJhbVAgID0gTWFyc1A7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgJ0FyaXRobWV0aWMgRXhjZXB0aW9uJztcbiAgICB9XG5cbiAgICB2YXIgTDEgPSAoUGFyYW1QLkw2ICsgUGFyYW1QLkw3ICogZlQpICogVWRNYXRoLnVkc2luKFBhcmFtUC5MOCArIFBhcmFtUC5MOSAqIGZUKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgUGFyYW1MMS5sZW5ndGg7IGkrKykge1xuICAgICAgTDEgKz0gUGFyYW1MMVtpXS5hICogVWRNYXRoLnVkc2luKFBhcmFtTDFbaV0uYiArIFBhcmFtTDFbaV0uYyAqIGZUKTtcbiAgICB9XG5cbiAgICB2YXIgTDAgPSBQYXJhbVAuTDEgKyBQYXJhbVAuTDIgKiBmVCArXG4gICAgICAgIFBhcmFtUC5MMyAqIFVkTWF0aC51ZHNpbihQYXJhbVAuTDQgKyBQYXJhbVAuTDUgKiBmVCArIDIuMCAqIEwxKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgUGFyYW1MMC5sZW5ndGg7IGkrKykge1xuICAgICAgTDAgKz0gUGFyYW1MMFtpXS5hICogVWRNYXRoLnVkc2luKFBhcmFtTDBbaV0uYiArIFBhcmFtTDBbaV0uYyAqIGZUKTtcbiAgICB9XG5cbiAgICB2YXIgZkxhbWJkYSA9IFVkTWF0aC5kZWcycmFkKFVkTWF0aC5kZWdtYWwoTDAgKyBMMSkpO1xuICAgIHZhciBmQmV0YSA9IE1hdGguYXNpbihQYXJhbVAuQjEgKiBVZE1hdGgudWRzaW4oUGFyYW1QLkIyICsgUGFyYW1QLkIzICogZlQgKyBMMSkpO1xuICAgIHZhciBmcSA9IChQYXJhbVAucTEgKyBQYXJhbVAucTIgKiBmVCkgKlxuICAgICAgICBVZE1hdGgudWRjb3MoUGFyYW1QLnEzICsgUGFyYW1QLnE0ICogZlQpICsgUGFyYW1QLnE1O1xuICAgIGZvciAoaSA9IDA7IGkgPCBQYXJhbVEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZxICs9IFBhcmFtUVtpXS5hICogVWRNYXRoLnVkY29zKFBhcmFtUVtpXS5iICsgUGFyYW1RW2ldLmMgKiBmVCk7XG4gICAgfVxuXG4gICAgdmFyIGZSYWRpdXMgPSBNYXRoLnBvdygxMC4wLCBmcSk7XG5cbiAgICByZXR1cm4gbmV3IFh5eihmUmFkaXVzICogTWF0aC5jb3MoZkJldGEpICogTWF0aC5jb3MoZkxhbWJkYSksXG4gICAgICAgICAgICAgZlJhZGl1cyAqIE1hdGguY29zKGZCZXRhKSAqIE1hdGguc2luKGZMYW1iZGEpLFxuICAgICAgICAgICAgIGZSYWRpdXMgKiBNYXRoLnNpbihmQmV0YSkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgUG9zaXRpb24gb2YgSnVwaXRlciBhbmQgU2F0dXJuXG4gICAqL1xuICB2YXIgZ2V0UG9zRXhwMiA9IGZ1bmN0aW9uKHBsYW5ldE5vLCBmVCkge1xuICAgIHZhciBQYXJhbU4sIFBhcmFtQiwgUGFyYW1RO1xuICAgIHZhciBpLCBQYXJhbVA7XG4gICAgdmFyIGZxLCBmTjtcblxuICAgIHN3aXRjaCAocGxhbmV0Tm8pIHtcbiAgICAgIGNhc2UgUGxhbmV0cy5KdXBpdGVyOlxuICAgICAgICBQYXJhbU4gPSBKdXBpdGVyTjtcbiAgICAgICAgUGFyYW1CID0gSnVwaXRlckI7XG4gICAgICAgIFBhcmFtUSA9IEp1cGl0ZXJRO1xuICAgICAgICBQYXJhbVAgPSBKdXBpdGVyUDtcbiAgICAgICAgZk4gID0gMzQxLjUyMDggKyAzMC4zNDkwNyAqIGZUO1xuICAgICAgICBmTiArPSAoMC4wMzUwICsgMC4wMDAyOCAqIGZUKSAqIFVkTWF0aC51ZHNpbigyNDUuOTQgLSAzMC4zNDkgKiBmVCkrIDAuMDAwNDtcbiAgICAgICAgZk4gLT0gKDAuMDAxOSArIDAuMDAwMDIgKiBmVCkgKiBVZE1hdGgudWRzaW4oMTYyLjc4ICsgIDAuMzggKiBmVCk7XG4gICAgICAgIGZxICA9ICgwLjAwMDEzMiArIDAuMDAwMDAxMSAqIGZUKSAqIFVkTWF0aC51ZGNvcygyNDUuOTMgLSAzMC4zNDkgKiBmVCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQbGFuZXRzLlNhdHVybjpcbiAgICAgICAgUGFyYW1OID0gU2F0dXJuTjtcbiAgICAgICAgUGFyYW1CID0gU2F0dXJuQjtcbiAgICAgICAgUGFyYW1RID0gU2F0dXJuUTtcbiAgICAgICAgUGFyYW1QID0gU2F0dXJuUDtcbiAgICAgICAgZk4gID0gMTIuMzA0MiArMTIuMjIxMTcgKiBmVDtcbiAgICAgICAgZk4gKz0gKDAuMDkzNCArIDAuMDAwNzUgKiBmVCkgKiBVZE1hdGgudWRzaW4oMjUwLjI5ICsgMTIuMjIxICogZlQpKyAwLjAwMDg7XG4gICAgICAgIGZOICs9ICgwLjAwNTcgKyAwLjAwMDA1ICogZlQpICogVWRNYXRoLnVkc2luKDI2NS44ICAtIDExLjgxICogZlQpO1xuICAgICAgICBmTiArPSAoMC4wMDQ5ICsgMC4wMDAwNCAqIGZUKSAqIFVkTWF0aC51ZHNpbigxNjIuNyAgKyAgMC4zOCAqIGZUKTtcbiAgICAgICAgZk4gKz0gKDAuMDAxOSArIDAuMDAwMDIgKiBmVCkgKiBVZE1hdGgudWRzaW4oMjYyLjAgICsgMjQuNDQgKiBmVCk7XG4gICAgICAgIGZxICA9ICgwLjAwMDM1NCArIDAuMDAwMDAyOCAqIGZUKSAqIFVkTWF0aC51ZGNvcyggNzAuMjggKyAxMi4yMiAqIGZUKSArIDAuMDAwMTgzO1xuICAgICAgICBmcSArPSAoMC4wMDAwMjEgKyAwLjAwMDAwMDIgKiBmVCkgKiBVZE1hdGgudWRjb3MoMjY1LjgwIC0gMTEuODEgICogZlQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IFwiQXJpdGhtZXRpYyBFeGNlcHRpb25cIjtcbiAgICB9XG5cbiAgICAvLyBMYW1iZGFcbiAgICBmb3IgKGkgPSAwOyBpIDwgUGFyYW1OLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmTiArPSBQYXJhbU5baV0uYSAqIFVkTWF0aC51ZHNpbihQYXJhbU5baV0uYiArIFBhcmFtTltpXS5jICogZlQpO1xuICAgIH1cblxuICAgIHZhciBmZiA9IGZOICsgUGFyYW1QLmYxICogVWRNYXRoLnVkc2luKGZOKSArXG4gICAgICAgICAgUGFyYW1QLmYyICogVWRNYXRoLnVkc2luKDIuMCAqIGZOKSArXG4gICAgICAgICAgUGFyYW1QLmYzICogVWRNYXRoLnVkc2luKDMuMCAqIGZOKSArXG4gICAgICAgICAgUGFyYW1QLmY0ICogVWRNYXRoLnVkc2luKDQuMCAqIGZOKTtcbiAgICB2YXIgZlYgPSBQYXJhbVAuVjEgKiBVZE1hdGgudWRzaW4oMi4wICogZmYgKyBQYXJhbVAuVjIpO1xuXG4gICAgdmFyIGZMYW1iZGEgPSBVZE1hdGguZGVnMnJhZChVZE1hdGguZGVnbWFsKGZmICsgZlYgK1xuICAgICAgICAgICAgICAgICAgICAgIFBhcmFtUC5MMSArIFBhcmFtUC5MMiAqIGZUKSk7XG5cbiAgICAvLyBCZXRhXG4gICAgdmFyIGZCZXRhID0gTWF0aC5hc2luKFBhcmFtUC5CMSAqIFVkTWF0aC51ZHNpbihmZiArIFBhcmFtUC5CMikpICtcbiAgICAgICAgICAgICAgICBVZE1hdGguZGVnMnJhZCgoUGFyYW1QLkIzICsgUGFyYW1QLkI0ICogZlQpICtcbiAgICAgICAgICAgICAgICBVZE1hdGgudWRzaW4oZmYgKyBQYXJhbVAuQjUpKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgUGFyYW1CLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmQmV0YSArPSBQYXJhbUJbaV0uYSAqIFVkTWF0aC51ZHNpbihQYXJhbUJbaV0uYiArIFBhcmFtQltpXS5jICogZlQpO1xuICAgIH1cblxuICAgIC8vIFJhZGl1c1xuICAgIGZvciAoaSA9IDA7IGkgPCBQYXJhbVEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZxICs9IFBhcmFtUVtpXS5hICogVWRNYXRoLnVkY29zKFBhcmFtUVtpXS5iICsgUGFyYW1RW2ldLmMgKiBmVCk7XG4gICAgfVxuXG4gICAgdmFyIGZyID0gTWF0aC5wb3coMTAuMCwgZnEpO1xuICAgIHZhciBmUmFkaXVzID0gZnIgKiBQYXJhbVAucjEgLyAoIDEuMCArIFBhcmFtUC5yMiAqIFVkTWF0aC51ZGNvcyhmZikpO1xuXG4gICAgcmV0dXJuIG5ldyBYeXooZlJhZGl1cyAqIE1hdGguY29zKGZCZXRhKSAqIE1hdGguY29zKGZMYW1iZGEpLFxuICAgICAgICAgICAgIGZSYWRpdXMgKiBNYXRoLmNvcyhmQmV0YSkgKiBNYXRoLnNpbihmTGFtYmRhKSxcbiAgICAgICAgICAgICBmUmFkaXVzICogTWF0aC5zaW4oZkJldGEpKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IFBvc2l0aW9uIG9mIE1lcmN1cnksIFVyYW51cywgTm5lcHR1bmUsIFBsdXRvXG4gICAqL1xuICB2YXIgZ2V0UG9zRXhwMyA9IGZ1bmN0aW9uKHBsYW5ldE5vLCBmVDIpIHtcbiAgICB2YXIgUGFyYW1MLCBQYXJhbUIsIFBhcmFtUjtcbiAgICB2YXIgZkxhbWJkYSwgZkJldGEsIGZSYWRpdXM7XG5cbiAgICBzd2l0Y2ggKHBsYW5ldE5vKSB7XG4gICAgICBjYXNlIFBsYW5ldHMuTWVyY3VyeTpcbiAgICAgICAgUGFyYW1MID0gTWVyY3VyeUxhbWJkYTtcbiAgICAgICAgUGFyYW1CID0gTWVyY3VyeUJldGE7XG4gICAgICAgIFBhcmFtUiA9IE1lcmN1cnlSO1xuXG4gICAgICAgIGZMYW1iZGEgPSAyNTIuMjUwMiArIDE0OTQ3NC4wNzE0ICogZlQyO1xuICAgICAgICBmTGFtYmRhICs9ICgyMy40NDA1ICsgMC4wMDIzICogZlQyKSAqXG4gICAgICAgICAgICBVZE1hdGgudWRjb3MoMTQ5NDcyLjUxNTMgKiBmVDIgKyA4NC43OTQ3KTtcbiAgICAgICAgZkxhbWJkYSArPSAoIDIuOTgxOCArIDAuMDAwNiAqIGZUMikgKlxuICAgICAgICAgICAgVWRNYXRoLnVkY29zKDI5ODk0NS4wMzEgKiBmVDIgKyAyNTkuNTg5KTtcblxuICAgICAgICBmQmV0YSA9ICg2LjcwNTcgKyAwLjAwMTcgKiBmVDIpICpcbiAgICAgICAgICAgIFVkTWF0aC51ZGNvcygxNDk0NzIuODg2ICogZlQyICsgMTEzLjkxOSk7XG4gICAgICAgIGZCZXRhICs9ICgxLjQzOTYgKyAwLjAwMDUgKiBmVDIpICpcbiAgICAgICAgICAgIFVkTWF0aC51ZGNvcygwLjM3ICogZlQyICsgMTE5LjEyKTtcbiAgICAgICAgZkJldGEgKz0gKDEuMzY0MyArIDAuMDAwNSAqIGZUMikgKlxuICAgICAgICAgICAgVWRNYXRoLnVkY29zKDI5ODk0NS40MCAqIGZUMiArIDI4OC43MSk7XG5cbiAgICAgICAgZlJhZGl1cyA9IDAuMzk1MjgzICsgMC4wMDAwMDIgKiBmVDI7XG4gICAgICAgIGZSYWRpdXMgKz0gKDAuMDc4MzQxICsgMC4wMDAwMDggKiBmVDIpICpcbiAgICAgICAgICAgIFVkTWF0aC51ZGNvcygxNDk0NzIuNTE1ICogZlQyICsgMzU0Ljc5NSk7XG4gICAgICAgIGZSYWRpdXMgKz0gKDAuMDA3OTU1ICsgMC4wMDAwMDIgKiBmVDIpICpcbiAgICAgICAgICAgIFVkTWF0aC51ZGNvcygyOTg5NDUuMDMgKiBmVDIgKyAxNjkuNTkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUGxhbmV0cy5VcmFudXM6XG4gICAgICAgIFBhcmFtTCA9IFVyYW51c0xhbWJkYTtcbiAgICAgICAgUGFyYW1CID0gVXJhbnVzQmV0YTtcbiAgICAgICAgUGFyYW1SID0gVXJhbnVzUjtcblxuICAgICAgICBmTGFtYmRhID0gMzEzLjMzNjc2ICsgNDI4LjcyODgwICogZlQyO1xuICAgICAgICBmTGFtYmRhICs9IDMuMjA2NzEgKiBmVDIgKiBVZE1hdGgudWRjb3MoNzA1LjE1NTM5ICogZlQyICsgMTE0LjAyNzQwKTtcbiAgICAgICAgZkxhbWJkYSArPSAyLjY5MzI1ICogZlQyICogVWRNYXRoLnVkY29zKDU5Ny43NzM4OSAqIGZUMiArIDMxNy43NjUxMCk7XG4gICAgICAgIGZMYW1iZGEgKz0gMC4wMDAxNSAqIGZUMiAqIFVkTWF0aC51ZGNvcygzNzk4LjYgKiBmVDIgKyAzMTMuNCk7XG5cbiAgICAgICAgZkJldGEgPSAtMC4wMjk5NztcbiAgICAgICAgZkJldGEgKz0gMS43ODQ4OCAqIGZUMiAqIFVkTWF0aC51ZGNvcyg1MDcuNTIyODEgKiBmVDIgKyAxODguMzIzOTQpO1xuICAgICAgICBmQmV0YSArPSAwLjU2NTE4ICogZlQyICogVWRNYXRoLnVkY29zKDg5Mi4yODY5ICogZlQyICsgMzU0Ljk1NzEpO1xuICAgICAgICBmQmV0YSArPSAwLjAwMDM2ICogZlQyICogVWRNYXRoLnVkY29zKDE1MjYuNSAqIGZUMiArIDI2My4wKTtcblxuICAgICAgICBmUmFkaXVzID0gMTkuMjAzMDM0ICsgMC4wNDI2MTcgKiBmVDI7XG4gICAgICAgIGZSYWRpdXMgKz0gMC4zNjE5NDkgKiBmVDIgKiBVZE1hdGgudWRjb3MoNDQwLjcwMiAqIGZUMiArIDE5Ljg3OSk7XG4gICAgICAgIGZSYWRpdXMgKz0gMC4xNjY2ODUgKiBmVDIgKiBVZE1hdGgudWRjb3MoNzAyLjAyNCAqIGZUMiArIDMwNy40MTkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUGxhbmV0cy5OZXB0dW5lOlxuICAgICAgICBQYXJhbUwgPSBOZXB0dW5lTGFtYmRhO1xuICAgICAgICBQYXJhbUIgPSBOZXB0dW5lQmV0YTtcbiAgICAgICAgUGFyYW1SID0gTmVwdHVuZVI7XG5cbiAgICAgICAgZkxhbWJkYSA9IC0gNTUuMTMzMjMgKyAyMTkuOTM1MDMgKiBmVDI7XG4gICAgICAgIGZMYW1iZGEgKz0gMC4wNDQwMyAqIGZUMiAqIFVkTWF0aC51ZGNvcyg2ODQuMTI4ICogZlQyICsgMzMyLjc5Nyk7XG4gICAgICAgIGZMYW1iZGEgKz0gMC4wMjkyOCAqIGZUMiAqIFVkTWF0aC51ZGNvcyg5MDQuMzcxICogZlQyICsgMzQyLjExNCk7XG5cbiAgICAgICAgZkJldGEgPSAwLjAxNzI1O1xuXG4gICAgICAgIGZSYWRpdXMgPSAzMC4wNzMwMzM7XG4gICAgICAgIGZSYWRpdXMgKz0gMC4wMDk3ODQgKiBmVDIgKiBVZE1hdGgudWRjb3MoNTE1LjIgKiBmVDIgKyAxOTUuNyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgXCJBcml0aG1ldGljIEV4Y2VwdGlvblwiO1xuICAgIH1cblxuICAgIGZvcihpID0gMDsgaSA8IFBhcmFtTC5sZW5ndGg7IGkrKykge1xuICAgICAgZkxhbWJkYSArPSBQYXJhbUxbaV0uYSAqIFVkTWF0aC51ZGNvcyhQYXJhbUxbaV0uYiAqIGZUMiArIFBhcmFtTFtpXS5jKTtcbiAgICB9XG4gICAgZkxhbWJkYSA9IFVkTWF0aC5kZWcycmFkKFVkTWF0aC5kZWdtYWwoZkxhbWJkYSkpO1xuXG4gICAgZm9yKGkgPSAwOyBpIDwgUGFyYW1CLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmQmV0YSArPSBQYXJhbUJbaV0uYSAqIFVkTWF0aC51ZGNvcyhQYXJhbUJbaV0uYiAqIGZUMiArIFBhcmFtQltpXS5jKTtcbiAgICB9XG4gICAgZkJldGEgPSBVZE1hdGguZGVnMnJhZChmQmV0YSk7XG5cbiAgICBmb3IoaSA9IDA7IGkgPCBQYXJhbVIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZSYWRpdXMgKz0gUGFyYW1SW2ldLmEgKiBVZE1hdGgudWRjb3MoUGFyYW1SW2ldLmIgKiBmVDIgKyBQYXJhbVJbaV0uYyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBYeXooZlJhZGl1cyAqIE1hdGguY29zKGZCZXRhKSAqIE1hdGguY29zKGZMYW1iZGEpLFxuICAgICAgICAgICAgIGZSYWRpdXMgKiBNYXRoLmNvcyhmQmV0YSkgKiBNYXRoLnNpbihmTGFtYmRhKSxcbiAgICAgICAgICAgICBmUmFkaXVzICogTWF0aC5zaW4oZkJldGEpKTtcbiAgfTtcblxufTtcblxuZnVuY3Rpb24gZ2V0UG9zaXRpb24gKHBsYW5ldE5vLCBhdGltZSkge1xuICBzd2l0Y2ggKHBsYW5ldE5vKSB7XG4gICAgY2FzZSBQbGFuZXRzLkVhcnRoOlxuICAgICAgcmV0dXJuIGdldFBvc0V4cDAoYXRpbWUuZ2V0VGltZTEoKSk7XG4gICAgY2FzZSBQbGFuZXRzLlZlbnVzOlxuICAgIGNhc2UgUGxhbmV0cy5NYXJzOlxuICAgICAgcmV0dXJuIGdldFBvc0V4cDEocGxhbmV0Tm8sIGF0aW1lLmdldFRpbWUxKCkpO1xuICAgIGNhc2UgUGxhbmV0cy5KdXBpdGVyOlxuICAgIGNhc2UgUGxhbmV0cy5TYXR1cm46XG4gICAgICByZXR1cm4gZ2V0UG9zRXhwMihwbGFuZXRObywgYXRpbWUuZ2V0VGltZTEoKSk7XG4gICAgY2FzZSBQbGFuZXRzLk1lcmN1cnk6XG4gICAgY2FzZSBQbGFuZXRzLlVyYW51czpcbiAgICBjYXNlIFBsYW5ldHMuTmVwdHVuZTpcbiAgICAgIHJldHVybiBnZXRQb3NFeHAzKHBsYW5ldE5vLCBhdGltZS5nZXRUaW1lMigpKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMuZ2V0UG9zaXRpb24gPSBnZXRQb3NpdGlvbjtcblxuZnVuY3Rpb24gUGxhbmV0RXhwUDAoYSwgYiwgYykge1xuICB0aGlzLmEgPSBhO1xuICB0aGlzLmIgPSBiO1xuICB0aGlzLmMgPSBjO1xufVxuXG5mdW5jdGlvbiBQbGFuZXRFeHBQMSggLyogVmVudXMgYW5kIE1hcnMgKi9cbiAgTDEsIEwyLCBMMyxcbiAgTDQsIEw1LCBMNixcbiAgTDcsIEw4LCBMOSxcbiAgQjEsIEIyLCBCMyxcbiAgcTEsIHEyLCBxMyxcbiAgcTQsIHE1KSB7XG4gIHRoaXMuTDEgPSBMMTsgdGhpcy5MMiA9IEwyOyB0aGlzLkwzID0gTDM7XG4gIHRoaXMuTDQgPSBMNDsgdGhpcy5MNSA9IEw1OyB0aGlzLkw2ID0gTDY7XG4gIHRoaXMuTDcgPSBMNzsgdGhpcy5MOCA9IEw4OyB0aGlzLkw5ID0gTDk7XG4gIHRoaXMuQjEgPSBCMTsgdGhpcy5CMiA9IEIyOyB0aGlzLkIzID0gQjM7XG4gIHRoaXMucTEgPSBxMTsgdGhpcy5xMiA9IHEyOyB0aGlzLnEzID0gcTM7XG4gIHRoaXMucTQgPSBxNDsgdGhpcy5xNSA9IHE1O1xufVxuXG5mdW5jdGlvbiBQbGFuZXRFeHBQMiggLyogSnVwaXRlciBhbmQgU2F0dXJuICovXG4gIEwxLCBMMixcbiAgVjEsIFYyLFxuICBmMSwgZjIsIGYzLCBmNCxcbiAgQjEsIEIyLCBCMywgQjQsIEI1LFxuICByMSwgcjIpIHtcbiAgdGhpcy5MMSA9IEwxOyB0aGlzLkwyID0gTDI7XG4gIHRoaXMuVjEgPSBWMTsgdGhpcy5WMiA9IFYyO1xuICB0aGlzLmYxID0gZjE7IHRoaXMuZjIgPSBmMjsgdGhpcy5mMyA9IGYzOyB0aGlzLmY0ID0gZjQ7XG4gIHRoaXMuQjEgPSBCMTsgdGhpcy5CMiA9IEIyOyB0aGlzLkIzID0gQjM7IHRoaXMuQjQgPSBCNDsgdGhpcy5CNSA9IEI1O1xuICB0aGlzLnIxID0gcjE7IHRoaXMucjIgPSByMjtcbn1cbiIsInZhciBYeXogPSByZXF1aXJlKFwiLi94eXpcIik7XG5cbi8qKlxuICogUGxhbmV0T3JiaXQgbW9kdWxlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwbGFuZXRObywgYXRpbWUsIGRpdmlzaW9uKXtcblxuICB0aGlzLnBsYW5ldE5vID0gcGxhbmV0Tm87XG4gIHRoaXMuanVsaWFuID0gYXRpbWUuanVsaWFuO1xuICB0aGlzLmRpdmlzaW9uID0gZGl2aXNpb247XG5cbiAgdmFyIG9yYml0ID0gW107XG4gIGZvcihkID0gMDsgZCA8IGRpdmlzaW9uOyBkKyspIHtcbiAgICBvcmJpdC5wdXNoKG5ldyBYeXooKSk7XG4gIH1cbiAgdmFyIHBsYW5ldEVsbSA9IG5ldyBQbGFuZXRFbG0ocGxhbmV0Tm8sIGF0aW1lKTtcbiAgZG9HZXRQbGFuZXRPcmJpdChwbGFuZXRFbG0pO1xuXG4gIHZhciB2ZWMgPSBNYXRyaXguVmVjdG9yQ29uc3RhbnQocGxhbmV0RWxtLnBlcmkgKiBNYXRoLlBJLzE4MC4wLFxuICAgICAgICAgICAgICAgICAgICAgcGxhbmV0RWxtLm5vZGUgKiBNYXRoLlBJLzE4MC4wLFxuICAgICAgICAgICAgICAgICAgICAgcGxhbmV0RWxtLmluY2wgKiBNYXRoLlBJLzE4MC4wLFxuICAgICAgICAgICAgICAgICAgICAgYXRpbWUpO1xuICB2YXIgcHJlYyA9IE1hdHJpeC5QcmVjTWF0cml4KGF0aW1lLmp1bGlhbiwgMjQ1MTUxMi41KTtcbiAgZm9yKGkgPSAwOyBpIDw9IGRpdmlzaW9uOyBpKyspIHtcbiAgICBvcmJpdFtpXSA9IG9yYml0W2ldLlJvdGF0ZSh2ZWMpLlJvdGF0ZShwcmVjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRvR2V0UGxhbmV0T3JiaXQocGxhbmV0RWxtKSB7XG4gICAgdmFyIGFlMiA9IC0yLjAgKiBwbGFuZXRFbG0uYXhpcyAqIHBsYW5ldEVsbS5lO1xuICAgIHZhciB0ID0gTWF0aC5zcXJ0KDEuMCAtIHBsYW5ldEVsbS5lICogcGxhbmV0RWxtLmUpO1xuICAgIHZhciB4cDEgPSAwO1xuICAgIHZhciB4cDIgPSBkaXZpc2lvbi8yO1xuICAgIHZhciB4cDMgPSBkaXZpc2lvbi8yO1xuICAgIHZhciB4cDQgPSBkaXZpc2lvbjtcbiAgICB2YXIgRSA9IDAuMDtcblxuICAgIGZvcih2YXIgaSA9IDA7IGkgPD0gKGRpdmlzaW9uLzQpOyBpKyssIEUgKz0gKDM2MC4wIC8gZGl2aXNpb24pKSB7XG4gICAgICB2YXIgcmNvc3YgPSBwbGFuZXRFbG0uYXhpcyAqIChVZE1hdGgudWRjb3MoRSkgLSBwbGFuZXRFbG0uZSk7XG4gICAgICB2YXIgcnNpbnYgPSBwbGFuZXRFbG0uYXhpcyAqIHQgKiBVZE1hdGgudWRzaW4oRSk7XG4gICAgICBvcmJpdFt4cDErK10gPSBuZXcgWHl6KHJjb3N2LCAgICAgICAgcnNpbnYsIDAuMCk7XG4gICAgICBvcmJpdFt4cDItLV0gPSBuZXcgWHl6KGFlMiAtIHJjb3N2LCAgcnNpbnYsIDAuMCk7XG4gICAgICBvcmJpdFt4cDMrK10gPSBuZXcgWHl6KGFlMiAtIHJjb3N2LCAtcnNpbnYsIDAuMCk7XG4gICAgICBvcmJpdFt4cDQtLV0gPSBuZXcgWHl6KHJjb3N2LCAgICAgICAtcnNpbnYsIDAuMCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5nZXRBdCA9IGZ1bmN0aW9uKGluZGV4KXtcbiAgICByZXR1cm4gb3JiaXRbaW5kZXhdO1xuICB9O1xuXG59O1xuIiwidmFyIFVkTWF0aCAgICA9IHJlcXVpcmUoJy4vdWRtYXRoJyk7XG52YXIgUGxhbmV0RWxtID0gcmVxdWlyZSgnLi9wbGFuZXQtZWxtJyk7XG52YXIgUGxhbmV0RXhwID0gcmVxdWlyZSgnLi9wbGFuZXQtZXhwJyk7XG5cbi8qKlxuICogUGxhbmV0IG1vZHVsZVxuICovXG5cbnZhciBqdWxpYW5TdGFydCA9IDI0MzMyODIuNTsgIC8vIDE5NTAuMFxudmFyIGp1bGlhbkVuZCAgID0gMjQ3MzQ1OS41OyAgLy8gMjA2MC4wXG5cbnZhciBwbGFuZXQgPSB7XG5cbiAgLyoqXG4gICAqIEdldCBQbGFuZXQgUG9zaXRpb24gaW4gRWNsaXB0aWMgQ29vcmRpbmF0ZXMgKEVxdWlub3ggRGF0ZSlcbiAgICovXG4gIGdldFBvc2l0aW9uOiBmdW5jdGlvbihwbGFuZXRObywgYXRpbWUpIHtcbiAgICBpZiAoanVsaWFuU3RhcnQgPCBhdGltZS5qdWxpYW4gJiYgYXRpbWUuanVsaWFuIDwganVsaWFuRW5kKSB7XG4gICAgICByZXR1cm4gUGxhbmV0RXhwLmdldFBvc2l0aW9uKHBsYW5ldE5vLCBhdGltZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwbGFuZXRFbG0gPSBuZXcgUGxhbmV0RWxtKHBsYW5ldE5vLCBhdGltZSk7XG4gICAgICByZXR1cm4gcGxhbmV0RWxtLmdldFBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGxhbmV0O1xuXG5cblxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN1biAgICAgOiAwLFxuICBNZXJjdXJ5IDogMSxcbiAgVmVudXMgICA6IDIsXG4gIEVhcnRoICAgOiAzLFxuICBNYXJzICAgIDogNCxcbiAgSnVwaXRlciA6IDUsXG4gIFNhdHVybiAgOiA2LFxuICBVcmFudXMgIDogNyxcbiAgTmVwdHVuZSA6IDhcbn07XG5cbiIsIi8qKlxuICogQ29tbW9uIE1hdGhlbWF0aWMgRnVuY3Rpb25zXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqXG4gICAqIG1vZHVsbyBmb3IgZG91YmxlIHZhbHVlXG4gICAqL1xuICBmbW9kOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuIHggLSBNYXRoLmNlaWwoeCAvIHkpICogeTtcbiAgfSxcblxuICAvKipcbiAgICogc2luIGZvciBkZWdyZWVcbiAgICovXG4gIHVkc2luOiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIE1hdGguc2luKHggKiBNYXRoLlBJIC8gMTgwLjApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBjb3MgZm9yIGRlZ3JlZVxuICAgKi9cbiAgdWRjb3M6IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gTWF0aC5jb3MoeCAqIE1hdGguUEkgLyAxODAuMCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIHRhbiBmb3IgZGVncmVlXG4gICAqL1xuICB1ZHRhbjogZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiBNYXRoLnRhbih4ICogTWF0aC5QSSAvIDE4MC4wKTtcbiAgfSxcblxuICAvKipcbiAgICogUm91bmRpbmcgZGVncmVlIGFuZ2xlIGJldHdlZW4gMCB0byAzNjBcbiAgICovXG4gIGRlZ21hbDogZnVuY3Rpb24oeCkge1xuICAgIHZhciB5ID0gMzYwLjAgKiAoeCAvIDM2MC4wIC0gTWF0aC5mbG9vcih4IC8gMzYwLjApKTtcbiAgICBpZiAoeSA8IDAuMCkge1xuICAgICAgeSArPSAzNjAuMDtcbiAgICB9XG4gICAgaWYgKHkgPj0gMzYwLjApIHtcbiAgICAgIHkgLT0gMzYwLjA7XG4gICAgfVxuICAgIHJldHVybiB5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBSb3VuZGluZyByYWRpYW4gYW5nbGUgYmV0d2VlbiAwIHRvIDIqUElcbiAgICovXG4gIHJhZG1hbDogZnVuY3Rpb24oeCkge1xuICAgIHZhciB5ID0gTWF0aC5QSSAqIDIuMCAqICh4IC8gKE1hdGguUEkgKiAyLjApIC1cbiAgICAgICAgICAgIE1hdGguZmxvb3IoeCAvIChNYXRoLlBJICogMi4wKSkpO1xuICAgIGlmICh5IDwgMC4wKSB7XG4gICAgICB5ICs9IE1hdGguUEkgKiAyLjA7XG4gICAgfVxuICAgIGlmICh5ID49IE1hdGguUEkgKiAyLjApIHtcbiAgICAgIHkgLT0gTWF0aC5QSSAqIDIuMDtcbiAgICB9XG4gICAgcmV0dXJuIHk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIERlZ3JlZSB0byBSYWRpYW5cbiAgICovXG4gIGRlZzJyYWQ6IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4geCAqIE1hdGguUEkgLyAxODAuMDtcbiAgfSxcblxuICAvKipcbiAgICogUmFkaWFuIHRvIERlZ3JlZVxuICAgKi9cbiAgcmFkMmRlZzogZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiB4ICogMTgwLjAgLyBNYXRoLlBJO1xuICB9LFxuXG4gIC8qKlxuICAgKiBhcmNjb3NoXG4gICAqL1xuICBhcmNjb3NoOiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIE1hdGgubG9nKHggKyBNYXRoLnNxcnQoeCAqIHggLSAxLjApKTtcbiAgfSxcblxuICAvKipcbiAgICogc2luaFxuICAgKi9cbiAgc2luaDogZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiAoTWF0aC5leHAoeCkgLSBNYXRoLmV4cCgteCkpIC8gMi4wO1xuICB9LFxuXG4gIC8qKlxuICAgKiBjb3NoXG4gICAqL1xuICBjb3NoOiBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIChNYXRoLmV4cCh4KSArIE1hdGguZXhwKC14KSkgLyAyLjA7XG4gIH1cblxufTtcbiIsIi8qKlxuICogMy1EaW1lbnNpb25hbCBWZWN0b3JcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFh5ejtcblxuZnVuY3Rpb24gWHl6KHgsIHksIHope1xuXG4gIHRoaXMueCA9IHggfHwgMC4wO1xuICB0aGlzLnkgPSB5IHx8IDAuMDtcbiAgdGhpcy56ID0geiB8fCAwLjA7XG5cbiAgLyoqXG4gICAqIFJvdGF0aW9uIG9mIFZlY3RvciB3aXRoIE1hdHJpeFxuICAgKi9cbiAgdGhpcy5yb3RhdGUgPSBmdW5jdGlvbihtdHgpIHtcbiAgICB2YXIgeCA9IG10eC5mQTExICogdGhpcy54ICsgbXR4LmZBMTIgKiB0aGlzLnkgKyBtdHguZkExMyAqIHRoaXMuejtcbiAgICB2YXIgeSA9IG10eC5mQTIxICogdGhpcy54ICsgbXR4LmZBMjIgKiB0aGlzLnkgKyBtdHguZkEyMyAqIHRoaXMuejtcbiAgICB2YXIgeiA9IG10eC5mQTMxICogdGhpcy54ICsgbXR4LmZBMzIgKiB0aGlzLnkgKyBtdHguZkEzMyAqIHRoaXMuejtcbiAgICByZXR1cm4gbmV3IFh5eih4LCB5LCB6KTtcbiAgfTtcblxuICAvKipcbiAgICogViA6PSBWMSArIFYyXG4gICAqL1xuICB0aGlzLmFkZCA9IGZ1bmN0aW9uKHh5eikge1xuICAgIHZhciB4ID0gdGhpcy54ICsgeHl6Lng7XG4gICAgdmFyIHkgPSB0aGlzLnkgKyB4eXoueTtcbiAgICB2YXIgeiA9IHRoaXMueiArIHh5ei56O1xuICAgIHJldHVybiBuZXcgWHl6KHgsIHksIHopO1xuICB9O1xuXG4gIC8qKlxuICAgKiBWIDo9IFYxIC0gVjJcbiAgICovXG4gIHRoaXMuc3ViID0gZnVuY3Rpb24oeHl6KSB7XG4gICAgdmFyIHggPSB0aGlzLnggLSB4eXoueDtcbiAgICB2YXIgeSA9IHRoaXMueSAtIHh5ei55O1xuICAgIHZhciB6ID0gdGhpcy56IC0geHl6Lno7XG4gICAgcmV0dXJuIG5ldyBYeXooeCwgeSwgeik7XG4gIH07XG5cbiAgLyoqXG4gICAqIFYgOj0geCAqIFY7XG4gICAqL1xuICB0aGlzLm11bCA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueCAqIGE7XG4gICAgdmFyIHkgPSB0aGlzLnkgKiBhO1xuICAgIHZhciB6ID0gdGhpcy56ICogYTtcbiAgICByZXR1cm4gbmV3IFh5eih4LCB5LCB6KTtcbiAgfTtcblxuICAvKipcbiAgICogeCA6PSBhYnMoVik7XG4gICAqL1xuICB0aGlzLmFicyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56KTtcbiAgfTtcblxufVxuIiwidmFyIFh5eiAgICA9IHJlcXVpcmUoJy4vc3JjL3h5eicpO1xudmFyIEFzdHJvICA9IHJlcXVpcmUoJy4vc3JjL2FzdHJvJyk7XG52YXIgQVRpbWUgID0gcmVxdWlyZSgnLi9zcmMvYXRpbWUnKTtcbnZhciBDb21ldCAgPSByZXF1aXJlKCcuL3NyYy9jb21ldCcpO1xudmFyIFBsYW5ldCA9IHJlcXVpcmUoJy4vc3JjL3BsYW5ldCcpO1xudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vc3JjL21hdHJpeCcpO1xudmFyIFBsYW5ldHMgPSByZXF1aXJlKCcuL3NyYy9wbGFuZXRzJyk7XG52YXIgQ29tZXRPcmJpdCA9IHJlcXVpcmUoJy4vc3JjL2NvbWV0LW9yYml0Jyk7XG52YXIgUGxhbmV0T3JiaXQgPSByZXF1aXJlKCcuL3NyYy9wbGFuZXQtb3JiaXQnKTtcblxudmFyIGNhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcbnZhciBjdHggPSBjYW52YXNFbGVtZW50LmdldENvbnRleHQoXCIyZFwiKTtcblxudmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xudmFyIHRvZGF5ID0ge1xuICB5ZWFyOiBkYXRlLmdldEZ1bGxZZWFyKCksXG4gIG1vbnRoOiBkYXRlLmdldE1vbnRoKCkrMSxcbiAgZGF5OiBkYXRlLmdldERhdGUoKSxcbiAgaG91cjogZGF0ZS5nZXRIb3VycygpKzEsXG4gIG1pbnV0ZTogZGF0ZS5nZXRNaW51dGVzKCksXG4gIHNlY29uZDogZGF0ZS5nZXRTZWNvbmRzKCksXG4gIHRpbWV6b25lOiAwXG59O1xuXG52YXIgdG9kYXl0aW1lID0gbmV3IEFUaW1lKHRvZGF5KTtcblxudmFyIHBhcmFtcyA9IHtcbiAgbmFtZSAgIDogJ0NlcmVzJyxcbiAgZXBvY2ggIDogMTk5OTExMTguNSxcbiAgTSAgICAgIDogMzU2LjY0ODQzNCxcbiAgZSAgICAgIDogMC4wNzgzMTU4NyxcbiAgYSAgICAgIDogMi43NjYzMTU5MixcbiAgcGVyaSAgIDogNzMuOTE3NzA4LFxuICBub2RlICAgOiA4MC40OTUxMjMsXG4gIGluY2wgICA6IDEwLjU4MzM5MyxcbiAgZXF1aW5veDogMjAwMC4wXG59O1xuXG52YXIgbiA9IEFzdHJvLkdBVVNTIC8gKHBhcmFtcy5hICogTWF0aC5zcXJ0KHBhcmFtcy5hKSk7XG52YXIgb2JqZWN0RGVmID0ge1xuICBuYW1lICAgOiAnQ2VyZXMnLFxuICBlcG9jaCAgOiAxOTk5MTExOC41LFxuICB0ICAgICAgOiAobmV3IEFUaW1lKHtqdWxpYW46IHRvZGF5dGltZS5qdWxpYW4gLSAoTWF0aC5QSSoyIC0gcGFyYW1zLk0pIC8gbiwgdGltZXpvbmU6IDAuMH0pKSxcbiAgZSAgICAgIDogMC4wNzgzMTU4NyxcbiAgcSAgICAgIDogcGFyYW1zLmEgKiAoMS4wIC0gMC4wNzgzMTU4NyksXG4gIHBlcmkgICA6IDczLjkxNzcwOCxcbiAgbm9kZSAgIDogODAuNDk1MTIzLFxuICBpbmNsICAgOiAxMC41ODMzOTMsXG4gIGVxdWlub3g6IDIwMDAuMFxufTtcblxudmFyIG9iamVjdCA9IG5ldyBDb21ldChvYmplY3REZWYpO1xudmFyIG9yYml0Q2FudmFzID0gbmV3IE9yYml0Q2FudmFzKGN0eCwgb2JqZWN0LCB0b2RheXRpbWUpO1xub3JiaXRDYW52YXMudXBkYXRlKCk7XG5cbmZ1bmN0aW9uIE9yYml0Q2FudmFzKGNhbnZhcywgb2JqZWN0LCBhdGltZSkge1xuXG4gIHZhciBwbGFuZXRDb3VudCA9IDg7XG4gIHZhciBjZW50ZXJPYmplY3RTZWxlY3RlZCA9IDA7XG4gIC8vIHZhciBvYmplY3QgPSBvYmplY3Q7XG5cbiAgLyoqXG4gICAqIERhdGVcbiAgICovXG4gIC8vIHRoaXMuYXRpbWUgPSBhdGltZTtcblxuICAvKipcbiAgICogUHJvamVjdGlvbiBQYXJhbWV0ZXJzXG4gICAqL1xuICB2YXIgem9vbSAgICA9IDUuMDtcbiAgdmFyIHJvdGF0ZUggPSAxNS4wO1xuICB2YXIgcm90YXRlViA9IDE1LjA7XG5cbiAgLyoqXG4gICAqIFJvdGF0aW9uIE1hdHJpeFxuICAgKi9cbiAgdmFyIG10eFRvRWNsICAgPSBudWxsO1xuICB2YXIgZXBvY2hUb0VjbCA9IG51bGw7XG4gIHZhciBtdHhSb3RhdGUgID0gbnVsbDtcbiAgdmFyIHgwID0gMDsgdmFyIHkwID0gMDsgLy8gT3JpZ2luXG5cbiAgLyoqXG4gICAqIE9yYml0YWwgQ3VydmUgQ2xhc3MgKEluaXRpYWxpemVkIGluIENvbnN0cnVjdG9yKVxuICAgKi9cbiAgdmFyIG9iamVjdE9yYml0O1xuICB2YXIgZXBvY2hQbGFuZXRPcmJpdDtcbiAgdmFyIHBsYW5ldE9yYml0ID0gW107XG4gIC8vIGZvcih2YXIgcG8gPSAwOyBwbyA8IHBsYW5ldENvdW50OyBwbysrKXtcbiAgLy8gICBwbGFuZXRPcmJpdC5wdXNoKG5ldyBQbGFuZXRPcmJpdCgpKTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBDb2xvcnNcbiAgICovXG4gIHZhciBjb2xvckJhY2tncm91bmQgICAgICAgPSAnIzAwMDAwMCc7XG4gIHZhciBjb2xvck9iamVjdE9yYml0VXBwZXIgPSAnIzAwRjVGRic7XG4gIHZhciBjb2xvck9iamVjdE9yYml0TG93ZXIgPSAnIzAwMDBGRic7XG4gIHZhciBjb2xvck9iamVjdCAgICAgICAgICAgPSAnIzAwRkZGRic7XG4gIHZhciBjb2xvck9iamVjdE5hbWUgICAgICAgPSAnIzAwQ0NDQyc7XG4gIHZhciBjb2xvclBsYW5ldE9yYml0VXBwZXIgPSAnI0ZGRkZGRic7XG4gIHZhciBjb2xvclBsYW5ldE9yYml0TG93ZXIgPSAnIzgwODA4MCc7XG4gIHZhciBjb2xvclBsYW5ldCAgICAgICAgICAgPSAnIzAwRkYwMCc7XG4gIHZhciBjb2xvclBsYW5ldE5hbWUgICAgICAgPSAnIzAwQUEwMCc7XG4gIHZhciBjb2xvclN1biAgICAgICAgICAgICAgPSAnI0QwNDA0MCc7XG4gIHZhciBjb2xvckF4aXNQbHVzICAgICAgICAgPSAnI0ZGRkYwMCc7XG4gIHZhciBjb2xvckF4aXNNaW51cyAgICAgICAgPSAnIzU1NTUwMCc7XG4gIHZhciBjb2xvckluZm9ybWF0aW9uICAgICAgPSAnI0ZGRkZGRic7XG5cbiAgdmFyIHBsYW5ldFBvcyA9IFtdO1xuICBmb3IodmFyIHAgPSAwOyBwIDwgcGxhbmV0Q291bnQ7IHArKyl7XG4gICAgcGxhbmV0UG9zLnB1c2gobmV3IFh5eigpKTtcbiAgfVxuXG4gIHZhciBvcmJpdERpc3BsYXkgPSBbXTtcbiAgZm9yKHZhciBvID0gMDsgbyA8IHBsYW5ldENvdW50KzI7IG8rKyl7XG4gICAgb3JiaXREaXNwbGF5LnB1c2godHJ1ZSk7XG4gIH1cbiAgb3JiaXREaXNwbGF5WzBdID0gZmFsc2U7XG5cbiAgdmFyIGluaXQgPSBmdW5jdGlvbigpe1xuICAgIG9iamVjdE9yYml0ID0gbmV3IENvbWV0T3JiaXQob2JqZWN0LCAxMjApO1xuICAgIC8vIHVwZGF0ZVBsYW5ldE9yYml0KGF0aW1lKTtcbiAgICB1cGRhdGVSb3RhdGlvbk1hdHJpeChhdGltZSk7XG4gICAgc2V0RGF0ZShhdGltZSk7XG4gIH07XG5cbiAgLy8gbm8gb2Zmc2NyZWVuIGltYWdlXG4gIG9mZnNjcmVlbiA9IG51bGw7XG5cbiAgLy8gbm8gbmFtZSBsYWJlbHNcbiAgYlBsYW5ldE5hbWUgPSBmYWxzZTtcbiAgYk9iamVjdE5hbWUgPSBmYWxzZTtcbiAgYkRpc3RhbmNlTGFiZWwgPSB0cnVlO1xuICBiRGF0ZUxhYmVsID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBkcmF3TGluZSh4MCwgeTAsIHgxLCB5MSl7XG4gICAgICBjYW52YXMuYmVnaW5QYXRoKCk7XG4gICAgICBjYW52YXMubW92ZVRvKHgwLCB5MCk7XG4gICAgICBjYW52YXMubGluZVRvKHgxLCB5MSk7XG4gICAgICBjYW52YXMuY2xvc2VQYXRoKCk7XG4gICAgICBjYW52YXMuc3Ryb2tlKCk7XG4gIH1cblxuICB2YXIgZHJhd0VsaXB0aWNBeGlzID0gZnVuY3Rpb24oKXtcbiAgICAgIHZhciB4eXosIHBvaW50O1xuICAgICAgY2FudmFzLnN0cm9rZVN0eWxlID0gY29sb3JBeGlzTWludXM7XG5cbiAgICAgIC8vIC1YXG4gICAgICB4eXogPSAobmV3IFh5eigtNTAuMCwgMC4wLCAwLjApKS5yb3RhdGUobXR4Um90YXRlKTtcbiAgICAgIHBvaW50ID0gZ2V0RHJhd1BvaW50KHh5eik7XG4gICAgICBkcmF3TGluZSh4MCwgeTAsIHBvaW50LngsIHBvaW50LnkpO1xuXG4gICAgICAvLyAtWlxuICAgICAgeHl6ID0gKG5ldyBYeXooMC4wLCAwLjAsIC01MC4wKSkucm90YXRlKG10eFJvdGF0ZSk7XG4gICAgICBwb2ludCA9IGdldERyYXdQb2ludCh4eXopO1xuICAgICAgZHJhd0xpbmUoeDAsIHkwLCBwb2ludC54LCBwb2ludC55KTtcblxuICAgICAgY2FudmFzLnN0cm9rZVN0eWxlID0gY29sb3JBeGlzUGx1cztcblxuICAgICAgLy8gK1hcbiAgICAgIHh5eiA9IChuZXcgWHl6KCA1MC4wLCAwLjAsIDAuMCkpLnJvdGF0ZShtdHhSb3RhdGUpO1xuICAgICAgcG9pbnQgPSBnZXREcmF3UG9pbnQoeHl6KTtcbiAgICAgIGRyYXdMaW5lKHgwLCB5MCwgcG9pbnQueCwgcG9pbnQueSk7XG4gICAgICAvLyArWlxuICAgICAgeHl6ID0gKG5ldyBYeXooMC4wLCAwLjAsIDUwLjApKS5yb3RhdGUobXR4Um90YXRlKTtcbiAgICAgIHBvaW50ID0gZ2V0RHJhd1BvaW50KHh5eik7XG4gICAgICBkcmF3TGluZSh4MCwgeTAsIHBvaW50LngsIHBvaW50LnkpO1xuICB9O1xuXG4gIHZhciBnZXREcmF3UG9pbnQgPSBmdW5jdGlvbih4eXopIHtcbiAgICAvLyA2MDAgbWVhbnMgNS4uLmZab29tLi4uMTAwIC0+IDEyMEFVLi4uV2lkdGguLi42QVVcbiAgICB2YXIgbXVsID0gem9vbSAqIGNhbnZhc0VsZW1lbnQud2lkdGggLyA2MDAuMCAqXG4gICAgICAgICAgICAgICAoMS4wICsgeHl6LnogLyAyNTAuMCk7ICAgLy8gUGFyc2VcbiAgICB2YXIgeCA9IHgwICsgTWF0aC5yb3VuZCh4eXoueCAqIG11bCk7XG4gICAgdmFyIHkgPSB5MCAtIE1hdGgucm91bmQoeHl6LnkgKiBtdWwpO1xuICAgIHJldHVybiB7eDogeCwgeTogeX07XG4gIH07XG5cbiAgLyoqXG4gICAqIERhdGUgUGFyYW1ldGVyIFNldFxuICAgKi9cbiAgdmFyIHNldERhdGUgPSBmdW5jdGlvbihhdGltZSkge1xuICAgIG9iamVjdFBvcyA9IG9iamVjdC5nZXRQb3NpdGlvbihhdGltZS5qdWxpYW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxhbmV0Q291bnQ7IGkrKykge1xuICAgICAgcGxhbmV0UG9zW2ldID0gUGxhbmV0LmdldFBvc2l0aW9uKFBsYW5ldHMuTWVyY3VyeStpLCBhdGltZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSb3RhdGlvbiBNYXRyaXggRXF1YXRvcmlhbCgyMDAwKS0+RWNsaXB0aWMoREFURSlcbiAgICovXG4gIHZhciB1cGRhdGVSb3RhdGlvbk1hdHJpeCA9IGZ1bmN0aW9uKGF0aW1lKSB7XG4gICAgdmFyIG10eFByZWMgPSBNYXRyaXgucHJlY01hdHJpeChBc3Ryby5KRDIwMDAsIGF0aW1lLmp1bGlhbik7XG4gICAgdmFyIG10eEVxdDJFY2wgPSBNYXRyaXgucm90YXRlWChBVGltZS5nZXRFcChhdGltZS5qdWxpYW4pKTtcbiAgICBtdHhUb0VjbCA9IG10eEVxdDJFY2wubXVsKG10eFByZWMpO1xuICAgIGVwb2NoVG9FY2wgPSBhdGltZS5qdWxpYW47XG4gIH07XG5cbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcG9pbnQzO1xuICAgIHZhciB4eXosIHh5ejE7XG5cbiAgICAvLyBDYWxjdWxhdGUgRHJhd2luZyBQYXJhbWV0ZXJcbiAgICB2YXIgbXR4Um90SCA9IE1hdHJpeC5yb3RhdGVaKHJvdGF0ZUggKiBNYXRoLlBJIC8gMTgwLjApO1xuICAgIHZhciBtdHhSb3RWID0gTWF0cml4LnJvdGF0ZVgocm90YXRlViAqIE1hdGguUEkgLyAxODAuMCk7XG4gICAgbXR4Um90YXRlID0gbXR4Um90Vi5tdWwobXR4Um90SCk7XG5cbiAgICB4MCA9IGNhbnZhc0VsZW1lbnQud2lkdGggIC8gMjtcbiAgICB5MCA9IGNhbnZhc0VsZW1lbnQuaGVpZ2h0IC8gMjtcblxuICAgIGlmIChNYXRoLmFicyhlcG9jaFRvRWNsIC0gYXRpbWUuanVsaWFuKSA+IDM2NS4yNDIyICogNSkge1xuICAgICAgdXBkYXRlUm90YXRpb25NYXRyaXgoYXRpbWUpO1xuICAgIH1cblxuICAgIC8vIElmIGNlbnRlciBvYmplY3QgaXMgY29tZXQvYXN0ZXJvaWRcbiAgICBpZiAoY2VudGVyT2JqZWN0U2VsZWN0ZWQgPT0gMSApICAge1xuICAgICAgIHh5eiA9IG9iamVjdE9yYml0LmdldEF0KDApLnJvdGF0ZShtdHhUb0VjbCkucm90YXRlKG10eFJvdGF0ZSk7XG4gICAgICAgeHl6ID0gb2JqZWN0UG9zLnJvdGF0ZShtdHhUb0VjbCkuUm90YXRlKG10eFJvdGF0ZSk7XG4gICAgICAgcG9pbnQzID0gZ2V0RHJhd1BvaW50KHh5eik7XG5cbiAgICAgICB4MCA9IGNhbnZhc0VsZW1lbnQud2lkdGggLSBwb2ludDMueDtcbiAgICAgICB5MCA9IGNhbnZhc0VsZW1lbnQuaGVpZ2h0IC0gcG9pbnQzLnk7XG5cbiAgICAgICBpZiAoTWF0aC5hYnMoZXBvY2hUb0VjbCAtIGF0aW1lLmp1bGlhbikgPiAzNjUuMjQyMiAqIDUpIHtcbiAgICAgICAgICAgIHVwZGF0ZVJvdGF0aW9uTWF0cml4KGF0aW1lKTtcbiAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIGNlbnRlciBvYmplY3QgaXMgb25lIG9mIHRoZSBwbGFuZXRzXG4gICAgZWxzZSBpZiAoY2VudGVyT2JqZWN0U2VsZWN0ZWQgPiAxICkgICB7XG4gICAgICAgeHl6ID0gcGxhbmV0UG9zW2NlbnRlck9iamVjdFNlbGVjdGVkIC0yXS5Sb3RhdGUodGhpcy5tdHhSb3RhdGUpO1xuXG4gICAgICAgcG9pbnQzID0gZ2V0RHJhd1BvaW50KHh5eik7XG5cbiAgICAgICB4MCA9IGNhbnZhc0VsZW1lbnQud2lkdGggLSBwb2ludDMueDtcbiAgICAgICB5MCA9IGNhbnZhc0VsZW1lbnQuaGVpZ2h0IC0gcG9pbnQzLnk7XG5cbiAgICAgICBpZiAoTWF0aC5hYnMoZXBvY2hUb0VjbCAtIGF0aW1lLmp1bGlhbikgPiAzNjUuMjQyMiAqIDUpIHtcbiAgICAgICAgICAgIHVwZGF0ZVJvdGF0aW9uTWF0cml4KGF0aW1lKTtcbiAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2V0IE9mZi1TY3JlZW4gSW1hZ2UgR3JhcGhpY3MgQ29udGV4dFxuICAgIC8vIEdyYXBoaWNzIG9nID0gb2Zmc2NyZWVuLmdldEdyYXBoaWNzKCk7XG5cbiAgICAvLyBEcmF3IEZyYW1lXG4gICAgY2FudmFzLnN0cm9rZVN0eWxlID0gY29sb3JCYWNrZ3JvdW5kO1xuICAgIGNhbnZhcy5maWxsUmVjdCgwLCAwLCBjYW52YXNFbGVtZW50LndpZHRoIC0gMSwgY2FudmFzRWxlbWVudC5oZWlnaHQgLSAxKTtcblxuICAgIC8vIERyYXcgRWNsaXB0aWMgQXhpc1xuICAgIGRyYXdFbGlwdGljQXhpcygpO1xuXG4gICAgLy8gRHJhdyBTdW5cbiAgICBjYW52YXMuZmlsbFN0eWxlID0gY29sb3JTdW47XG4gICAgY2FudmFzLmJlZ2luUGF0aCgpO1xuICAgIGNhbnZhcy5hcmMoeDAgLSAyLCB5MCAtIDIsIDUsIDAsIE1hdGguUEkqMiwgdHJ1ZSk7XG4gICAgY2FudmFzLmZpbGwoKTtcblxuICAgIC8vIERyYXcgT3JiaXQgb2YgT2JqZWN0XG4gICAgeHl6ID0gb2JqZWN0T3JiaXQuZ2V0QXQoMCkucm90YXRlKG10eFRvRWNsKS5yb3RhdGUobXR4Um90YXRlKTtcbiAgICB2YXIgcG9pbnQxLCBwb2ludDI7XG4gICAgcG9pbnQxID0gZ2V0RHJhd1BvaW50KHh5eik7XG4gICAgaWYgKG9yYml0RGlzcGxheVswXSB8fCBvcmJpdERpc3BsYXlbMV0pIHtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IG9iamVjdE9yYml0LmRpdmlzaW9uOyBpKyspIHtcbiAgICAgICAgeHl6ID0gb2JqZWN0T3JiaXQuZ2V0QXQoaSkucm90YXRlKG10eFRvRWNsKTtcbiAgICAgICAgaWYgKHh5ei56ID49IDAuMCkge1xuICAgICAgICAgIGNhbnZhcy5zdHJva2VTdHlsZSA9IGNvbG9yT2JqZWN0T3JiaXRVcHBlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYW52YXMuc3Ryb2tlU3R5bGUgPSBjb2xvck9iamVjdE9yYml0TG93ZXI7XG4gICAgICAgIH1cbiAgICAgICAgeHl6ID0geHl6LnJvdGF0ZShtdHhSb3RhdGUpO1xuICAgICAgICBwb2ludDIgPSBnZXREcmF3UG9pbnQoeHl6KTtcbiAgICAgICAgZHJhd0xpbmUocG9pbnQxLngsIHBvaW50MS55LCBwb2ludDIueCwgcG9pbnQyLnkpO1xuICAgICAgICBwb2ludDEgPSBwb2ludDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLypcblxuICAgIC8vIERyYXcgT2JqZWN0IEJvZHlcbiAgICB4eXogPSB0aGlzLm9iamVjdFBvcy5Sb3RhdGUodGhpcy5tdHhUb0VjbCkuUm90YXRlKHRoaXMubXR4Um90YXRlKTtcbiAgICBwb2ludDEgPSBnZXREcmF3UG9pbnQoeHl6KTtcbiAgICBvZy5zZXRDb2xvcihjb2xvck9iamVjdCk7XG4gICAgb2cuZmlsbEFyYyhwb2ludDEueCAtIDIsIHBvaW50MS55IC0gMiwgNSwgNSwgMCwgMzYwKTtcbiAgICBvZy5zZXRGb250KGZvbnRPYmplY3ROYW1lKTtcbiAgICBpZiAoYk9iamVjdE5hbWUpIHtcbiAgICAgIG9nLnNldENvbG9yKGNvbG9yT2JqZWN0TmFtZSk7XG4gICAgICBvZy5kcmF3U3RyaW5nKG9iamVjdC5nZXROYW1lKCksIHBvaW50MS54ICsgNSwgcG9pbnQxLnkpO1xuICAgIH1cblxuICAgIC8vICBEcmF3IE9yYml0IG9mIFBsYW5ldHNcbiAgICBpZiAoTWF0aC5hYnMoZXBvY2hQbGFuZXRPcmJpdCAtIGF0aW1lLmdldEpkKCkpID4gMzY1LjI0MjIgKiA1KSB7XG4gICAgICB1cGRhdGVQbGFuZXRPcmJpdChhdGltZSk7XG4gICAgfVxuICAgIG9nLnNldEZvbnQoZm9udFBsYW5ldE5hbWUpO1xuXG4gICAgaWYgKE9yYml0RGlzcGxheVswXSB8fCBPcmJpdERpc3BsYXlbMTBdKSB7XG4gICAgICBkcmF3UGxhbmV0T3JiaXQob2csIHBsYW5ldE9yYml0W1BsYW5ldHMuUExVVE8tUGxhbmV0cy5NRVJDVVJZXSxcbiAgICAgICAgICAgICAgY29sb3JQbGFuZXRPcmJpdFVwcGVyLCBjb2xvclBsYW5ldE9yYml0TG93ZXIpO1xuICAgIH1cbiAgICBkcmF3UGxhbmV0Qm9keShvZywgcGxhbmV0UG9zWzhdLCBcIlBsdXRvXCIpO1xuXG4gICAgaWYgKE9yYml0RGlzcGxheVswXSB8fCBPcmJpdERpc3BsYXlbOV0pIHtcblxuICAgICAgZHJhd1BsYW5ldE9yYml0KG9nLCBwbGFuZXRPcmJpdFtQbGFuZXRzLk5FUFRVTkUtUGxhbmV0cy5NRVJDVVJZXSxcbiAgICAgICAgICAgICAgY29sb3JQbGFuZXRPcmJpdFVwcGVyLCBjb2xvclBsYW5ldE9yYml0TG93ZXIpO1xuICAgIH1cbiAgICBkcmF3UGxhbmV0Qm9keShvZywgcGxhbmV0UG9zWzddLCBcIk5lcHR1bmVcIik7XG5cbiAgICBpZiAoT3JiaXREaXNwbGF5WzBdIHx8IE9yYml0RGlzcGxheVs4XSkge1xuICAgICAgZHJhd1BsYW5ldE9yYml0KG9nLCBwbGFuZXRPcmJpdFtQbGFuZXRzLlVSQU5VUy1QbGFuZXRzLk1FUkNVUlldLFxuICAgICAgICAgICAgICBjb2xvclBsYW5ldE9yYml0VXBwZXIsIGNvbG9yUGxhbmV0T3JiaXRMb3dlcik7XG4gICAgfVxuICAgIGRyYXdQbGFuZXRCb2R5KG9nLCBwbGFuZXRQb3NbNl0sIFwiVXJhbnVzXCIpO1xuXG4gICAgaWYgKE9yYml0RGlzcGxheVswXSB8fCBPcmJpdERpc3BsYXlbN10pIHtcbiAgICAgIGRyYXdQbGFuZXRPcmJpdChvZywgcGxhbmV0T3JiaXRbUGxhbmV0cy5TQVRVUk4tUGxhbmV0cy5NRVJDVVJZXSxcbiAgICAgICAgICAgICAgY29sb3JQbGFuZXRPcmJpdFVwcGVyLCBjb2xvclBsYW5ldE9yYml0TG93ZXIpO1xuICAgIH1cbiAgICBkcmF3UGxhbmV0Qm9keShvZywgcGxhbmV0UG9zWzVdLCBcIlNhdHVyblwiKTtcblxuICAgIGlmIChPcmJpdERpc3BsYXlbMF0gfHwgT3JiaXREaXNwbGF5WzZdKSB7XG4gICAgICBkcmF3UGxhbmV0T3JiaXQob2csIHBsYW5ldE9yYml0W1BsYW5ldHMuSlVQSVRFUi1QbGFuZXRzLk1FUkNVUlldLFxuICAgICAgICAgICAgICBjb2xvclBsYW5ldE9yYml0VXBwZXIsIGNvbG9yUGxhbmV0T3JiaXRMb3dlcik7XG4gICAgfVxuICAgIGRyYXdQbGFuZXRCb2R5KG9nLCBwbGFuZXRQb3NbNF0sIFwiSnVwaXRlclwiKTtcblxuICAgIGlmIChmWm9vbSAqIDEuNTI0ID49IDcuNSkge1xuICAgICAgaWYgKE9yYml0RGlzcGxheVswXSB8fCBPcmJpdERpc3BsYXlbNV0pIHtcblxuICAgICAgICBkcmF3UGxhbmV0T3JiaXQob2csIHBsYW5ldE9yYml0W1BsYW5ldHMuTUFSUy1QbGFuZXRzLk1FUkNVUlldLFxuICAgICAgICAgICAgICAgIGNvbG9yUGxhbmV0T3JiaXRVcHBlciwgY29sb3JQbGFuZXRPcmJpdExvd2VyKTtcbiAgICAgIH1cbiAgICAgIGRyYXdQbGFuZXRCb2R5KG9nLCBwbGFuZXRQb3NbM10sIFwiTWFyc1wiKTtcbiAgICB9XG4gICAgaWYgKGZab29tICogMS4wMDAgPj0gNy41KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT3JiaXREaXNwbGF5WzBdIHx8IE9yYml0RGlzcGxheVs0XSkge1xuXG4gICAgICAgICBkcmF3RWFydGhPcmJpdChvZywgcGxhbmV0T3JiaXRbUGxhbmV0cy5FQVJUSC1QbGFuZXRzLk1FUkNVUlldLFxuICAgICAgICAgICAgY29sb3JQbGFuZXRPcmJpdFVwcGVyLCBjb2xvclBsYW5ldE9yYml0VXBwZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgZHJhd1BsYW5ldEJvZHkob2csIHBsYW5ldFBvc1syXSwgXCJFYXJ0aFwiKTtcblxuICAgIH1cbiAgICBpZiAoZlpvb20gKiAwLjcyMyA+PSA3LjUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPcmJpdERpc3BsYXlbMF0gfHwgT3JiaXREaXNwbGF5WzNdKSB7XG4gICAgICAgICBkcmF3UGxhbmV0T3JiaXQob2csIHBsYW5ldE9yYml0W1BsYW5ldHMuVkVOVVMtUGxhbmV0cy5NRVJDVVJZXSxcbiAgICAgICAgICAgIGNvbG9yUGxhbmV0T3JiaXRVcHBlciwgY29sb3JQbGFuZXRPcmJpdExvd2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgIGRyYXdQbGFuZXRCb2R5KG9nLCBwbGFuZXRQb3NbMV0sIFwiVmVudXNcIik7XG4gICAgfVxuICAgIGlmIChmWm9vbSAqIDAuMzg3ID49IDcuNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9yYml0RGlzcGxheVswXSB8fCBPcmJpdERpc3BsYXlbMl0pIHtcbiAgICAgICAgIGRyYXdQbGFuZXRPcmJpdChvZywgcGxhbmV0T3JiaXRbUGxhbmV0cy5NRVJDVVJZLVBsYW5ldHMuTUVSQ1VSWV0sXG4gICAgICAgICAgICBjb2xvclBsYW5ldE9yYml0VXBwZXIsIGNvbG9yUGxhbmV0T3JiaXRMb3dlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICBkcmF3UGxhbmV0Qm9keShvZywgcGxhbmV0UG9zWzBdLCBcIk1lcmN1cnlcIik7XG4gICAgfVxuXG4gICAgLy8gSW5mb3JtYXRpb25cbiAgICBvZy5zZXRGb250KGZvbnRJbmZvcm1hdGlvbik7XG4gICAgb2cuc2V0Q29sb3IoY29sb3JJbmZvcm1hdGlvbik7XG4gICAgRm9udE1ldHJpY3MgZm0gPSBvZy5nZXRGb250TWV0cmljcygpO1xuXG4gICAgLy8gT2JqZWN0IE5hbWUgU3RyaW5nXG4gICAgcG9pbnQxLnggPSBmbS5jaGFyV2lkdGgoJ0EnKTtcbiAgICAvLyBwb2ludDEueSA9IHRoaXMuc2l6ZUNhbnZhcy5oZWlnaHQgLSBmbS5nZXREZXNjZW50KCkgLSBmbS5nZXRIZWlnaHQoKSAvIDM7XG4gICAgcG9pbnQxLnkgPSAyICogZm0uY2hhcldpZHRoKCdBJyk7XG4gICAgb2cuZHJhd1N0cmluZyhvYmplY3QuZ2V0TmFtZSgpLCBwb2ludDEueCwgcG9pbnQxLnkpO1xuXG4gICAgaWYgKGJEaXN0YW5jZUxhYmVsKSB7XG4gICAgICAvLyBFYXJ0aCAmIFN1biBEaXN0YW5jZVxuICAgICAgZG91YmxlIGVkaXN0YW5jZSwgc2Rpc3RhbmNlO1xuICAgICAgZG91YmxlIHhkaWZmLCB5ZGlmZiwgemRpZmY7XG4gICAgICAvLyBCaWdEZWNpbWFsIGEsdjtcbiAgICAgIFN0cmluZyBzdHJEaXN0O1xuICAgICAgeHl6ICA9IHRoaXMub2JqZWN0UG9zLlJvdGF0ZSh0aGlzLm10eFRvRWNsKS5Sb3RhdGUodGhpcy5tdHhSb3RhdGUpO1xuICAgICAgeHl6MSA9IHBsYW5ldFBvc1syXS5Sb3RhdGUodGhpcy5tdHhSb3RhdGUpO1xuICAgICAgc2Rpc3RhbmNlID0gTWF0aC5zcXJ0KCh4eXouZlggKiB4eXouZlgpICsgKHh5ei5mWSAqIHh5ei5mWSkgK1xuICAgICAgICAgICAgICAgICAgKHh5ei5mWiAqIHh5ei5mWikpICsgLjAwMDU7XG4gICAgICBzZGlzdGFuY2UgPSAoaW50KShzZGlzdGFuY2UgKiAxMDAwLjApLzEwMDAuMDtcbiAgICAgIHhkaWZmID0geHl6LmZYIC0geHl6MS5mWDtcbiAgICAgIHlkaWZmID0geHl6LmZZIC0geHl6MS5mWTtcbiAgICAgIHpkaWZmID0geHl6LmZaIC0geHl6MS5mWjtcbiAgICAgIGVkaXN0YW5jZSA9IE1hdGguc3FydCgoeGRpZmYgKiB4ZGlmZikgKyAoeWRpZmYgKiB5ZGlmZikgK1xuICAgICAgICAgICAgICAgICAgKHpkaWZmICogemRpZmYpKSArIC4wMDA1O1xuICAgICAgZWRpc3RhbmNlID0gKGludCkoZWRpc3RhbmNlICogMTAwMC4wKS8xMDAwLjA7XG4vLyAgICAgIGEgPSBuZXcgQmlnRGVjaW1hbCAoZWRpc3RhbmNlKTtcbi8vICAgICAgdiA9IGEuc2V0U2NhbGUgKDMsIEJpZ0RlY2ltYWwuUk9VTkRfSEFMRl9VUCk7XG4gICAgICBzdHJEaXN0ID0gXCJFYXJ0aCBEaXN0YW5jZTogXCIgKyBlZGlzdGFuY2UgKyBcIiBBVVwiO1xuICAgICAgcG9pbnQxLnggPSBmbS5jaGFyV2lkdGgoJ0EnKTtcbi8vICAgICAgcG9pbnQxLnkgPSB0aGlzLnNpemVDYW52YXMuaGVpZ2h0IC0gZm0uZ2V0RGVzY2VudCgpIC0gZm0uZ2V0SGVpZ2h0KCkgLyAzO1xuICAgICAgcG9pbnQxLnkgPSB0aGlzLnNpemVDYW52YXMuaGVpZ2h0IC0gZm0uZ2V0RGVzY2VudCgpIC0gZm0uZ2V0SGVpZ2h0KCk7XG4gICAgICBvZy5kcmF3U3RyaW5nKHN0ckRpc3QsIHBvaW50MS54LCBwb2ludDEueSk7XG5cbi8vICAgICAgYSA9IG5ldyBCaWdEZWNpbWFsIChzZGlzdGFuY2UpO1xuLy8gICAgICB2ID0gYS5zZXRTY2FsZSAoMywgQmlnRGVjaW1hbC5ST1VORF9IQUxGX1VQKTtcbiAgICAgIHN0ckRpc3QgPSBcIlN1biBEaXN0YW5jZSAgOiBcIiArIHNkaXN0YW5jZSArIFwiIEFVXCI7XG4gICAgICBwb2ludDEueCA9IGZtLmNoYXJXaWR0aCgnQScpO1xuICAgICAgcG9pbnQxLnkgPSB0aGlzLnNpemVDYW52YXMuaGVpZ2h0IC0gZm0uZ2V0RGVzY2VudCgpIC0gZm0uZ2V0SGVpZ2h0KCkgLyAzO1xuICAgICAgb2cuZHJhd1N0cmluZyhzdHJEaXN0LCBwb2ludDEueCwgcG9pbnQxLnkpO1xuICAgIH1cbiAgKi9cbiAgfTtcblxuICBpbml0KCk7XG5cbn1cbiJdfQ==
