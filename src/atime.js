var Astro = require('astro');

/**
 * Astronomical time module
 */

module.exports = function(datetime) {

  this.year = datetime.year;
  this.month = datetime.month;
  this.day = Math.floor(datetime.day);

  this.hour = datetime.hour;
  if(!datetime.hour) {
    this.hour = Math.floor((datetime.day - this.day) * 24.0);
  }

  this.minute = datetime.minute;
  if(!datetime.minute) {
    this.minute = Math.floor((datetime.hour - this.hour) * 60.0);
  }

  this.second = datetime.second;
  if(!datetime.second) {
    this.second = Math.floor((datetime.second - this.second) * 60.0);
  }

  this.julian = makeJulian() - timezone / 24.0;
  this.timezone = timezone;
  this.time1 = makeTime1(); // Origin 1974/12/31  0h ET
  this.time2 = makeTime2(); // Origin 2000/01/01 12h ET

  // flags for changeDate
  this.intTime = 1;
  this.decTime = -1;

  // abbreviated month names
  var months = [
    "Jan.", "Feb.", "Mar.", "Apr.", "May ", "June",
    "July", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."
  ];

  /**
   * Get Abbreviated Month Name
   */
  this.getMonthAbbr = function(month) {
    return months[month - 1];
  };

  /**
   * YMD/HMS -> Julian Date
   */
  var makeJulian = function() {
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
  var makeTime1 = function() {
    // 2442412.5 = 1974.12.31 0h ET
    var ft = (this.julian - 2442412.5) / 365.25;
    var time1 = ft + (0.0317 * ft + 1.43) * 0.000001;
    return time1;
  };

  /**
   * Time Parameter Origin of 2000/01/01 12h ET
   */
  var makeTime2 = function() {
    var ft = (julian - Astro.JD2000) / 36525.0;
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
   * Obliquity of Ecliptic (Static Function)
   */
  this.getEp = function(julian) {
    var ft = (julian - Astro.JD2000) / 36525.0;
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
           this.second   + " = " + julian + " (TZ:" +
           this.timezone + ")";
  };

};
