var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var levelWonScene = {
  name: 'levelWon',
  create: function (sceneParams) {

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
    var image = new PIXI.Sprite(PIXI.loader.resources['finish_level_1'].texture)
    this.animationLayer.addChild(image)
    this.animationLayer.scale.y = global.renderer.view.height / this.animationLayer.height
    this.animationLayer.scale.x = this.animationLayer.scale.y
    this.animationLayer.x = (global.renderer.view.width - this.animationLayer.width) / 2

    // create gui layer
    var imageButtonPlayAgain = new PIXI.Sprite(PIXI.loader.resources['button_playagain'].texture)
    imageButtonPlayAgain.anchor.x = 0.5
    imageButtonPlayAgain.anchor.y = 0.5
    imageButtonPlayAgain.x = global.renderer.view.width * 0.25
    imageButtonPlayAgain.y = global.renderer.view.height * 0.75

    var imageButtonNext = new PIXI.Sprite(PIXI.loader.resources['button_next'].texture)
    imageButtonNext.anchor.x = 0.5
    imageButtonNext.anchor.y = 0.5
    imageButtonNext.x = global.renderer.view.width * 0.75
    imageButtonNext.y = global.renderer.view.height * 0.75

    this.guiLayer.addChild(imageButtonPlayAgain)
    this.guiLayer.addChild(imageButtonNext)

    // create button layer
    var goToNext = function () {
      sceneParams.level++
      if (sceneParams.level <= global.levelCount) {
        global.sceneManager.changeScene('game', sceneParams)
      } else {
        sceneParams.level--
      }
    }
    var playAgain = function () {
      global.sceneManager.changeScene('game', sceneParams)
    }
    var buttonPlayAgain = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      touchEnd: playAgain,
    })

    var buttonNext = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      x: global.renderer.view.width / 2,
      touchEnd: goToNext,
    })

    this.keyUp = new KeyButton({
      key: 'ArrowUp',
      onKeyUp: playAgain,
    })

    this.keyRight = new KeyButton({
      key: 'ArrowRight',
      onKeyUp: goToNext,
    })

    this.inputLayer.addChild(buttonPlayAgain)
    this.inputLayer.addChild(buttonNext)

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

module.exports = levelWonScene
