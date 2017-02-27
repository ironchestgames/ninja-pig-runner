var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var levelFailScene = {
  name: 'levelFail',
  create: function (sceneParams) {

    this.isLoading = true

    this.loader = new PIXI.loaders.Loader()

    this.loader
    .add('fail_level_1', 'assets/images/fail_level_1.png')
    .add('button_menu', 'assets/images/button_menu.png')
    .add('button_tryagain', 'assets/images/button_tryagain.png')
    .load(function () {

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
      var image = new PIXI.Sprite(this.loader.resources['fail_level_1'].texture)
      this.animationLayer.addChild(image)
      this.animationLayer.scale.y = global.renderer.view.height / this.animationLayer.height
      this.animationLayer.scale.x = this.animationLayer.scale.y
      this.animationLayer.x = (global.renderer.view.width - this.animationLayer.width) / 2

      // create gui layer
      var imageButtonBack = new PIXI.Sprite(this.loader.resources['button_menu'].texture)
      imageButtonBack.anchor.x = 0.5
      imageButtonBack.anchor.y = 0.5
      imageButtonBack.x = global.renderer.view.width * 0.25
      imageButtonBack.y = global.renderer.view.height * 0.75

      var imageButtonTryAgain = new PIXI.Sprite(this.loader.resources['button_tryagain'].texture)
      imageButtonTryAgain.anchor.x = 0.5
      imageButtonTryAgain.anchor.y = 0.5
      imageButtonTryAgain.x = global.renderer.view.width * 0.75
      imageButtonTryAgain.y = global.renderer.view.height * 0.75

      this.guiLayer.addChild(imageButtonBack)
      this.guiLayer.addChild(imageButtonTryAgain)

      // create button layer
      var goToMenu = function () {
        console.log('go to menu')
      }
      var tryAgain = function () {
        global.sceneManager.changeScene('loadGame', sceneParams)
      }
      var buttonBack = buttonAreaFactory({
        width: global.renderer.view.width / 2,
        height: global.renderer.view.height,
        touchEnd: goToMenu,
      })

      var buttonTryAgain = buttonAreaFactory({
        width: global.renderer.view.width / 2,
        height: global.renderer.view.height,
        x: global.renderer.view.width / 2,
        touchEnd: tryAgain,
      })

      this.keyUp = new KeyButton({
        key: 'ArrowUp',
        onKeyUp: goToMenu,
      })

      this.keyRight = new KeyButton({
        key: 'ArrowRight',
        onKeyUp: tryAgain,
      })

      this.inputLayer.addChild(buttonBack)
      this.inputLayer.addChild(buttonTryAgain)

      this.isLoading = false

    }.bind(this))

  },
  destroy: function () {
    this.container.destroy()
    this.keyRight.destroy()
    this.keyUp.destroy()
  },
  update: function () {

  },
  draw: function () {

    if (this.isLoading === true) {
      return
    }

    global.renderer.render(this.container)

  },
}

module.exports = levelFailScene
