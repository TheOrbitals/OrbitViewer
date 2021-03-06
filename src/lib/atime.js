var angles = require('angle-functions')

/**
 * Astronomical time module
 */

// Constants
var incTime = 1 // increment
var decTime = -1 // decrement
var JD2000 = 2451545.0 // Julian Day on 2000.1.1 12h ET
var JD1900 = 2415021.0 // Julian Day on 1900.1.1 12h ET

// Constructor
var ATime = function (datetime) {
  this.year = datetime.year
  this.month = datetime.month
  this.day = Math.floor(datetime.day || 0.0)

  if (datetime.timezone === null || datetime.timezone === undefined) {
    throw new Error('Timezone is required')
  }

  this.hour = datetime.hour
  if (!datetime.hour) {
    this.hour = Math.floor(((datetime.day || 0.0) - this.day) * 24.0)
  }

  this.minute = datetime.minute
  if (!datetime.minute) {
    this.minute = Math.floor(((datetime.hour || 0.0) - this.hour) * 60.0)
  }

  this.second = datetime.second
  if (!datetime.second) {
    this.second = Math.floor(((datetime.minute || 0.0) - this.minute) * 60.0)
  }

  this.timezone = datetime.timezone

  this.julian = datetime.julian || this._makeJulian() - datetime.timezone / 24.0
  this.time1 = this._makeTime1() // Origin 1974/12/31  0h ET
  this.time2 = this._makeTime2() // Origin 2000/01/01 12h ET
}

// Instance members
var atime = {
  /**
   * YMD/HMS -> Julian date
   */
  _makeJulian: function () {
    var year = this.year
    var month = this.month
    var date = this.day +
      this.hour / 24.0 +
      this.minute / 24.0 / 60.0 +
      this.second / 24.0 / 60.0 / 60.0
    if (month < 3) {
      month += 12
      year -= 1
    }
    var julian = Math.floor(365.25 * year) +
      Math.floor(30.59 * (month - 2)) +
      date + 1721086.5
    if (julian > 2299160.5) {
      julian += Math.floor(year / 400.0) -
        Math.floor(year / 100.0) + 2.0
    }
    return julian
  },

  /**
   * Time parameter origin of 1974/12/31  0h ET
   */
  _makeTime1: function () {
    // 2442412.5 = 1974.12.31 0h ET
    var ft = (this.julian - 2442412.5) / 365.25
    var time1 = ft + (0.0317 * ft + 1.43) * 0.000001
    return time1
  },

  /**
   * Time parameter origin of 2000/01/01 12h ET
   */
  _makeTime2: function () {
    var ft = (this.julian - JD2000) / 36525.0
    return ft
  },

  /**
   * Julian date -> YMD/HMS
   */
  _getDate: function (julian) {
    julian += 0.5
    var a = Math.floor(julian)
    if (a >= 2299160.5) {
      var t = Math.floor((a - 1867216.25) / 36524.25)
      a += t - Math.floor(t / 4.0) + 1.0
    }
    var b = Math.floor(a) + 1524
    var c = Math.floor((b - 122.1) / 365.25)
    var k = Math.floor((365.25) * c)
    var e = Math.floor((b - k) / 30.6001)
    var day = b - k - Math.floor(30.6001 * e) +
      (julian - Math.floor(julian))
    this.month = Math.floor(e - ((e >= 13.5) ? 13 : 1) + 0.5)
    this.year = Math.floor(c - ((this.month > 2) ? 4716 : 4715) + 0.5)
    this.day = Math.floor(day)
    var hour = (day - this.day) * 24.0
    this.hour = Math.floor(hour)
    var min = (hour - this.hour) * 60.0
    this.minute = Math.floor(min)
    this.second = (min - this.minute) * 60.0
  },

  _changeDate: function (span, incOrDec) {
    /**
     * First, calculate new hour, minute, and second
     */
    var fHms1 = this.hour * 60.0 * 60.0 + this.minute * 60.0 + this.second
    var fHms2 = span.hour * 60.0 * 60.0 + span.minute * 60.0 + span.second
    fHms1 += (incOrDec === incTime) ? fHms2 : -fHms2
    var nDay1
    if (fHms1 >= 0.0 && fHms1 < 24.0 * 60.0 * 60.0) {
      nDay1 = 0
    } else if (fHms1 >= 24.0 * 60.0 * 60.0) {
      nDay1 = Math.floor(fHms1 / 24.0 / 60.0 / 60.0)
      fHms1 = angles.mod(fHms1, 24.0 * 60.0 * 60.0)
    } else {
      nDay1 = Math.ceil(fHms1 / 24.0 / 60.0 / 60.0) - 1
      fHms1 = angles.mod(fHms1, 24.0 * 60.0 * 60.0) + 24.0 * 60.0 * 60.0
    }

    var nNewHour = Math.floor(fHms1 / 60.0 / 60.0)
    var nNewMin = Math.floor(fHms1 / 60.0) - nNewHour * 60
    var fNewSec = fHms1 - (nNewHour * 60.0 * 60.0 + nNewMin * 60.0)

    /**
     * Next, calculate new year, month, day
     */
    var newDate = new ATime({
      year: this.year,
      month: this.month,
      day: this.day,
      minute: 12,
      second: 0,
      timezone: 0.0
    })
    var julian = newDate.julian
    julian += (incOrDec === incTime) ? nDay1 + span.day : nDay1 - span.day
    newDate = new ATime({julian: julian, timezone: 0.0})

    var nNewYear = newDate.year
    var nNewMonth = newDate.month
    var nNewDay = newDate.day
    nNewMonth += (incOrDec === incTime) ? span.month : -span.month
    if (nNewMonth < 1) {
      nNewYear -= nNewMonth / 12 + 1
      nNewMonth = 12 + nNewMonth % 12
    } else if (nNewMonth > 12) {
      nNewYear += nNewMonth / 12
      nNewMonth = 1 + (nNewMonth - 1) % 12
    }
    nNewYear += (incOrDec === incTime) ? span.year : -span.year

    // check bound between julian and gregorian
    if (nNewYear === 1582 && nNewMonth === 10) {
      if (nNewDay >= 5 && nNewDay < 10) {
        nNewDay = 4
      } else if (nNewDay >= 10 && nNewDay < 15) {
        nNewDay = 15
      }
    }
    newDate = new ATime({
      year: nNewYear,
      month: nNewMonth,
      day: nNewDay,
      minute: 12,
      second: 0,
      timezone: 0
    })
    nNewYear = newDate.year
    nNewMonth = newDate.month
    nNewDay = newDate.day

    this.year = nNewYear
    this.month = nNewMonth
    this.day = nNewDay
    this.hour = nNewHour
    this.minute = nNewMin
    this.second = fNewSec
    this.julian = this._makeJulian() - this.timezone / 24.0
    this.time1 = this._makeTime1()
    this.time2 = this._makeTime2()
  },

  /**
   * Print to standard output
   */
  toString: function () {
    const {
      year, month, day,
      hour: hr, minute: min, second: sec,
      timezone: tz, julian: j
    } = this
    return `${year}/${month}/${day} ${hr}:${min}:${sec} = ${j} (TZ: ${tz})`
    // return this.year + '/' +
    //   this.month + '/' +
    //   this.day + ' ' +
    //   this.hour + ':' +
    //   this.minute + ':' +
    //   this.second + ' = ' + this.julian + ' (TZ:' +
    //   this.timezone + ')'
  }
}

/**
 * Obliquity of ecliptic
 */
var getEp = function (julian) {
  var ft = (julian - JD2000) / 36525.0
  if (ft > 30.0) { // Out of calculation range
    ft = 30.0
  } else if (ft < -30.0) {
    ft = -30.0
  }
  var fEp = 23.43929111 -
    46.8150 / 60.0 / 60.0 * ft -
    0.00059 / 60.0 / 60.0 * ft * ft +
    0.001813 / 60.0 / 60.0 * ft * ft * ft
  return fEp * Math.PI / 180.0
}

/**
 * Abbreviated month names
 */
var months = [
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May ', 'June',
  'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'
]

/**
 * Get abbreviated month name
 */
var getMonthAbbr = function (month) {
  return ATime.months[month - 1]
}

/**
 * Get an ATime for today
 */
var getToday = function () {
  var date = new Date()
  var today = {
    hour: 0,
    minute: 0,
    second: 0,
    timezone: 0.0,
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  }
  return new ATime(today)
}

var ymdStringToATime = function (strYmd) {
  var fYmd = parseFloat(strYmd)
  var nYear = Math.floor(fYmd / 10000.0)
  fYmd -= nYear * 10000.0
  var nMonth = Math.floor(fYmd / 100.0)
  var fDay = fYmd - nMonth * 100.0
  return new ATime({year: nYear, month: nMonth, day: fDay, timezone: 0.0})
}

// Static members
ATime.getEp = getEp
ATime.JD2000 = JD2000
ATime.JD1900 = JD1900
ATime.incTime = incTime
ATime.decTime = decTime
ATime.getToday = getToday
ATime.ymdStringToATime = ymdStringToATime
ATime.getMonthAbbr = getMonthAbbr
ATime.months = months

ATime.prototype = atime
export default ATime
