var loadGameScene = {
  name: 'loadGame',
  create: function () {
    PIXI.loader
    .add('ninja', 'assets/images/ninja.png')
    .add('rope', 'assets/images/rope.png')
    .add('static_texture_8x8', 'assets/images/static_texture_8x8.png')
    .add('background1', 'assets/images/background1.png')
    .add('backgroundsky1', 'assets/images/backgroundsky1.png')
    .add('antenn001', 'assets/images/antenn001.png')
    .add('antenn002', 'assets/images/antenn002.png')
    .add('box001', 'assets/images/box001.png')
    .add('stairs001', 'assets/images/stairs001.png')
    .add('stairs002', 'assets/images/stairs002.png')
    .add('prop_texture_8x8', 'assets/images/prop_texture_8x8.png')
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
