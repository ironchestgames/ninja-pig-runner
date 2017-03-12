var LevelManager = require('./LevelManager')
var gameVars = require('./gameVars')

var loadScene = {
  name: 'load',
  create: function (sceneParams) {

    // load progress TODO: from local storage
    global.levelManager = new LevelManager()

    global.levelManager
    .addLevel({
      name: 'level5',
      theme: gameVars.themes.sunsetCity,
    })
    .addLevel({
      name: 'level1',
      theme: gameVars.themes.sunsetCity,
    })
    .addLevel({
      name: 'level2',
      theme: gameVars.themes.sunsetCity,
    })
    .addLevel({
      name: 'level3',
      theme: gameVars.themes.sunsetCity,
    })
    .addLevel({
      name: 'level4',
      theme: gameVars.themes.sunsetCity,
    })

    // fetch assets
    PIXI.loader

    // buttons
    .add('button_menu', 'assets/images/button_menu.png')
    .add('button_next', 'assets/images/button_next.png')
    .add('button_back', 'assets/images/button_back.png')
    .add('button_restart', 'assets/images/button_restart.png')

    // splash scene
    .add('splash', 'assets/images/splash.png')

    // game scene
    .add('background1', 'assets/images/background1.png')
    .add('backgroundsky1', 'assets/images/backgroundsky1.png')
    .add('runninganimation', 'assets/images/gris_running.png')
    .add('inair_upwards', 'assets/images/gris_in_air_upwards.png')
    .add('inair_falling', 'assets/images/gris_in_air_falling.png')
    .add('headband1', 'assets/images/headband1.png')
    .add('headband2', 'assets/images/headband2.png')
    .add('coin', 'assets/images/coin.png')
    .add('level1', 'assets/json/level1.json') // TODO: bake this into bundle.js instead
    .add('level2', 'assets/json/level2.json') // TODO: bake this into bundle.js instead
    .add('level3', 'assets/json/level3.json') // TODO: bake this into bundle.js instead
    .add('level4', 'assets/json/level4.json') // TODO: bake this into bundle.js instead
    .add('level5', 'assets/json/level5.json') // TODO: bake this into bundle.js instead
    // .add('level' + sceneParams.level, 'assets/json/level' + sceneParams.level + '.json') // TODO: bake this into bundle.js instead

    // level fail scene
    .add('fail_level_1', 'assets/images/fail_level_1.png')

    // level won scene
    .add('finish_level_1', 'assets/images/finish_level_1.png')

    .load(function () {
      this.changeScene(localStorage.scene || 'splash', sceneParams)
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
