
var NinjaGraphics = function (config) {

  var spriteSizeFactor = 1.15
  var runningSpriteAnimationBaseSpeed = 0.20

  this.config = config

  this.currentState = NinjaGraphics.EVENT_INAIR_FALLING

  // in-air upwards sprite
  this.inAirUpwardsSprite = new PIXI.Sprite(PIXI.loader.resources['ninja'].texture)
  this.inAirUpwardsSprite.anchor.x = 0.5
  this.inAirUpwardsSprite.anchor.y = 0.5
  this.inAirUpwardsSprite.width = config.ninjaRadius * 2 * config.pixelsPerMeter
  this.inAirUpwardsSprite.height = config.ninjaRadius * 2 * config.pixelsPerMeter

  config.container.addChild(this.inAirUpwardsSprite)

  // running sprite
  var runningTexture = PIXI.loader.resources['runninganimation'].texture
  var frameWidth = runningTexture.width / 2
  var frameHeight = runningTexture.height / 2

  var runningSpriteStrip = config.spriteUtilities.filmstrip('runninganimation', frameWidth, frameHeight)
  this.runningSprite = config.spriteUtilities.sprite(runningSpriteStrip)
  this.runningSprite.anchor.x = 0.5
  this.runningSprite.anchor.y = 0.5
  this.runningSprite.width = config.ninjaRadius * 2 * config.pixelsPerMeter * spriteSizeFactor
  this.runningSprite.height = config.ninjaRadius * 2 * config.pixelsPerMeter * spriteSizeFactor
  this.runningSprite.visible = false
  this.runningSprite.animationSpeed = runningSpriteAnimationBaseSpeed

  this.runningSprite.play()

  config.container.addChild(this.runningSprite)

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
      this.inAirUpwardsSprite.visible = false
      this.runningSprite.visible = true
      break
    case NinjaGraphics.EVENT_INAIR_UPWARDS:
      this.inAirUpwardsSprite.visible = true
      this.runningSprite.visible = false
      break
    case NinjaGraphics.EVENT_INAIR_FALLING:
      this.inAirUpwardsSprite.visible = true
      this.runningSprite.visible = false
      break
  }

  this.currentState = event
}

module.exports = NinjaGraphics
