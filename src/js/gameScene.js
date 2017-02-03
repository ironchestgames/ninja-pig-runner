var p2 = require('p2')
var DebugDraw = require('./DebugDraw')

var pixelsPerMeter = 50
var widthInMeters
var heightInMeters

var world = new p2.World({
  gravity: [0, 10]
})

var PLAYER = Math.pow(2, 0)
var WALL = Math.pow(2, 1)
var SENSOR = Math.pow(2, 2)

window.world = world

var isDown = false
var touchPointInMeters

var hookPoint
var hookBody
var hookConstraint
var isHooked = false
var shouldRemoveHook = false
var shouldAddHook = false

var ninjaBody
var ninjaSprite

var ninjaRunSensorShape

var isRunning = 0

var lineGraphics

var onDown = function (event) {
  if (isDown === false) { // isHooked === false instead
    if (event.changedTouches) {
      event.clientX = event.changedTouches[0].clientX
      event.clientY = event.changedTouches[0].clientY
    }
    isDown = true
    touchPointInMeters = [
      (-this.stage.x + event.clientX) / pixelsPerMeter,
      event.clientY / pixelsPerMeter,
    ]
    setupHook()
  }
}

var onUp = function () {
  if (isDown === true) {
    isDown = false
    removeHook()
  }
}

var setupNinjaAndHook = function() {


  ninjaBody = new p2.Body({
    mass: 0.5,
    position: [3, 0],
    velocity: [0.5, 0],
  })
  ninjaBody.fixedRotation = true

  var circleShape = new p2.Circle({
    radius: (64 / 2) / pixelsPerMeter,
    collisionGroup: PLAYER,
    collisionMask: WALL,
  })
  ninjaBody.addShape(circleShape)
  circleShape.name = 'ninjaShape'

  ninjaRunSensorShape = new p2.Circle({
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    sensor: true,
  })
  ninjaBody.addShape(ninjaRunSensorShape)
  ninjaRunSensorShape.position = [0, 0.7]
  ninjaRunSensorShape.worldPosition = [0, 0]
  ninjaRunSensorShape.previousWorldPosition = [0, 0]
  ninjaRunSensorShape.name = 'ninjaRunSensorShape'

  ninjaBody.damping = 0
  ninjaBody.angularDamping = 0
  ninjaBody.name = 'ninjaBody'
  world.addBody(ninjaBody)

  // setup hook body
  hookBody = new p2.Body({
    position: [10, 0],
    mass: 0, // static
  })

  world.addBody(hookBody)

  // setup hook constraint
  hookConstraint = new p2.DistanceConstraint(hookBody, ninjaBody)
  hookConstraint.upperLimitEnabled = true
  hookConstraint.lowerLimitEnabled = true
  hookConstraint.upperLimit = 1
  hookConstraint.lowerLimit = 0
  // hookConstraint.setStiffness(100)
  // hookConstraint.setRelaxation(4)

}

var setupHook = function () {
  shouldAddHook = true
}

var removeHook = function () {
  shouldRemoveHook = true
}

var setupMap = function (stage) {

  var offsetX = widthInMeters * 0.5
  var boxWidth = widthInMeters / 3

  for (var i = 0; i < 100; i++) {
    var shapeWidth = boxWidth
    var shapeHeight = heightInMeters / 6
    var shapeX = offsetX + (widthInMeters / 1.7) * i
    var shapeY = heightInMeters * 0.22
    if (i % 2 === 1) {
      shapeY = heightInMeters * 0.35
      shapeHeight = heightInMeters / 4
    } else if (i % 3 === 1) {
      shapeHeight = heightInMeters / 4
      shapeWidth = 10
      shapeY = heightInMeters - shapeHeight / 2
    }
    shapeY = Math.random() * heightInMeters

    var body = new p2.Body({
      mass: 0,
      position: [shapeX, shapeY],
    })
    body.name = 'wall1'

    var shape = new p2.Box({
      width: shapeWidth,
      height: shapeHeight,
      position: [0, 0],
      collisionGroup: WALL,
      collisionMask: PLAYER | SENSOR,
    })

    shape.name = 'wall'

    body.addShape(shape)
    world.addBody(body)

    var sprite = new PIXI.Graphics()
    sprite.beginFill(0x003333)
    sprite.drawRect(
      (shapeX - shapeWidth / 2) * pixelsPerMeter,
      (shapeY - shapeHeight / 2) * pixelsPerMeter,
      shapeWidth * pixelsPerMeter,
      shapeHeight * pixelsPerMeter)
    stage.addChild(sprite)

    // another one at the same x
    shapeY = Math.random() * heightInMeters

    var body = new p2.Body({
      mass: 0,
      position: [shapeX, shapeY],
    })
    body.name = 'wall2'

    var shape = new p2.Box({
      width: shapeWidth,
      height: shapeHeight,
      position: [0, 0],
      collisionGroup: WALL,
      collisionMask: PLAYER | SENSOR,
    })
    shape.name = 'wall2'

    body.addShape(shape)
    world.addBody(body)

    var sprite = new PIXI.Graphics()
    sprite.beginFill(0x003333)
    sprite.drawRect(
      (shapeX - shapeWidth / 2) * pixelsPerMeter,
      (shapeY - shapeHeight / 2) * pixelsPerMeter,
      shapeWidth * pixelsPerMeter,
      shapeHeight * pixelsPerMeter)
    stage.addChild(sprite)
  }

}

var postStep = function () {

  if (shouldAddHook) {

    var dx = touchPointInMeters[0] - ninjaBody.position[0]
    var dy = touchPointInMeters[1] - ninjaBody.position[1]
    var angle = Math.atan2(dy, dx)
    var toX = Math.cos(angle) * 40 + ninjaBody.position[0]
    var toY = Math.sin(angle) * 40 + ninjaBody.position[1]

    var ray = new p2.Ray({
      mode: p2.Ray.CLOSEST,
      from: [ninjaBody.position[0], ninjaBody.position[1]],
      to: [toX, toY],
      collisionMask: WALL,
    })
    var result = new p2.RaycastResult()
    world.raycast(result, ray)

    if (result.hasHit()) {
      // Get the hit point
      var hitPoint = p2.vec2.create()
      result.getHitPoint(hitPoint, ray)
      hookPoint = hitPoint
      hookBody.position = hookPoint
      hookBody.previousPosition = hookPoint
      hookConstraint.upperLimit = p2.vec2.distance(hookPoint, ninjaBody.position)
      world.addConstraint(hookConstraint)
      isHooked = true
    }
    shouldAddHook = false
  }

  // console.log(hookBody.position[0] - ninjaBody.position[0])
  if (isHooked &&
      hookBody.position[0] - ninjaBody.position[0] < 0.1 &&
      ninjaBody.velocity[0] > 0 &&
      ninjaBody.velocity[1] < 0) {
    ninjaBody.applyForce([6, 0])
  }
  if (isHooked) {
    hookConstraint.upperLimit -= 0.022
    hookConstraint.update()
  }

  if (!isHooked && isRunning > 0) {
    // is on top of wall and should be running

    ninjaBody.velocity[0] = 8
    console.log('RUNNING')
  }

  if (shouldRemoveHook) {
    world.removeConstraint(hookConstraint)
    shouldRemoveHook = false
    isHooked = false
  }

  ninjaRunSensorShape.previousWorldPosition = p2.vec2.clone(ninjaRunSensorShape.worldPosition)
  ninjaBody.toWorldFrame(ninjaRunSensorShape.worldPosition, ninjaRunSensorShape.position)
}

var beginContact = function (contactEvent) {
  // console.log('beginContact', contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaRunSensorShape || contactEvent.shapeB === ninjaRunSensorShape) {
    isRunning++
  }
}

var endContact = function (contactEvent) {
  // console.log('endContact',  contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaRunSensorShape || contactEvent.shapeB === ninjaRunSensorShape) {
    isRunning--
  }
}

var gameScene = {
  name: 'game',
  create: function () {

    widthInMeters = this.renderer.view.width / pixelsPerMeter
    heightInMeters = this.renderer.view.height / pixelsPerMeter

    this.stage = new PIXI.Container()

    this.baseStage.addChild(this.stage)

    lineGraphics = new PIXI.Graphics()

    this.stage.addChild(lineGraphics)

    setupNinjaAndHook()

    setupMap(this.stage)

    ninjaSprite = new PIXI.Sprite(PIXI.loader.resources['ninja'].texture)

    // center the sprite's anchor point
    ninjaSprite.anchor.x = 0.5
    ninjaSprite.anchor.y = 0.5

    this.stage.addChild(ninjaSprite)

    console.log(ninjaSprite)

    console.log(world)

    world.on('beginContact', beginContact)
    world.on('endContact', endContact)
    world.on('postStep', postStep)

    var onDownBinded = onDown.bind(this)

    this.renderer.view.onmousedown = onDownBinded
    this.renderer.view.onmouseup = onUp

    this.renderer.view.addEventListener('touchstart', onDownBinded)
    this.renderer.view.addEventListener('touchend', onUp)

    this.debugDrawContainer = new PIXI.Container()

    this.stage.addChild(this.debugDrawContainer)

  },
  destroy: function () {
    this.stage = null
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

    var stepInSeconds = stepInMilliseconds / 1000
    world.step(stepInSeconds)

  },
  draw: function (renderer, ratio) {

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    ninjaSprite.x = (ninjaBody.position[0] * ratio + ninjaBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.y = (ninjaBody.position[1] * ratio + ninjaBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.rotation = (ninjaBody.angle * ratio + ninjaBody.previousAngle * (1 - ratio))

    lineGraphics.clear()
    if (isHooked) {
      var hookBodyX = (hookBody.position[0] * ratio + hookBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
      var hookBodyY = (hookBody.position[1] * ratio + hookBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter
      lineGraphics.lineStyle(4, 0x663311)
      lineGraphics.moveTo(ninjaSprite.x, ninjaSprite.y)
      lineGraphics.lineTo(hookBodyX, hookBodyY)
    }
      
    var x = (ninjaRunSensorShape.worldPosition[0] * ratio + ninjaRunSensorShape.previousWorldPosition[0] * (1 - ratio)) * pixelsPerMeter
    var y = (ninjaRunSensorShape.worldPosition[1] * ratio + ninjaRunSensorShape.previousWorldPosition[1] * (1 - ratio)) * pixelsPerMeter

    lineGraphics.lineStyle(2, 0xff0000)
    lineGraphics.drawCircle(
        x,
        y,
        ninjaRunSensorShape.radius * pixelsPerMeter)

    if (ninjaSprite.x > this.renderer.view.width / 4) {
      this.stage.x = -ninjaSprite.x + this.renderer.view.width / 4
    }

    DebugDraw.draw(this.debugDrawContainer, world, pixelsPerMeter, ratio)

  },
}

module.exports = gameScene
