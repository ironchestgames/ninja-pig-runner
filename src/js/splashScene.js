var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var splashScene = {
  name: 'splash',
  create: function () {

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
    var image = new PIXI.Sprite(PIXI.loader.resources['splash'].texture)
    this.animationLayer.addChild(image)
    this.animationLayer.scale.y = global.renderer.view.height / this.animationLayer.height
    this.animationLayer.scale.x = this.animationLayer.scale.y

    if (this.animationLayer.width < global.renderer.view.width) {
      this.animationLayer.width = global.renderer.view.width
    }

    this.animationLayer.x = (global.renderer.view.width - this.animationLayer.width) / 2

    // create gui layer
    var imageButtonStart = new PIXI.Sprite(PIXI.loader.resources['button_start'].texture)
    imageButtonStart.anchor.x = 0.5
    imageButtonStart.anchor.y = 0.5
    imageButtonStart.x = global.renderer.view.width * 0.75
    imageButtonStart.y = global.renderer.view.height * 0.75

    this.guiLayer.addChild(imageButtonStart)

    // create button layer
    var startGame = function () {
      global.sceneManager.changeScene('intro1', {
        level: localStorage.level || 1, // TODO: remove before prod
      })
    }

    var buttonStart = buttonAreaFactory({
      width: global.renderer.view.width,
      height: global.renderer.view.height,
      touchEnd: startGame,
    })

    this.keyUp = new KeyButton({
      key: 'ArrowUp',
      onKeyUp: startGame,
    })

    this.keyRight = new KeyButton({
      key: 'ArrowRight',
      onKeyUp: startGame,
    })

    this.inputLayer.addChild(buttonStart)

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

module.exports = splashScene
