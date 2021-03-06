import * as f from 'fabric'

import ATime from './lib/atime'
import Comet from './lib/comet'
import config from './config'
import Canvas from './canvas'

/**
 * Yes, I know this file is a complete mess. That's okay for now.
 * I'm still figuring out the best way to construct the control layer.
 * I'll sort this file out once I have the bigger picture in mind.
 */

var params = {
  name: 'Ceres',
  epoch: 19991118.5,
  M: 356.648434,
  e: 0.07831587,
  a: 2.76631592,
  peri: 73.917708,
  node: 80.495123,
  incl: 10.583393,
  equinox: 2000.0
}

var t
var M = params.M * Math.PI / 180.0
var epoch = ATime.ymdStringToATime(params.epoch)
var n = Comet.GAUSS / (params.a * Math.sqrt(params.a))

if (M < Math.PI) {
  t = new ATime({julian: epoch.julian - M / n, timezone: 0.0})
} else {
  t = new ATime({julian: epoch.julian + (Math.PI * 2.0 - M) / n, timezone: 0.0})
}

var objectDef = {
  name: 'Ceres',
  epoch: params.epoch,
  t: t.julian,
  e: params.e,
  q: params.a * (1.0 - 0.07831587),
  peri: params.peri * Math.PI / 180.0,
  node: params.node * Math.PI / 180.0,
  incl: params.incl * Math.PI / 180.0,
  equinox: params.equinox
}

var fab = new f.fabric.Canvas('control-canvas', {
  backgroundColor: 'rgba(0, 0, 0, 0)',
  selection: false
})
var canvasElement = <HTMLCanvasElement> document.getElementById('display-canvas')
var ctx = canvasElement.getContext('2d')
var dimensions = {width: canvasElement.width, height: canvasElement.height}
config.dimensions = dimensions
config.datetime = ATime.getToday()
var object = new Comet(objectDef)
var orbitCanvas = new Canvas(ctx, config, object)
orbitCanvas.update()

var applyConfig = function () {
  zoomValue.innerText = config.zoom.toString()
  vRotValue.innerText = config.verticalRotation.toString()
  hRotValue.innerText = config.horizontalRotation.toString()
  orbitCanvas.setConfig(config)
  orbitCanvas.update()
}

/**
 * Zoom
 */

var zoomMax = 600
var zoom = document.getElementById('zoom')
var zoomValue = document.getElementById('zoomValue')

zoom.addEventListener('input', (e) => {
  var value = this.value
  if (value >= zoomMax) return
  config.zoom = value
  applyConfig()
})

/**
 * Horizontal rotation
 */

var hRotMax = 365
var hRot = document.getElementById('hRot')
var hRotValue = document.getElementById('hRotValue')

hRot.addEventListener('input', (e) => {
  var value = this.value
  if (value >= hRotMax) return
  config.horizontalRotation = value
  applyConfig()
})

/**
 * Vertical rotation
 */

var vRotMax = 180
var vRot = document.getElementById('vRot')
var vRotValue = document.getElementById('vRotValue')

vRot.addEventListener('input', (e) => {
  var value = this.value
  if (value >= vRotMax) return
  config.verticalRotation = value
  applyConfig()
})

/**
 * Zoom controls
 */
var zoomIn = new f.fabric.Rect({
  selectable: false,
  left: 20,
  top: 382,
  stroke: 'white',
  fill: 'rgba(0, 0, 0, 0.5)',
  width: 20,
  height: 30,
  rx: 0,
  ry: 0
})
// zoomIn.id = 'zoomIn'
var plus = new f.fabric.Text('+', {
  selectable: false,
  fontSize: 16,
  stroke: 'white',
  top: 388,
  left: 26
})
// plus.id = 'plus'
var zoomOut = new f.fabric.Rect({
  selectable: false,
  left: 20,
  top: 412,
  stroke: 'white',
  fill: 'rgba(0, 0, 0, 0.5)',
  width: 20,
  height: 30,
  rx: 0,
  ry: 0
})
// zoomOut.id = 'zoomOut'
var minus = new f.fabric.Text('-', {
  selectable: false,
  fontSize: 16,
  stroke: 'white',
  top: 417,
  left: 28
})
// minus.id = 'minus'
fab.add(zoomIn)
fab.add(plus)
fab.add(zoomOut)
fab.add(minus)

fab.on('mouse:down', function (options) {
  var newZoom = config.zoom
  var t = options.target
  if (t) {
    if (t === zoomIn || t === plus) {
      newZoom = config.zoom + 5
      if (newZoom >= zoomMax) return
    }
    if (t === zoomOut || t === minus) {
      newZoom = config.zoom - 5
      if (newZoom <= 0) return
    }
    config.zoom = newZoom
    applyConfig()
  }
})

/**
 * Rotation event handlers
 */
var originX = 0
var originY = 0
var initialX = 0
var initialY = 0
var rotating = false

fab.on('mouse:down', function (options) {
  rotating = true
  const e = <MouseEvent> options.e
  originX = e.clientX
  originY = e.clientY
  initialX = config.horizontalRotation
  initialY = config.verticalRotation
})
fab.on('mouse:up', function () {
  rotating = false
})
fab.on('mouse:move', function (options) {
  if (!rotating) return
  const e = <MouseEvent> options.e
  var moveX = e.clientX
  var moveY = e.clientY
  var newValueX = initialX + ((originX - moveX) * 0.5)
  var newValueY = initialY + ((originY - moveY) * 0.5)
  config.horizontalRotation = newValueX
  config.verticalRotation = newValueY
  applyConfig()
})
