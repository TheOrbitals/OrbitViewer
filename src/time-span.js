/**
 * TimeSpan Class for ATime
 */

// Constructor
var TimeSpan = function (year, month, day, hour, minutes, seconds) {
  this.year = year
  this.month = month
  this.day = day
  this.hour = hour
  this.minutes = minutes
  this.seconds = seconds
}

/**
 * Wire up the module
 */
module.exports = TimeSpan
