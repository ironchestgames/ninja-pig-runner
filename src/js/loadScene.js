var loadScene = {
  name: 'load',
  create: function (sceneParams) {

    PIXI.loader

    // buttons
    .add('button_start', 'assets/images/button_start.png')
    .add('button_menu', 'assets/images/button_menu.png')
    .add('button_tryagain', 'assets/images/button_tryagain.png')
    .add('button_next', 'assets/images/button_next.png')
    .add('button_back', 'assets/images/button_back.png')
    .add('button_playagain', 'assets/images/button_playagain.png')

    // splash scene
    .add('splash', 'assets/images/splash.png')

    // game scene
    .add('rope', 'assets/images/rope.png')
    .add('helpline', 'assets/images/helpline.png')
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
    .add('balloon1', 'assets/images/balloon1.png')
    .add('balloon2', 'assets/images/balloon2.png')
    .add('balloon3', 'assets/images/balloon3.png')
    .add('balloon4', 'assets/images/balloon4.png')
    .add('balloon5', 'assets/images/balloon5.png')
    .add('balloon6', 'assets/images/balloon6.png')
    .add('balloon7', 'assets/images/balloon7.png')
    .add('balloon8', 'assets/images/balloon8.png')
    .add('balloon9', 'assets/images/balloon9.png')
    .add('balloonstring', 'assets/images/balloonstring.png')
    .add('indicator', 'assets/images/indicator.png')
    .add('spikes', 'assets/images/spikes.png')
    .add('level1', 'assets/json/level1.json') // TODO: bake this into bundle.js instead
    .add('level2', 'assets/json/level2.json') // TODO: bake this into bundle.js instead
    .add('level3', 'assets/json/level3.json') // TODO: bake this into bundle.js instead
    // .add('level' + sceneParams.level, 'assets/json/level' + sceneParams.level + '.json') // TODO: bake this into bundle.js instead

    // level fail scene
    .add('fail_level_1', 'assets/images/fail_level_1.png')

    // level won scene
    .add('finish_level_1', 'assets/images/finish_level_1.png')

    // intro 1 scene
    .add('intro1_bg_gradient', 'assets/images/intro1_bg_gradient.png')
    .add('intro1_1', 'assets/images/intro1_1.png')
    .add('intro1_2', 'assets/images/intro1_2.png')
    .add('intro1_3', 'assets/images/intro1_3.png')
    .add('intro1_4', 'assets/images/intro1_4.png')

    .load(function () {
      this.changeScene('splash', {
        level: sceneParams.level,
      })
    }.bind(this))
  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

  },
}

module.exports = loadScene
