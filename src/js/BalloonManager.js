var p2 = require('p2')
var gameVars = require('./gameVars')
var gameUtils = require('./gameUtils')

var tempVector = [0, 0]

var BalloonManager = function (config) {

  this.world = config.world
  this.stringTexture = config.stringTexture
  this.pixelsPerMeter = config.pixelsPerMeter
  this.balloonHolderBody = config.balloonHolderBody
  this.wakeUpDistance = config.wakeUpDistance
  this.container = new PIXI.Container()

  config.container.addChild(this.container)

  this.constraints = []
  this.balloonBodies = []
  this.capturedBalloonIds = {}
  this.balloonStringSprites = {}
  this.localBalloonKnotAnchor = [0, 0.25]

  // populate balloonBodies from world
  for (var i = 0; i < world.bodies.length; i++) {
    var body = world.bodies[i]
    if (body.name === 'balloon') {

      body.sleep()

      this.balloonBodies.push(body)
    }
  }

}

BalloonManager.prototype.destroy = function () {
  // NOTE: can not set balloonHolderBody to null here, might be draw call after destroy
  // TODO: double check if the above note could actually be true
}

BalloonManager.prototype.captureBalloon = function (balloonBody) {
  balloonBody.isCaptured = true
}

BalloonManager.prototype.popBalloon = function (balloonBody) {
  // TODO: make it nicer, change sprite fall down and shit

  balloonBody.popped = true

}

BalloonManager.prototype.draw = function (ratio) {

  for (var i = 0; i < this.constraints.length; i++) {
    var balloonBody = this.constraints[i].bodyB
    var capturerBody = this.constraints[i].bodyA
    var sprite = this.balloonStringSprites[balloonBody.id]

    balloonBody.toWorldFrame(tempVector, this.localBalloonKnotAnchor)

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

BalloonManager.prototype.postStep = function () {

  var balloonBody
  var closestBalloon
  var closestBalloonDistance
  var distance
  var i
  var j
  var minBalloonY = -1.5
  var shape
  var sprite

  // capture all isCaptured flagged balloons
  for (i = 0; i < this.balloonBodies.length; i++) {

    balloonBody = this.balloonBodies[i]

    if (!this.capturedBalloonIds[balloonBody.id] && balloonBody.isCaptured) {

      // constrain balloon to balloon holder
      var constraint = new p2.DistanceConstraint(this.balloonHolderBody, balloonBody, {
        localAnchorB: p2.vec2.clone(this.localBalloonKnotAnchor),
      })
      constraint.upperLimitEnabled = true
      constraint.lowerLimitEnabled = true
      constraint.lowerLimit = 0
      constraint.upperLimit = 0.5
      constraint.setStiffness(10)
      constraint.setRelaxation(1)
      this.world.addConstraint(constraint)
      this.constraints.push(constraint)

      for (j = 0; j < balloonBody.shapes.length; j++) {
        shape = balloonBody.shapes[j]
        shape.collisionMask = gameVars.CAPTURED_BALLOON | gameVars.SPIKES
        shape.collisionGroup = gameVars.CAPTURED_BALLOON
        shape.collisionResponse = true
      }

      // drawing the string needs previous position
      balloonBody.localAnchorBPreviousWorldPosition = [0, 0]
      balloonBody.toWorldFrame(
          balloonBody.localAnchorBPreviousWorldPosition,
          this.localBalloonKnotAnchor)

      sprite = new PIXI.Sprite(this.stringTexture)
      sprite.anchor.y = 0.5

      this.container.addChild(sprite)

      this.balloonStringSprites[balloonBody.id] = sprite

      this.capturedBalloonIds[balloonBody.id] = true
    }
  }

  // remove balloons that have flown away or popped
  // TODO: separate in two loops instead
  for(i = this.balloonBodies.length - 1; i >= 0; i--) {
    balloonBody = this.balloonBodies[i]

    if ((balloonBody.position[1] < minBalloonY && !this.capturedBalloonIds[balloonBody.id]) ||
        balloonBody.popped === true) {

      for(j = this.constraints.length - 1; j >= 0; j--) {
        if (this.constraints[j].bodyB === balloonBody) {
          this.world.removeConstraint(this.constraints[j])
          this.constraints.splice(j, 1)
          this.balloonStringSprites[balloonBody.id].destroy()
        }
      }

      this.balloonBodies.splice(i, 1)
      this.world.removeBody(balloonBody) // TODO: change gravityScale and mass instead
      this.capturedBalloonIds[balloonBody.id] = null

      // TODO: lost balloon count
    }
  }

  // wake the balloons within the wakeup distance
  for (i = 0; i < this.balloonBodies.length; i++) {
    balloonBody = this.balloonBodies[i]
    if (balloonBody.sleepState === p2.Body.SLEEPING &&
        p2.vec2.distance(this.balloonHolderBody.position, balloonBody.position) < this.wakeUpDistance) {
      balloonBody.wakeUp()
    }
  }

  // wake the closest ballon
  var nonCapturedBalloons = this.balloonBodies.filter(function (balloonBody) {
    return !balloonBody.isCaptured
  })

  nonCapturedBalloons.sort(function (a, b) {
    return a.position[0] > b.position[0]
  })

  if (nonCapturedBalloons[0] && nonCapturedBalloons[0].sleepState === p2.Body.SLEEPING) {
    nonCapturedBalloons[0].wakeUp()
  }

  this.closestBalloon = nonCapturedBalloons[0]

}

BalloonManager.prototype.getClosestBalloon = function () {
  return this.closestBalloon
}

module.exports = BalloonManager
