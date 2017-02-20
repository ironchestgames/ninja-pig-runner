// var DebugConsole = require('./DebugConsole')
console.log(require('./version'))
var PIXI = require('pixi.js')
var browserGameLoop = require('browser-game-loop')
var gameScene = require('./gameScene.js')
var loadGameScene = require('./loadGameScene.js')
var ob = require('obscen')
var windowLoad = require('window-load')

windowLoad(function () {

  // DebugConsole.init()

  global.DEBUG_DRAW = !!localStorage.getItem('DEBUG_DRAW')

  var noWebgl = !!localStorage.getItem('vars:noWebgl')

  // init pixi renderer
  var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {}, noWebgl)
  document.body.appendChild(renderer.view)
  renderer.backgroundColor = 0xcbdbfc

  window.onresize = function () {
    renderer.resize(window.innerWidth, window.innerHeight)
  }

  // init obscen
  var sceneManager = new ob.SceneManager()

  sceneManager.setScenes([
    loadGameScene,
    gameScene,
    ])

  var baseStage = new PIXI.Container()

  var text = new PIXI.Text('This is a pixi text')

  baseStage.addChild(text)

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
        text.text = 'fps: ' + Math.round(loop.getFps())
        renderer.render(baseStage)
      },
  })

  // start it!
  gameScene.renderer = renderer
  gameScene.baseStage = baseStage
  sceneManager.changeScene('loadGame')

  setTimeout(function () {
    console.log('starting')
    loop.start()
  }, 1000)
  
})
