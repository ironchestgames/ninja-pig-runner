var p2 = require('p2')

var NinjaSensor = function (config) {

  this.config = config
  this.name = config.name
  this.relativePosition = p2.vec2.clone(config.relativePosition)

  this.shape = new p2.Circle({
    radius: config.radius,
    collisionGroup: config.collisionGroup,
    collisionMask: config.collisionMask,
    sensor: true,
  })
  this.shape.worldPosition = [0, 0] // TODO: what is this? (debug draw?)
  this.shape.previousWorldPosition = [0, 0] // TODO: what is this? (debug draw?)
  this.shape.name = this.name

  // NOTE: setting position needs to be done after it's been added to the body
  var intervalId = setInterval(function () {
    if (this.shape.body) {
      this.shape.position = config.relativePosition // NOTE: using the one sent in, not the saved
      clearInterval(intervalId)
    }
  }.bind(this), 2)
}

module.exports = NinjaSensor
