/**
 * 3-Dimensional Vector
 */

// Constructor
function Xyz(x, y, z){
  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;
}

var xyz = {

  /**
   * Rotation of Vector with Matrix
   */
  rotate: function(mtx) {
    var x = mtx.fA11 * this.x + mtx.fA12 * this.y + mtx.fA13 * this.z;
    var y = mtx.fA21 * this.x + mtx.fA22 * this.y + mtx.fA23 * this.z;
    var z = mtx.fA31 * this.x + mtx.fA32 * this.y + mtx.fA33 * this.z;
    return new Xyz(x, y, z);
  },

  /**
   * V := V1 + V2
   */
  add: function(xyz) {
    var x = this.x + xyz.x;
    var y = this.y + xyz.y;
    var z = this.z + xyz.z;
    return new Xyz(x, y, z);
  },

  /**
   * V := V1 - V2
   */
  sub: function(xyz) {
    var x = this.x - xyz.x;
    var y = this.y - xyz.y;
    var z = this.z - xyz.z;
    return new Xyz(x, y, z);
  },

  /**
   * V := x * V;
   */
  mul: function(a) {
    var x = this.x * a;
    var y = this.y * a;
    var z = this.z * a;
    return new Xyz(x, y, z);
  },

  /**
   * x := abs(V);
   */
  abs: function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

};

/**
 * Wire up the module
 */
Xyz.prototype = xyz;
module.exports = Xyz;
