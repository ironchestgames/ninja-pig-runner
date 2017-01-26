var p2 = require('p2')

var pixelsPerMeter = 50

var world = new p2.World({
  gravity: [0, 10]
})

window.world = world

var isDown = false

var hookPoint
var hookBody
var hookConstraint
var shouldRemoveHook = false
var shouldAddHook = false

var ninjaBody
var ninjaSprite

var lineGraphics

var onDown = function (event) {
  if (isDown === false) {
    isDown = true
    hookPoint = [
      (-this.stage.x + event.x) / pixelsPerMeter,
      event.y / pixelsPerMeter,
    ]
    console.log(hookPoint)
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
    mass: 1,
    position: [3, 0],
  })

  var circleShape = new p2.Circle({ radius: 0.02 });
  ninjaBody.addShape(circleShape)

  world.addBody(ninjaBody)

  // setup hook body
  hookBody = new p2.Body({
    position: [0, 0],
    mass: 0, // static
  })

  world.addBody(hookBody)

  // setup hook constraint
  hookConstraint = new p2.DistanceConstraint(hookBody, ninjaBody)
  hookConstraint.upperLimitEnabled = true
  hookConstraint.lowerLimitEnabled = true
  hookConstraint.upperLimit = 1
  hookConstraint.lowerLimit = 0
  hookConstraint.setStiffness(100)
  hookConstraint.setRelaxation(1)

}

var setupHook = function () {
  shouldAddHook = true
}

var removeHook = function () {
  shouldRemoveHook = true
}

var constrainVelocity = function (body, maxVelocity) {
  var angle
  var currVelocitySqr
  var vx
  var vy
  var newx
  var newy

  vx = body.velocity[0]
  vy = body.velocity[1]
  currVelocitySqr = vx * vx + vy * vy

  if (currVelocitySqr > maxVelocity * maxVelocity) {
    angle = Math.atan2(vy, vx)
    newx = Math.cos(angle) * maxVelocity
    newy = Math.sin(angle) * maxVelocity
    body.velocity[0] = newx
    body.velocity[1] = newy
    // console.log('limited speed to', maxVelocity)
  }
}

var postStep = function () {
  if (shouldRemoveHook) {
    world.removeConstraint(hookConstraint)
    shouldRemoveHook = false
  }
  if (shouldAddHook) {
    hookPoint[1] = 0
    hookBody.position = hookPoint
    hookBody.previousPosition = hookPoint
    world.addConstraint(hookConstraint)
    hookConstraint.upperLimit = p2.vec2.distance(hookPoint, ninjaBody.position)
    hookConstraint.update()
    shouldAddHook = false
  }
  if (isDown) {
    hookConstraint.upperLimit -= 0.022
    hookConstraint.update()
    // constrainVelocity(ninjaBody, 10.5)
  }
}


var gameScene = {
  name: 'game',
  create: function () {

    this.stage = new PIXI.Container()

    this.baseStage.addChild(this.stage)

    lineGraphics = new PIXI.Graphics()

    this.stage.addChild(lineGraphics)

    setupNinjaAndHook()

    ninjaSprite = new PIXI.Sprite(PIXI.loader.resources['ninja'].texture)

    // center the sprite's anchor point
    ninjaSprite.anchor.x = 0.5
    ninjaSprite.anchor.y = 0.5

    this.stage.addChild(ninjaSprite)

    console.log(ninjaSprite)

    console.log(world)

    world.on('postStep', postStep)

    this.renderer.view.onmousedown = onDown.bind(this)
    this.renderer.view.onmouseup = onUp

  },
  destroy: function () {
    this.stage = null
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

    // console.log(ninjaBody.position[0], ninjaBody.position[1])

    var stepInSeconds = stepInMilliseconds / 1000
    world.step(stepInSeconds)

  },
  draw: function (renderer, ratio) {

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    ninjaSprite.x = (ninjaBody.position[0] * ratio + ninjaBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.y = (ninjaBody.position[1] * ratio + ninjaBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter

    lineGraphics.clear()
    if (isDown) {
      var hookBodyX = (hookBody.position[0] * ratio + hookBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
      var hookBodyY = (hookBody.position[1] * ratio + hookBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter
      lineGraphics.lineStyle(4, 0x663311)
      lineGraphics.moveTo(ninjaSprite.x, ninjaSprite.y)
      lineGraphics.lineTo(hookBodyX, hookBodyY)
    }

    if (ninjaSprite.x > this.renderer.view.width / 2) {
      this.stage.x = -ninjaSprite.x + this.renderer.view.width / 2
    }

  },
}

module.exports = gameScene
