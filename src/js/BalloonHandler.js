var p2 = require('p2')
var gameVars = require('./gameVars')
var gameUtils = require('./gameUtils')

var tempVector = [0, 0]

var BalloonHandler = function (config) {

  this.world = config.world
  this.stringTexture = config.stringTexture
  this.pixelsPerMeter = config.pixelsPerMeter
  this.container = new PIXI.Container()

  config.container.addChild(this.container)

  this.constraints = []
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
  this.constraints.push(constraint)

  for (var i = 0; i < balloonBody.shapes.length; i++) {
    var shape = balloonBody.shapes[i]
    shape.collisionMask = gameVars.CAPTURED_BALLOON
    shape.collisionGroup = gameVars.CAPTURED_BALLOON
    shape.collisionResponse = true
  }

  // move balloon to captured collection
  var balloonIndex = this.balloonBodies.indexOf(balloonBody)
  this.balloonBodies.splice(balloonIndex, 1)

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

BalloonHandler.prototype.draw = function (ratio) {

  for (var i = 0; i < this.constraints.length; i++) {
    var balloonBody = this.constraints[i].bodyB
    var capturerBody = this.constraints[i].bodyA
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
      capturerBody.position[0],
      capturerBody.previousPosition[0],
      ratio) * this.pixelsPerMeter

    var ninjaY = gameUtils.calcInterpolatedValue(
      capturerBody.position[1],
      capturerBody.previousPosition[1],
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

  var balloonBody
  var closestBalloon
  var i
  var minBalloonY = -1.5
  var sprite

  for(i = this.balloonBodies.length - 1; i >= 0; i--) {
    balloonBody = this.balloonBodies[i]
    if (balloonBody.position[1] < minBalloonY) {
      this.balloonBodies.splice(i, 1)
      world.removeBody(balloonBody)

      // TODO: remove balloon sprite from dynamicSprites (gameScene)
      // TODO: lost balloon count
    }
  }

  closestBalloon = this.balloonBodies[0]

  for (i = 0; i < this.balloonBodies.length; i++) {
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
