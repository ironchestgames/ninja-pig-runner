var levelWonScene = {
  name: 'levelWon',
  create: function () {

    this.isLoaded = false

    PIXI.loader
    .add('finish_level_1', 'assets/images/finish_level_1.png')
    .load(function () {

      this.container = new PIXI.Container()

      this.image = new PIXI.Sprite(PIXI.loader.resources['finish_level_1'].texture)
      this.container.addChild(this.image)

      this.isLoaded = true

      global.baseStage.addChild(this.container)

    }.bind(this))

  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

    if (this.isLoaded === false) {
      return
    }

    global.renderer.render(this.container)

  },
}

module.exports = levelWonScene
