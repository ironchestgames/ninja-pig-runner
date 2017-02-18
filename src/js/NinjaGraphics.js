
var NinjaGraphics = function (config) {

  var spriteSizeFactor = 1.15 // to make up for the whitespace in the frames
  var runningSpriteAnimationBaseSpeed = 0.20 // TODO: what is this in ms?

  this.config = config

  var ninjaRadius = config.ninjaRadius
  var pixelsPerMeter = config.pixelsPerMeter
  var container = config.container

  this.currentState = NinjaGraphics.EVENT_INAIR_FALLING

  // in-air upwards sprite
  this.inAirUpwardsSprite = new PIXI.Sprite(PIXI.loader.resources['inair_upwards'].texture)
  this.inAirUpwardsSprite.anchor.x = 0.5
  this.inAirUpwardsSprite.anchor.y = 0.5
  this.inAirUpwardsSprite.width = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor
  this.inAirUpwardsSprite.height = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor

  container.addChild(this.inAirUpwardsSprite)

  // in-air falling sprite
  this.inAirFallingSprite = new PIXI.Sprite(PIXI.loader.resources['inair_falling'].texture)
  this.inAirFallingSprite.anchor.x = 0.5
  this.inAirFallingSprite.anchor.y = 0.5
  this.inAirFallingSprite.width = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor
  this.inAirFallingSprite.height = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor

  container.addChild(this.inAirFallingSprite)

  // running sprite
  var runningTexture = PIXI.loader.resources['runninganimation'].texture
  var frameWidth = runningTexture.width / 2
  var frameHeight = runningTexture.height / 2

  var runningSpriteStrip = config.spriteUtilities.filmstrip('runninganimation', frameWidth, frameHeight)
  this.runningSprite = config.spriteUtilities.sprite(runningSpriteStrip)
  this.runningSprite.anchor.x = 0.5
  this.runningSprite.anchor.y = 0.5
  this.runningSprite.width = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor
  this.runningSprite.height = ninjaRadius * 2 * pixelsPerMeter * spriteSizeFactor
  this.runningSprite.visible = false
  this.runningSprite.animationSpeed = runningSpriteAnimationBaseSpeed
  this.runningSprite.play()

  container.addChild(this.runningSprite)

}

NinjaGraphics.EVENT_RUNNING = 'EVENT_RUNNING'
NinjaGraphics.EVENT_INAIR_UPWARDS = 'EVENT_INAIR_UPWARDS'
NinjaGraphics.EVENT_INAIR_FALLING = 'EVENT_INAIR_FALLING'

NinjaGraphics.prototype.handleEvent = function (event) {

  if (event === this.currentState) {
    return
  }

  switch (event) {
    case NinjaGraphics.EVENT_RUNNING:
      this.runningSprite.visible = true

      this.inAirUpwardsSprite.visible = false
      this.inAirFallingSprite.visible = false
      break
    case NinjaGraphics.EVENT_INAIR_UPWARDS:
      this.inAirUpwardsSprite.visible = true

      this.inAirFallingSprite.visible = false
      this.runningSprite.visible = false
      break
    case NinjaGraphics.EVENT_INAIR_FALLING:
      this.inAirFallingSprite.visible = true

      this.runningSprite.visible = false
      this.inAirUpwardsSprite.visible = false
      break
  }

  this.currentState = event
}

NinjaGraphics.prototype.draw = function (x, y, rotation) {

  // set the values to be used easier from outside
  this.x = x
  this.y = y
  this.rotation = rotation

  // set values to all sprites
  this.inAirUpwardsSprite.x = x
  this.inAirUpwardsSprite.y = y
  this.inAirUpwardsSprite.rotation = rotation

  this.inAirFallingSprite.x = x
  this.inAirFallingSprite.y = y
  this.inAirFallingSprite.rotation = rotation

  this.runningSprite.x = x
  this.runningSprite.y = y
  this.runningSprite.rotation = rotation
}

module.exports = NinjaGraphics
