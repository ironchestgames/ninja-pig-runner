var loadGameScene = {
  name: 'loadGame',
  create: function () {
    PIXI.loader
    .add('ninja', 'assets/images/ninja.png')
    .add('static_texture_8x8', 'assets/images/static_texture_8x8.png')
    .add('level1', 'assets/json/level1.json') // TODO: bake this into bundle.js instead
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
