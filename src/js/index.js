var PIXI = require('pixi.js')
var browserGameLoop = require('browser-game-loop')
var gameScene = require('./gameScene.js')
var loadGameScene = require('./loadGameScene.js')
var ob = require('obscen')
var windowLoad = require('window-load')

global.DEBUG_DRAW = !false

windowLoad(function () {

  // init pixi renderer
  var noWebgl = global.DEBUG_DRAW
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {}, noWebgl)
  document.body.appendChild(renderer.view)
  renderer.backgroundColor = 0x000000

  window.onresize = function () {
    renderer.resize(window.innerWidth - 100, window.innerHeight - 100)
  }

  // init obscen
  var sceneManager = new ob.SceneManager()

  sceneManager.setScenes([
    loadGameScene,
    gameScene,
    ])

  // init browserGameLoop
  var loop = browserGameLoop({
      updateTimeStep: 1000 / 30,
      fpsFilterStrength: 20,
      slow: 1,
      input: function() {},
      update: function(step) {
        sceneManager.update(step)
      },
      render: function(ratio) {
        sceneManager.draw(renderer, ratio)
      },
  })

  // start it!
  gameScene.renderView = renderer.view
  sceneManager.changeScene('loadGame')

  loop.start()
  
})
