var loadGameScene = {
  name: 'loadGame',
  create: function () {
    PIXI.loader
    .add('ninja', 'assets/images/ninja.png')
    .add('static_texture_8x8', 'assets/images/static_texture_8x8.png')
    .load(function () {
      this.changeScene('game')
    }.bind(this))
  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

  },
}

module.exports = loadGameScene
