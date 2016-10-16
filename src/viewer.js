var f = require('fabric')
var ATime = require('./atime')
var Comet = require('./comet')
var Canvas = require('./canvas')
var config = require('./config')

/**
 * Yes, I know this file is a complete mess. That's okay for now.
 * I'm still figuring out the best way to construct the control layer.
 * I'll sort this file out once I have the bigger picture in mind.
 */

window.showOrbitViewer = function (displayCanvasId, controlCanvasId, objectParams) {
  var objectDef = createObjectDef(objectParams)
  initializeCanvases(displayCanvasId, controlCanvasId, objectDef)
}

function createObjectDef (params) {
  var M = params.M * Math.PI / 180.0
  var epoch = ATime.ymdStringToATime(params.epoch)
  var n = Comet.GAUSS / (params.a * Math.sqrt(params.a))

  var t = new ATime({julian: epoch.julian + (Math.PI * 2.0 - M) / n, timezone: 0.0})
  if (M < Math.PI) {
    t = new ATime({julian: epoch.julian - M / n, timezone: 0.0})
  }

  var objectDef = {
    name: params.name,
    epoch: params.epoch,
    t: t.julian,
    e: params.e,
    q: params.a * (1.0 - 0.07831587),
    peri: params.peri * Math.PI / 180.0,
    node: params.node * Math.PI / 180.0,
    incl: params.incl * Math.PI / 180.0,
    equinox: params.equinox
  }

  return objectDef
}

function initializeCanvases (displayCanvasId, controlCanvasId, objectDef) {
  var fab = new f.fabric.Canvas(controlCanvasId, {
    backgroundColor: 'rgba(0, 0, 0, 0)',
    selection: false
  })

  var canvasElement = document.getElementById(displayCanvasId)
  var ctx = canvasElement.getContext('2d')
  var dimensions = {width: canvasElement.width, height: canvasElement.height}
  config.dimensions = dimensions
  config.datetime = ATime.getToday()

  var object = new Comet(objectDef)
  var orbitCanvas = new Canvas(ctx, config, object)
  orbitCanvas.update()

  var applyConfig = function () {
    orbitCanvas.setConfig(config)
    orbitCanvas.update()
  }

  /**
   * Zoom controls
   */

  var zoomMax = 600
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
  zoomIn.id = 'zoomIn'
  var plus = new f.fabric.Text('+', {
    selectable: false,
    fontSize: 16,
    stroke: 'white',
    top: 388,
    left: 26
  })
  plus.id = 'plus'
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
  zoomOut.id = 'zoomOut'
  var minus = new f.fabric.Text('-', {
    selectable: false,
    fontSize: 16,
    stroke: 'white',
    top: 417,
    left: 28
  })
  minus.id = 'minus'

  var borderHack = new f.fabric.Rect({
    top: 0,
    left: 0,
    width: 784,
    height: 461,
    stroke: 'black',
    selectable: false,
    fill: 'rgba(0,0,0,0)'
  })

  fab.add(borderHack)
  fab.add(zoomIn)
  fab.add(plus)
  fab.add(zoomOut)
  fab.add(minus)

  fab.on('mouse:down', function (options) {
    var newZoom = config.zoom
    var t = options.target
    if (t) {
      if (t.id === 'zoomIn' || t.id === 'plus') {
        newZoom = config.zoom + 5
        if (newZoom >= zoomMax) return
      }
      if (t.id === 'zoomOut' || t.id === 'minus') {
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
    originX = options.e.clientX
    originY = options.e.clientY
    initialX = config.horizontalRotation
    initialY = config.verticalRotation
  })
  fab.on('mouse:up', function () {
    rotating = false
  })
  fab.on('mouse:move', function (event) {
    if (!rotating) return
    var moveX = event.e.clientX
    var moveY = event.e.clientY
    var newValueX = initialX + ((originX - moveX) * 0.5)
    var newValueY = initialY + ((originY - moveY) * 0.5)
    config.horizontalRotation = newValueX
    config.verticalRotation = newValueY
    applyConfig()
  })
}
