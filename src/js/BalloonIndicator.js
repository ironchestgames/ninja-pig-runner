
var BalloonIndicator = function (config) {

  var container = config.container

  this.offset = PIXI.loader.resources['indicator'].texture.width / 2

  this.indicatorContainer = new PIXI.Container()

  this.forwardIndicatorArrowSprite = new PIXI.Sprite(PIXI.loader.resources['indicator'].texture)
  this.forwardIndicatorArrowSprite.anchor.x = 0.5
  this.forwardIndicatorArrowSprite.anchor.y = 0.5
  this.forwardIndicatorArrowSprite.x = PIXI.loader.resources['indicator'].texture.width / 2
  this.forwardIndicatorArrowSprite.y = PIXI.loader.resources['indicator'].texture.height / 2

  this.indicatorContainer.addChild(this.forwardIndicatorArrowSprite)

  this.indicatorContainer.pivot.x = PIXI.loader.resources['indicator'].texture.width / 2
  this.indicatorContainer.pivot.y = PIXI.loader.resources['indicator'].texture.height / 2

  container.addChild(this.indicatorContainer)

  this.balloonSprites = {}

  for (var i = 1; i <= 9; i++) { // TODO: move balloon color count to gameVars
    var sprite = new PIXI.Sprite(PIXI.loader.resources['balloon' + i].texture)
    sprite.anchor.x = 0.5
    sprite.anchor.y = 0.5
    sprite.x = PIXI.loader.resources['indicator'].texture.width / 2
    sprite.y = PIXI.loader.resources['indicator'].texture.height / 2
    sprite.visible = false
    sprite.balloonColor = i
    this.indicatorContainer.addChild(sprite)
    this.balloonSprites[i] = sprite
  }

  this.balloonToIndicate = null // NOTE: set this to have the indicator point at it
}

BalloonIndicator.prototype.draw = function () {

  var balloonSpriteX
  var balloonSpriteY
  // var distance
  // var dx
  // var dy
  // var indicatorX
  // var indicatorY
  var rotation

  if (!this.balloonToIndicate) {
    
    // hide it if there are no balloon to indicate
    this.indicatorContainer.visible = false

  } else {

    // screen position of the balloon sprite
    balloonSpriteX = this.balloonToIndicate.worldTransform.tx
    balloonSpriteY = this.balloonToIndicate.worldTransform.ty

    // set to balloon sprite position
    this.indicatorContainer.x = balloonSpriteX
    this.indicatorContainer.y = balloonSpriteY

    // do not show indicator if the balloon is inside screen
    if (balloonSpriteX > 0 &&
        balloonSpriteX < global.renderer.view.width &&
        balloonSpriteY > 0 &&
        balloonSpriteY < global.renderer.view.height) {

      this.indicatorContainer.visible = false

    } else {

      // make it visible
      this.indicatorContainer.visible = true

      // set rotation
      rotation = 0

      if (balloonSpriteX > global.renderer.view.width) {
        rotation = 0
      } else if (balloonSpriteX < 0) {
        rotation = Math.PI
      } else if (balloonSpriteY < 0) {
        rotation = Math.PI * 1.5
      } else if (balloonSpriteY > global.renderer.view.height) {
        rotation = Math.PI * 0.5
      }

      this.forwardIndicatorArrowSprite.rotation = rotation

      // constrain x
      if (this.indicatorContainer.x < this.offset) {
        this.indicatorContainer.x = this.offset
      } else if (this.indicatorContainer.x > global.renderer.view.width - this.offset) {
        this.indicatorContainer.x = global.renderer.view.width - this.offset
      }

      // constrain y
      if (this.indicatorContainer.y < this.offset) {
        this.indicatorContainer.y = this.offset
      } else if (this.indicatorContainer.y > global.renderer.view.height - this.offset) {
        this.indicatorContainer.y = global.renderer.view.height - this.offset
      }

      // show correct color
      for (var i = 1; i <= 9; i++) {
        if (i === this.balloonToIndicate.balloonColor) {
          // indicatorX = this.indicatorContainer.worldTransform.tx
          // indicatorY = this.indicatorContainer.worldTransform.ty
          // dx = balloonSpriteX - indicatorX
          // dy = balloonSpriteY - indicatorY
          // distance = Math.sqrt(dx * dx + dy * dy)
          // TODO: show the distance to the balloon (somehow)

          this.balloonSprites[i].visible = true
        } else {
          this.balloonSprites[i].visible = false
        }
      }
    }
  }

}

module.exports = BalloonIndicator
