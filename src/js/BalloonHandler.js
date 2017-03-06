var p2 = require('p2')
var gameVars = require('./gameVars')
var gameUtils = require('./gameUtils')

var tempVector = [0, 0]

var BalloonHandler = function (config) {

  this.world = config.world
  this.stringTexture = config.stringTexture
  this.pixelsPerMeter = config.pixelsPerMeter
  this.ninjaBody = config.ninjaBody
  this.wakeUpDistance = config.wakeUpDistance
  this.container = new PIXI.Container()

  config.container.addChild(this.container)

  this.constraints = []
  this.balloonBodies = []
  this.capturedBalloonIds = []
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

BalloonHandler.prototype.destroy = function () {

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
    shape.collisionMask = gameVars.CAPTURED_BALLOON | gameVars.SPIKES
    shape.collisionGroup = gameVars.CAPTURED_BALLOON
    shape.collisionResponse = true
  }

  // move balloon to captured collection
  // var balloonIndex = this.balloonBodies.indexOf(balloonBody)
  // this.balloonBodies.splice(balloonIndex, 1)

  // drawing the string needs previous position
  balloonBody.localAnchorBPreviousWorldPosition = [0, 0]
  balloonBody.toWorldFrame(
      balloonBody.localAnchorBPreviousWorldPosition,
      this.localAnchor)

  var sprite = new PIXI.Sprite(this.stringTexture)
  sprite.anchor.y = 0.5

  this.container.addChild(sprite)

  this.balloonStringSprites[balloonBody.id] = sprite

  this.capturedBalloonIds.push(balloonBody.id)
}

BalloonHandler.prototype.popBalloon = function (balloonBody) {
  // TODO: make it nicer, change sprite fall down and shit

  balloonBody.popped = true

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
  var j
  var minBalloonY = -1.5
  var sprite

  // remove balloons that have flown away
  for(i = this.balloonBodies.length - 1; i >= 0; i--) {
    balloonBody = this.balloonBodies[i]

    var balloonBodyCapturedIndex = this.capturedBalloonIds.indexOf(balloonBody.id)

    if ((balloonBody.position[1] < minBalloonY && balloonBodyCapturedIndex === -1) ||
        balloonBody.popped === true) {

      for(j = this.constraints.length - 1; j >= 0; j--) {
        if (this.constraints[j].bodyB === balloonBody) {
          this.constraints.splice(j, 1)
          this.world.removeConstraint(this.constraints[j])

          this.balloonStringSprites[balloonBody.id].destroy()
        }
      }

      this.balloonBodies.splice(i, 1)
      this.world.removeBody(balloonBody) // TODO: change gravityScale and mass instead

      this.capturedBalloonIds.splice(balloonBodyCapturedIndex, 1)

      // TODO: lost balloon count
    }
  }

  // wake the balloons within the wakup distance
  for (i = 0; i < this.balloonBodies.length; i++) {
    balloonBody = this.balloonBodies[i]
    if (balloonBody.sleepState === p2.Body.SLEEPING &&
        p2.vec2.distance(this.ninjaBody.position, balloonBody.position) < this.wakeUpDistance) {
      balloonBody.wakeUp()
    }
  }

  // wake the closest ballon
  closestBalloon = this.balloonBodies[0]

  for (i = 0; i < this.balloonBodies.length; i++) {
    if (this.balloonBodies[i].position[0] < closestBalloon.position[0]) {
      closestBalloon = this.balloonBodies[i]
    }
  }

  if (closestBalloon && closestBalloon.sleepState === p2.Body.SLEEPING) {
    closestBalloon.wakeUp()
  }

  // set the closest balloon
  this.closestBalloon = closestBalloon
}

BalloonHandler.prototype.getClosestBalloon = function () {
  return this.closestBalloon
}

module.exports = BalloonHandler
