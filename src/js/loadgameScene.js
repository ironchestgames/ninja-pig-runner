var loadGameScene = {
  name: 'loadGame',
  create: function () {
    PIXI.loader
    .add('rope', 'assets/images/rope.png')
    .add('background1', 'assets/images/background1.png')
    .add('backgroundsky1', 'assets/images/backgroundsky1.png')
    .add('antenn001', 'assets/images/antenn001.png')
    .add('antenn002', 'assets/images/antenn002.png')
    .add('box001', 'assets/images/box001.png')
    .add('stairs001', 'assets/images/stairs001.png')
    .add('stairs002', 'assets/images/stairs002.png')
    .add('prop_texture_8x8', 'assets/images/prop_texture_8x8.png')
    .add('runninganimation', 'assets/images/gris_running.png')
    .add('inair_upwards', 'assets/images/gris_in_air_upwards.png')
    .add('inair_falling', 'assets/images/gris_in_air_falling.png')
    .add('headband1', 'assets/images/headband1.png')
    .add('headband2', 'assets/images/headband2.png')
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
