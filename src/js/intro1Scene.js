var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var intro1Scene = {
  name: 'intro1',
  create: function (sceneParams) {

    var frameCount = 4
    var frameSprites = {}
    var currentFrame = 1

    // set up layers etc
    this.container = new PIXI.Container()

    this.animationLayer = new PIXI.Container()
    this.guiLayer = new PIXI.Container()
    this.inputLayer = new PIXI.Container()

    this.container.addChild(this.animationLayer)
    this.container.addChild(this.inputLayer)
    this.container.addChild(this.guiLayer)

    global.baseStage.addChild(this.container)

    // create animation layer
    var bgGradient = new PIXI.Sprite(PIXI.loader.resources['intro1_bg_gradient'].texture)
    bgGradient.width = global.renderer.view.width
    bgGradient.height = global.renderer.view.height
    this.animationLayer.addChild(bgGradient)

    for (var i = 1; i <= frameCount; i++) {
      var frameSprite = new PIXI.Sprite(PIXI.loader.resources['intro1_' + i].texture)
      frameSprite.anchor.x = 0.5
      frameSprite.height = this.animationLayer.height * 0.75
      frameSprite.scale.x = frameSprite.scale.y
      frameSprite.x = this.animationLayer.width / 2
      frameSprite.y = this.animationLayer.height * 0.05
      this.animationLayer.addChild(frameSprite)
      frameSprites[i] = frameSprite
    }
    
    // create gui layer
    var imageButtonBack = new PIXI.Sprite(PIXI.loader.resources['button_back'].texture)
    imageButtonBack.anchor.x = 0.5
    imageButtonBack.anchor.y = 0.5
    imageButtonBack.x = global.renderer.view.width * 0.25
    imageButtonBack.y = global.renderer.view.height * 0.8

    var imageButtonForward = new PIXI.Sprite(PIXI.loader.resources['button_next'].texture)
    imageButtonForward.anchor.x = 0.5
    imageButtonForward.anchor.y = 0.5
    imageButtonForward.x = global.renderer.view.width * 0.75
    imageButtonForward.y = global.renderer.view.height * 0.8

    this.guiLayer.addChild(imageButtonBack)
    this.guiLayer.addChild(imageButtonForward)

    var showFrame = function (frameId) {
      for (var i = 1; i <= frameCount; i++) {
        if (i === frameId) {
          frameSprites[i].visible = true
        } else {
          frameSprites[i].visible = false
        }
      }
    }

    // create button layer
    var goToPrevious = function () {
      if (currentFrame > 1) {
        currentFrame--
        showFrame(currentFrame)
      } else {
        global.sceneManager.changeScene('splash', sceneParams)
      }
    }
    var goToNext = function () {
      if (currentFrame < frameCount) {
        currentFrame++
        showFrame(currentFrame)
      } else {
        global.sceneManager.changeScene('game', sceneParams)
      }
    }
    var buttonBack = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      touchEnd: goToPrevious,
    })

    var buttonTryAgain = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      x: global.renderer.view.width / 2,
      touchEnd: goToNext,
    })

    this.keyUp = new KeyButton({
      key: 'ArrowUp',
      onKeyUp: goToPrevious,
    })

    this.keyRight = new KeyButton({
      key: 'ArrowRight',
      onKeyUp: goToNext,
    })

    this.inputLayer.addChild(buttonBack)
    this.inputLayer.addChild(buttonTryAgain)

    showFrame(1)

  },
  destroy: function () {
    this.container.destroy()
    this.keyRight.destroy()
    this.keyUp.destroy()
  },
  update: function () {

  },
  draw: function () {

    global.renderer.render(this.container)

  },
}

module.exports = intro1Scene
