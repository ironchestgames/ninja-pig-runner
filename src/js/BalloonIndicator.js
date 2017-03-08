
var BalloonIndicator = function (config) {

  var container = config.container

  this.offset = PIXI.loader.resources['indicator'].texture.width / 2

  this.indicatorContainer = new PIXI.Container()

  this.forwardIndicatorArrowSprite = new PIXI.Sprite(PIXI.loader.resources['indicator'].texture)

  this.indicatorContainer.addChild(this.forwardIndicatorArrowSprite)

  this.indicatorContainer.pivot.x = PIXI.loader.resources['indicator'].texture.width / 2
  this.indicatorContainer.pivot.y = PIXI.loader.resources['indicator'].texture.height / 2

  container.addChild(this.indicatorContainer)

  this.balloonToIndicate = null // NOTE: set this to have the indicator point at it
}

BalloonIndicator.prototype.draw = function () {

  var balloonSpriteX
  var balloonSpriteY
  var rotation

  if (!this.balloonToIndicate) {
    
    // hide it if there are no balloon to indicate
    this.indicatorContainer.visible = false

  } else {

    this.indicatorContainer.visible = true

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

      this.indicatorContainer.rotation = rotation

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
    }
  }

}

module.exports = BalloonIndicator
