var p2 = require('p2')

var Hook = function (config) {
  this.world = config.world
  this.source = config.source
  this.relativeAimPoint = config.relativeAimPoint
  this.collisionMask = config.collisionMask
  this.shortenSpeed = config.shortenSpeed
  this.isHooked = false
  this.body = new p2.Body({
    position: [10, 0],
    mass: 0, // static
  })
  this.constraint = new p2.DistanceConstraint(this.body, this.source)
  this.constraint.upperLimitEnabled = true
  this.constraint.lowerLimitEnabled = true
  this.constraint.upperLimit = 1
  this.constraint.lowerLimit = 1.18
  // this.constraint.setStiffness(100)
  // this.constraint.setRelaxation(4)

  this.world.addBody(this.body)
}

Hook.prototype.setHook = function() {
  var dx = this.relativeAimPoint[0] + this.source.position[0]
  var dy = this.relativeAimPoint[1] + this.source.position[1]
  var hookPoint = [0, 0]

  var ray = new p2.Ray({ // TODO: reuse instead
    mode: p2.Ray.CLOSEST,
    from: [this.source.position[0], this.source.position[1]],
    to: [dx, dy],
    collisionMask: this.collisionMask,
  })
  var result = new p2.RaycastResult() // TODO: reuse?
  this.world.raycast(result, ray)

  if (result.hasHit()) {
    // Get the hit point
    var hitPoint = p2.vec2.create()
    result.getHitPoint(hitPoint, ray)
    hookPoint = hitPoint

    this.body.position = hookPoint
    this.body.previousPosition = hookPoint
    this.constraint.upperLimit = p2.vec2.distance(hookPoint, this.source.position)
    this.world.addConstraint(this.constraint)
    this.isHooked = true
  }

}

Hook.prototype.unsetHook = function () {
  this.world.removeConstraint(this.constraint)
  this.isHooked = false
}

Hook.prototype.shorten = function () {
  if (this.isHooked && this.constraint.upperLimit > this.constraint.lowerLimit) {
    this.constraint.upperLimit -= this.shortenSpeed
    this.constraint.update()
  }
}

module.exports = Hook
