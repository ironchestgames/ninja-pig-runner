var p2 = require('p2')
var gameVars = require('./gameVars')
var gameUtils = require('./gameUtils')

var tempVector = [0, 0]

var BalloonHandler = function (config) {

  this.world = config.world
  this.container = config.container
  this.stringTexture = config.stringTexture
  this.pixelsPerMeter = config.pixelsPerMeter

  this.capturedBalloonBodies = []
  this.balloonBodies = []
  this.balloonStringSprites = {}
  this.localAnchor = [0, 0.25]

  // populate balloonBodies from world
  for (var i = 0; i < world.bodies.length; i++) {
    var body = world.bodies[i]
    if (body.name === 'balloon') {
      
      body.sleep()

      this.balloonBodies.push(body)
    }
  }

}

BalloonHandler.prototype.captureBalloon = function (balloonBody, balloonHolderBody) {

  // constrain balloon to balloon holder
  var constraint = new p2.DistanceConstraint(balloonHolderBody, balloonBody, {
    localAnchorB: this.localAnchor,
  })
  constraint.upperLimitEnabled = true
  constraint.lowerLimitEnabled = true
  constraint.lowerLimit = 0
  constraint.upperLimit = 0.5
  constraint.setStiffness(10)
  constraint.setRelaxation(1)
  this.world.addConstraint(constraint)

  for (var i = 0; i < balloonBody.shapes.length; i++) {
    var shape = balloonBody.shapes[i]
    shape.collisionMask = gameVars.CAPTURED_BALLOON
    shape.collisionGroup = gameVars.CAPTURED_BALLOON
    shape.collisionResponse = true
  }

  // move balloon to captured collection
  var balloonIndex = this.balloonBodies.indexOf(balloonBody)
  this.balloonBodies.splice(balloonIndex, 1)
  this.capturedBalloonBodies.push(balloonBody)

  // drawing the string needs previous position
  balloonBody.localAnchorBPreviousWorldPosition = [0, 0]
  balloonBody.toWorldFrame(
      balloonBody.localAnchorBPreviousWorldPosition,
      this.localAnchor)

  var sprite = new PIXI.Sprite(this.stringTexture)
  sprite.anchor.y = 0.5

  this.container.addChild(sprite)

  this.balloonStringSprites[balloonBody.id] = sprite
}

BalloonHandler.prototype.draw = function (ratio, ninjaBody) {

  for (var i = 0; i < this.capturedBalloonBodies.length; i++) {
    var balloonBody = this.capturedBalloonBodies[i]
    var sprite = this.balloonStringSprites[balloonBody.id]

    balloonBody.toWorldFrame(tempVector, this.localAnchor)

    var balloonX = gameUtils.calcInterpolatedValue(
        tempVector[0],
        balloonBody.localAnchorBPreviousWorldPosition[0],
        ratio) * this.pixelsPerMeter
    var balloonY = gameUtils.calcInterpolatedValue(
        tempVector[1],
        balloonBody.localAnchorBPreviousWorldPosition[1],
        ratio) * this.pixelsPerMeter

    balloonBody.localAnchorBPreviousWorldPosition = p2.vec2.clone(tempVector) // NOTE: save this world position

    var ninjaX = gameUtils.calcInterpolatedValue(
      ninjaBody.position[0],
      ninjaBody.previousPosition[0],
      ratio) * this.pixelsPerMeter

    var ninjaY = gameUtils.calcInterpolatedValue(
      ninjaBody.position[1],
      ninjaBody.previousPosition[1],
      ratio) * this.pixelsPerMeter

    var a = balloonX - ninjaX
    var b = balloonY - ninjaY
    sprite.x = ninjaX
    sprite.y = ninjaY
    sprite.width = Math.sqrt(a * a + b * b)
    sprite.rotation = Math.atan2(b, a)

  }
}

BalloonHandler.prototype.postStep = function () {

  var closestBalloon = this.balloonBodies[0]

  for (var i = 0; i < this.balloonBodies.length; i++) {
    if (this.balloonBodies[i].position[0] < closestBalloon.position[0]) {
      closestBalloon = this.balloonBodies[i]
    }
  }

  this.closestBalloon = closestBalloon

  if (closestBalloon && closestBalloon.sleepState === p2.Body.SLEEPING) {
    closestBalloon.wakeUp()
  }
}

BalloonHandler.prototype.getClosestBalloon = function () {
  return this.closestBalloon
}

module.exports = BalloonHandler
