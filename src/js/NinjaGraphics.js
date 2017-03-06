var debug = require('debug')
var eventLog = debug('NinjaGraphics:events')

var NinjaGraphics = function (config) {

  var spriteSizeFactor = 1.18 // to make up for the whitespace in the frames
  var runningSpriteAnimationBaseSpeed = 0.20 // TODO: what is this in ms?

  var resourceLoader = config.resourceLoader
  var ninjaHeight = config.ninjaHeight
  var pixelsPerMeter = config.pixelsPerMeter
  var scaleRatio = (ninjaHeight * pixelsPerMeter * spriteSizeFactor) / resourceLoader.resources['inair_upwards'].texture.height

  this.config = config
  this.currentState = null
  this.fpsFactor = 60 / global.loop.getFps() // NOTE: developed on 60 fps

  this.container = new PIXI.Container()
  config.container.addChild(this.container)

  this.scaleContainer = new PIXI.Container()
  this.container.addChild(this.scaleContainer)

  this.scaleContainer.scale.x = scaleRatio
  this.scaleContainer.scale.y = scaleRatio

  // in-air upwards sprite
  this.inAirUpwardsSprite = new PIXI.Sprite(resourceLoader.resources['inair_upwards'].texture)
  this.inAirUpwardsSprite.anchor.x = 0.5
  this.inAirUpwardsSprite.anchor.y = 0.5

  // in-air falling sprite
  this.inAirFallingSprite = new PIXI.Sprite(resourceLoader.resources['inair_falling'].texture)
  this.inAirFallingSprite.anchor.x = 0.5
  this.inAirFallingSprite.anchor.y = 0.5

  // running sprite
  var runningTexture = resourceLoader.resources['runninganimation'].texture
  var frameWidth = runningTexture.width / 2
  var frameHeight = runningTexture.height / 2

  var runningSpriteStrip = config.spriteUtilities.filmstrip('runninganimation', frameWidth, frameHeight)
  this.runningSprite = config.spriteUtilities.sprite(runningSpriteStrip)
  this.runningSprite.anchor.x = 0.5
  this.runningSprite.anchor.y = 0.5
  this.runningSprite.animationSpeed = runningSpriteAnimationBaseSpeed
  this.runningSprite.play()

  // headband
  var texture = resourceLoader.resources['headband1'].texture
  this.headband1Points = [
    new PIXI.Point(0, 16),
    new PIXI.Point(8, 16),
    new PIXI.Point(16, 16),
    new PIXI.Point(24, 16),
    new PIXI.Point(31, 16),
  ]
  this.headband1 = new PIXI.mesh.Rope(texture, this.headband1Points)
  this.headband1.x = -this.runningSprite.width * 0.20
  this.headband1.y = -this.runningSprite.height * 0.30
  this.headband1.pivot.x = texture.width
  this.headband1.pivot.y = texture.height / 2

  texture = resourceLoader.resources['headband2'].texture
  this.headband2Points = [
    new PIXI.Point(0, 16),
    new PIXI.Point(8, 16),
    new PIXI.Point(16, 16),
    new PIXI.Point(24, 16),
    new PIXI.Point(31, 16),
  ]
  this.headband2 = new PIXI.mesh.Rope(texture, this.headband2Points)
  this.headband2.x = -this.runningSprite.width * 0.18
  this.headband2.y = -this.runningSprite.height * 0.28
  this.headband2.pivot.x = texture.width
  this.headband2.pivot.y = texture.height / 2

  // add sprites in correct z-order
  this.scaleContainer.addChild(this.headband2)
  this.scaleContainer.addChild(this.inAirUpwardsSprite)
  this.scaleContainer.addChild(this.inAirFallingSprite)
  this.scaleContainer.addChild(this.runningSprite)
  this.scaleContainer.addChild(this.headband1)

  this.headbandCount = 0

}

NinjaGraphics.STATE_RUNNING = 'STATE_RUNNING'
NinjaGraphics.STATE_INAIR_UPWARDS = 'STATE_INAIR_UPWARDS'
NinjaGraphics.STATE_INAIR_FALLING = 'STATE_INAIR_FALLING'
NinjaGraphics.STATE_INAIR_HOOKED = 'STATE_INAIR_HOOKED'
NinjaGraphics.STATE_BOUNCED_LEFT = 'STATE_BOUNCED_LEFT'
NinjaGraphics.STATE_BOUNCED_RIGHT = 'STATE_BOUNCED_RIGHT'

NinjaGraphics.prototype.changeState = function (newState) {

  if (newState === this.currentState) {
    return
  }

  eventLog('change to', newState)

  switch (newState) {
    case NinjaGraphics.STATE_RUNNING:
      this.runningSprite.visible = true

      this.inAirUpwardsSprite.visible = false
      this.inAirFallingSprite.visible = false

      this.container.scale.x = 1
      this.headband1.scale.x = 1
      this.headband2.scale.x = 1
      break
    case NinjaGraphics.STATE_INAIR_UPWARDS:
      this.inAirUpwardsSprite.visible = true

      this.inAirFallingSprite.visible = false
      this.runningSprite.visible = false

      this.container.scale.x = 1
      this.headband1.scale.x = 1
      this.headband2.scale.x = 1
      break
    case NinjaGraphics.STATE_INAIR_HOOKED:
    case NinjaGraphics.STATE_INAIR_FALLING:
      this.inAirFallingSprite.visible = true

      this.runningSprite.visible = false
      this.inAirUpwardsSprite.visible = false

      this.container.scale.x = 1
      this.headband1.scale.x = 1
      this.headband2.scale.x = 1
      break
    case NinjaGraphics.STATE_BOUNCED_LEFT:
      this.inAirFallingSprite.visible = true

      this.runningSprite.visible = false
      this.inAirUpwardsSprite.visible = false

      this.container.scale.x = 1
      this.headband1.scale.x = 1
      this.headband2.scale.x = 1
      break
    case NinjaGraphics.STATE_BOUNCED_RIGHT:
      this.inAirFallingSprite.visible = true

      this.runningSprite.visible = false
      this.inAirUpwardsSprite.visible = false

      this.container.scale.x = -1
      this.headband1.scale.x = -1
      this.headband2.scale.x = -1
      break
  }

  this.currentState = newState
}

NinjaGraphics.prototype.draw = function (x, y, rotation, ninjaBody) {

  // set the values to be used easier from outside
  this.x = x
  this.y = y
  this.rotation = rotation

  // set values to container
  this.container.x = x
  this.container.y = y
  this.container.rotation = rotation

  this.headbandCount++

  var ninjaBodySpeed = Math.sqrt(ninjaBody.velocity[0] * ninjaBody.velocity[0] + ninjaBody.velocity[1] * ninjaBody.velocity[1])

  var headbandSpeed = ninjaBodySpeed * 0.8
  if (headbandSpeed < 0.1) {
    headbandSpeed = 0.1
  }

  var velAngle = Math.atan2(ninjaBody.velocity[1], ninjaBody.velocity[0]) - 0.2
  if (headbandSpeed < 1.5) {
    velAngle = Math.PI * -0.4
  }
  this.headband1.rotation = velAngle
  this.headband2.rotation = velAngle

  for (var i = 0; i < this.headband1Points.length - 1; i++) {
    var point = this.headband1Points[i]
    point.y = Math.sin((i * 0.6 + this.headbandCount / 1.6) * this.fpsFactor) * (headbandSpeed * (32 - i * 8) / 32) + 16

    point = this.headband2Points[i]
    point.y = Math.cos((i * 0.6 + this.headbandCount / 1.6) * this.fpsFactor) * (headbandSpeed * (32 - i * 8) / 32) + 16
  }

}

module.exports = NinjaGraphics
