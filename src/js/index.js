// var DebugConsole = require('./DebugConsole')
console.log(require('./version'))
var PIXI = require('pixi.js')
var browserGameLoop = require('browser-game-loop')
var gameScene = require('./gameScene.js')
var loadGameScene = require('./loadGameScene.js')
var ob = require('obscen')
var windowLoad = require('window-load')
var screenOrientation = require('screen-orientation')

windowLoad(function () {

  // DebugConsole.init()

  global.DEBUG_DRAW = !!localStorage.getItem('DEBUG_DRAW')
  global.DEBUG_MONITOR = !!localStorage.getItem('DEBUG_MONITOR')

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

  var appContainer = new PIXI.Container()
  var baseStage = new PIXI.Container()
  var turnDeviceContainer = new PIXI.Container()
  var debugTexts = new PIXI.Container()

  appContainer.addChild(baseStage)
  appContainer.addChild(turnDeviceContainer)
  appContainer.addChild(debugTexts)

  // debug monitor text
  if (!global.DEBUG_MONITOR) {
    debugTexts.visible = false
  }

  var fpsText = new PIXI.Text('This is a pixi text', {
    fill: 0x00ff00,
  })
  debugTexts.addChild(fpsText)

  // turn device graphics
  var turnDeviceBackground = new PIXI.Graphics()
  turnDeviceBackground.beginFill(0x292929)
  turnDeviceBackground.drawRect(0, 0, 8, 8)
  turnDeviceBackground.scale.x = 200
  turnDeviceBackground.scale.y = 300
  turnDeviceBackground.endFill()
  turnDeviceContainer.addChild(turnDeviceBackground)

  var turnDeviceText = new PIXI.Text('Turn device to landscape', {
    fill: 0xfcfcfc,
  })
  turnDeviceText.x = 200
  turnDeviceText.y = 200
  turnDeviceContainer.addChild(turnDeviceText)

  // init browserGameLoop
  var loop = browserGameLoop({
      updateTimeStep: 1000 / 30,
      fpsFilterStrength: 20,
      slow: 1,
      input: function() {},
      update: function(step) {
        if (screenOrientation().direction === 'portrait') {
          turnDeviceContainer.visible = true
        } else {
          turnDeviceContainer.visible = false
          sceneManager.update(step)
        }
      },
      render: function(ratio) {
        if (screenOrientation().direction === 'portrait') {
          turnDeviceContainer.visible = true
        } else {
          turnDeviceContainer.visible = false
          sceneManager.draw(renderer, ratio)
        }
        fpsText.text = 'fps: ' + Math.round(loop.getFps()) + '\nscreen orientation: ' + screenOrientation().direction
        renderer.render(appContainer)
      },
  })
  global.loop = loop

  var intervalId = setInterval(function () {
    if (screenOrientation().direction === 'portrait') {
      turnDeviceContainer.visible = true
      renderer.render(appContainer)
    } else {

      // start it!
      clearInterval(intervalId)

      gameScene.renderer = renderer
      gameScene.baseStage = baseStage
      sceneManager.changeScene('loadGame')

      loop.start()
    }
  }, 100)
  
})
