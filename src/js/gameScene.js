var debug = require('debug')
var p2 = require('p2')
var DebugDraw = require('./DebugDraw')
var SpriteUtilities = require('../lib/spriteUtilities')
var gameUtils = require('./gameUtils')
var NinjaGraphics = require('./NinjaGraphics')
var NinjaSensor = require('./NinjaSensor')
var MapLoader = require('./MapLoader')
var gameVars = require('./gameVars')
var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var actionsLog = debug('gameScene:actions')
var buttonsLog = debug('gameScene:buttons')

var isPaused = false

var spriteUtilities
var mapLoader
var currentLevel
var sceneParams

var pixelsPerMeter = 50
var heightInMeters = 10
var widthInPixels
var heightInPixels
var stageToNinjaOffsetX

var world
var bodiesToRemove = []

var jumpButton

var keyUp
var keySpace

var shouldJump = false
var isRunning = false

var wallBounceVelocityX = 8
var wallBounceVelocityY = 7.12
var wallBounceUpVelocityThreshold = 1
var jumpUpVelocity = 8
var minimumRunningSpeed = 10
var currentRunningSpeed = 0
var dieOfFallY = 13
var ninjaRadius = 0.375

var ninjaBody
var ninjaGraphics
var backgroundSprite
var skySprite
var dynamicSprites = {} // TODO: make sure these are destroyed properly
var mapLayer

var ninjaBottomSensor
var ninjaLeftSensor
var ninjaRightSensor

var tempVector = [0, 0]

var onJumpDown = function (event) {
  buttonsLog('onJumpDown', event)
  if (isRunning) {
    shouldJump = true
  }
}

// TODO: remove, this is only for debug
var onKeyPress = function (event) {
  if (event.key === 'r') {
    restartNinja()
  }

  if (event.key === 'p') {
    isPaused = !isPaused
  }
}

var restartNinja = function () {
  isPaused = false

  ninjaBody.position[0] = mapLoader.ninjaStartPosition[0]
  ninjaBody.position[1] = mapLoader.ninjaStartPosition[1]

  ninjaBody.velocity[0] = 0
  ninjaBody.velocity[1] = 0
}

var levelFail = function (sceneParams) {
  isPaused = true
  global.sceneManager.changeScene('levelFail', sceneParams)
}

var levelWon = function (sceneParams) {
  if (!isPaused) {
    isPaused = true
    global.levelManager.currentLevelDone()
    global.sceneManager.changeScene('levelWon', sceneParams)
  }
}

var createNinja = function() {

  var bottomShape
  var topShape
  var middleShape

  // body
  ninjaBody = new p2.Body({
    mass: 0.45,
    velocity: [0.5, -3],
  })
  ninjaBody.fixedRotation = true

  // shapes
  middleShape = new p2.Box({
    width: ninjaRadius * 2,
    height: ninjaRadius * 2,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL | gameVars.COIN,
  })
  ninjaBody.addShape(middleShape)
  middleShape.name = 'middleShape'

  bottomShape = new p2.Circle({
    radius: ninjaRadius * 1.1,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL | gameVars.COIN,
  })
  ninjaBody.addShape(bottomShape)
  bottomShape.position[1] = ninjaRadius
  bottomShape.name = 'bottomShape'

  topShape = new p2.Circle({
    radius: ninjaRadius,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL | gameVars.COIN,
  })
  ninjaBody.addShape(topShape)
  topShape.position[1] = -ninjaRadius
  topShape.name = 'topShape'

  // sensor bottom
  ninjaBottomSensor = new NinjaSensor({
    name: 'ninjaBottomSensor',
    width: 0.4,
    height: 0.2,
    collisionGroup: gameVars.SENSOR,
    collisionMask: gameVars.WALL,
    relativePosition: [0, ninjaRadius * 2],
  })

  ninjaBody.addShape(ninjaBottomSensor.shape)

  // sensor left
  ninjaLeftSensor = new NinjaSensor({
    name: 'ninjaLeftSensor',
    width: 0.15,
    height: 0.5,
    collisionGroup: gameVars.SENSOR,
    collisionMask: gameVars.WALL,
    relativePosition: [-ninjaRadius, 0],
  })

  ninjaBody.addShape(ninjaLeftSensor.shape)

  // sensor right
  ninjaRightSensor = new NinjaSensor({
    name: 'ninjaRightSensor',
    width: 0.15,
    height: 0.5,
    collisionGroup: gameVars.SENSOR,
    collisionMask: gameVars.WALL,
    relativePosition: [ninjaRadius, 0],
  })

  ninjaBody.addShape(ninjaRightSensor.shape)

  // add to world
  ninjaBody.damping = 0
  ninjaBody.angularDamping = 0
  ninjaBody.name = 'ninjaBody'

  world.addBody(ninjaBody)

}

var postStep = function () {

  actionsLog('STEP')

  // remove bodies from bodiesToRemove
  while (bodiesToRemove.length > 0) {
    var body = bodiesToRemove.pop()
    var sprite = dynamicSprites[body.id]
    mapLayer.removeChild(sprite)
    world.removeBody(body)
  }

  // update the sensors' values
  ninjaLeftSensor.postStep()
  ninjaRightSensor.postStep()
  ninjaBottomSensor.postStep()

  // determine if isRunning
  if (!shouldJump &&
      ninjaBottomSensor.isContactUsable() &&
      ninjaLeftSensor.stepsSinceUsed > 2 &&
      ninjaRightSensor.stepsSinceUsed > 2) {
    if (!isRunning) {
      if (ninjaBody.velocity[0] < minimumRunningSpeed) {
        currentRunningSpeed = minimumRunningSpeed
      } else {
        currentRunningSpeed = ninjaBody.velocity[0]
      }
    }
    isRunning = true
    ninjaBody.velocity[0] = currentRunningSpeed // TODO: don't set velocity, check velocity and apply force instead
    actionsLog('RUNNING')
    ninjaGraphics.changeState(NinjaGraphics.STATE_RUNNING)

  } else {
    isRunning = false

    if (ninjaGraphics.currentState !== NinjaGraphics.STATE_BOUNCED_RIGHT &&
      ninjaBody.velocity[1] > 0) {
      ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_FALLING)
    }
  }

  // jump away from wall on left side
  if (!isRunning &&
      ninjaBody.velocity[0] > 0 &&
      ninjaLeftSensor.isContactUsable()) {

    if (ninjaBody.velocity[1] <= wallBounceUpVelocityThreshold) {
      ninjaBody.velocity[1] = -wallBounceVelocityY
    }

    ninjaBody.velocity[0] = wallBounceVelocityX

    ninjaLeftSensor.setContactUsed(true)
    ninjaGraphics.changeState(NinjaGraphics.STATE_BOUNCED_LEFT)
    actionsLog('BOUNCE LEFT')
  }

  // jump away from wall on right side
  if (!isRunning &&
      ninjaBody.velocity[0] < 0 &&
      ninjaRightSensor.isContactUsable()) {

    if (ninjaBody.velocity[1] <= wallBounceUpVelocityThreshold) {
      ninjaBody.velocity[1] = -wallBounceVelocityY
    }

    ninjaBody.velocity[0] = -wallBounceVelocityX

    ninjaRightSensor.setContactUsed(true)
    ninjaGraphics.changeState(NinjaGraphics.STATE_BOUNCED_RIGHT)
    actionsLog('BOUNCE RIGHT')
  }

  // jump up
  if (shouldJump) {
    ninjaBody.velocity[1] = -jumpUpVelocity
    ninjaBottomSensor.setContactUsed(true)
    shouldJump = false
    actionsLog('JUMP')
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_UPWARDS)
  }

  if (ninjaBody.position[1] > dieOfFallY) {
    levelFail(sceneParams)
  }

  if (!isRunning &&
      ninjaGraphics.currentState === NinjaGraphics.STATE_RUNNING) {
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_FALLING)
  }

  if (ninjaGraphics.currentState === NinjaGraphics.STATE_INAIR_FALLING &&
      ninjaBody.velocity[1] < 0) {
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_UPWARDS)
  } else if (ninjaGraphics.currentState === NinjaGraphics.STATE_INAIR_UPWARDS &&
      ninjaBody.velocity[1] > 0) {
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_FALLING)
  }

}

var beginContact = function (contactEvent) {
  // console.log('beginContact', contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaBottomSensor.shape || contactEvent.shapeB === ninjaBottomSensor.shape) {
    ninjaBottomSensor.contactCount++
  }

  if (contactEvent.shapeA === ninjaLeftSensor.shape || contactEvent.shapeB === ninjaLeftSensor.shape) {
    ninjaLeftSensor.contactCount++
  }

  if (contactEvent.shapeA === ninjaRightSensor.shape || contactEvent.shapeB === ninjaRightSensor.shape) {
    ninjaRightSensor.contactCount++
  }

  // end of level check
  if ((contactEvent.bodyA.name === 'goal' || contactEvent.bodyB.name === 'goal') &&
      (contactEvent.bodyA.name === 'ninjaBody' || contactEvent.bodyB.name === 'ninjaBody')) {
    levelWon(sceneParams)
  }

  if ((contactEvent.bodyA.name === 'ninjaBody' || contactEvent.bodyB.name === 'ninjaBody') &&
      ((contactEvent.bodyA.name === 'coin' || contactEvent.bodyB.name === 'coin') || 
      (contactEvent.bodyA.name === 'star' || contactEvent.bodyB.name === 'star'))) {

    var coinBody = contactEvent.bodyA
    if (contactEvent.bodyA.name === 'ninjaBody') {
      coinBody = contactEvent.bodyB
    }

    world.removeBody(coinBody)
    dynamicSprites[coinBody.id].destroy()
  }
}

var endContact = function (contactEvent) {
  // console.log('endContact',  contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaBottomSensor.shape || contactEvent.shapeB === ninjaBottomSensor.shape) {
    ninjaBottomSensor.contactCount--
  }

  if (contactEvent.shapeA === ninjaLeftSensor.shape || contactEvent.shapeB === ninjaLeftSensor.shape) {
    ninjaLeftSensor.contactCount--
  }

  if (contactEvent.shapeA === ninjaRightSensor.shape || contactEvent.shapeB === ninjaRightSensor.shape) {
    ninjaRightSensor.contactCount--
  }
}

var gameScene = {
  name: 'game',
  create: function (_sceneParams) {

    widthInPixels = global.renderer.view.width
    heightInPixels = global.renderer.view.height
    pixelsPerMeter = global.renderer.view.height / heightInMeters
    stageToNinjaOffsetX = widthInPixels / 4

    sceneParams = _sceneParams
    spriteUtilities = new SpriteUtilities(PIXI, global.renderer)
    mapLoader = new MapLoader()
    currentLevel = global.levelManager.getCurrentLevel()

    if (world) {
      world.clear()
    }

    world = new p2.World({
      gravity: [0, 10]
    })

    world.islandSplit = false // TODO: figure out why island splitting doesnt work

    window.world = world // TODO: remove before prod

    bodiesToRemove = []

    // set up layers
    this.container = new PIXI.Container()
    this.backgroundLayer = new PIXI.Container()
    this.stage = new PIXI.Container()
    mapLayer = new PIXI.Container()
    var propLayer = new PIXI.Container()
    var guiLayer = new PIXI.Container()
    this.debugDrawContainer = new PIXI.Container()

    global.baseStage.addChild(this.container)

    this.container.addChild(this.backgroundLayer)
    this.container.addChild(this.stage)
    this.container.addChild(guiLayer)
    this.container.addChild(this.debugDrawContainer)

    this.stage.addChild(propLayer)
    this.stage.addChild(mapLayer)

    // set up background layer contents
    // NOTE: bc of the nature of the image it has to be this exact square (suns/moons are round)
    skySprite = new PIXI.Sprite(PIXI.loader.resources['backgroundsky1'].texture)
    skySprite.anchor.x = 0.5
    skySprite.anchor.y = 0.5
    skySprite.position.x = global.renderer.view.width / 2
    skySprite.position.y = global.renderer.view.height / 2
    skySprite.width = global.renderer.view.width
    skySprite.height = global.renderer.view.width

    // NOTE: bc of the nature of the image it doesn't matter that much to stretch it
    backgroundSprite = new PIXI.extras.TilingSprite(
        PIXI.loader.resources['background1'].texture,
        512,
        512)
    backgroundSprite.tileScale.x = global.renderer.view.height / 512
    backgroundSprite.tileScale.y = global.renderer.view.height / 512
    backgroundSprite.height = global.renderer.view.height
    backgroundSprite.width = global.renderer.view.width

    this.backgroundLayer.addChild(skySprite)
    this.backgroundLayer.addChild(backgroundSprite)

    // set up input buttons
    jumpButton = buttonAreaFactory({
      width: global.renderer.view.width,
      height: global.renderer.view.height,
      touchStart: onJumpDown,
    })

    guiLayer.addChild(jumpButton)

    // set up physics
    createNinja()
    mapLoader.loadMap({ // depends on createNinja
      name: currentLevel.name,
      world: world,
      mapLayer: mapLayer,
      propLayer: propLayer,
      ninjaBody: ninjaBody,
      ninjaRadius: ninjaRadius,
      pixelsPerMeter: pixelsPerMeter,
      theme: currentLevel.theme,
      dynamicSprites: dynamicSprites,
    })

    // set up ninja
    ninjaGraphics = new NinjaGraphics({
      container: this.stage,
      ninjaHeight: 1.5,
      pixelsPerMeter: pixelsPerMeter,
      spriteUtilities: spriteUtilities,
    })
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_FALLING)

    world.on('beginContact', beginContact)
    world.on('endContact', endContact)
    world.on('postStep', postStep.bind(this))

    // set up inputs
    document.addEventListener('keypress', onKeyPress.bind(this))

    keyUp = new KeyButton({
      key: 'ArrowUp',
      onKeyDown: onJumpDown,
    })

    keySpace = new KeyButton({
      key: ' ',
      onKeyDown: onJumpDown,
    })

    isPaused = false

    // NOTE: for debugging purposes only, remove in prod
    window.world = world

  },
  destroy: function () {
    this.container.destroy()
    keyUp.destroy()
    keySpace.destroy()
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

    if (isPaused) {
      return
    }

    var stepInSeconds = stepInMilliseconds / 1000
    world.step(stepInSeconds * 1.15)

  },
  draw: function (renderer, ratio) {

    var a
    var b
    var rotation
    var x
    var y

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    if (isPaused) {
      return
    }

    x = gameUtils.calcInterpolatedValue(
        ninjaBody.position[0],
        ninjaBody.previousPosition[0],
        ratio) * pixelsPerMeter

    y = gameUtils.calcInterpolatedValue(
        ninjaBody.position[1],
        ninjaBody.previousPosition[1],
        ratio) * pixelsPerMeter

    rotation = gameUtils.calcInterpolatedValue(
        ninjaBody.angle,
        ninjaBody.previousAngle,
        ratio)

    ninjaGraphics.draw(
        x,
        y,
        rotation,
        ninjaBody)

    for (var i = 0; i < world.bodies.length; i++) {
      var body = world.bodies[i]

      if (body.type === p2.Body.DYNAMIC &&
          body.name !== 'ninjaBody') {

        x = gameUtils.calcInterpolatedValue(
            body.position[0],
            body.previousPosition[0],
            ratio) * pixelsPerMeter

        y = gameUtils.calcInterpolatedValue(
            body.position[1],
            body.previousPosition[1],
            ratio) * pixelsPerMeter

        rotation = gameUtils.calcInterpolatedValue(
            body.angle,
            body.previousAngle,
            ratio)

        dynamicSprites[body.id].x = x
        dynamicSprites[body.id].y = y
        dynamicSprites[body.id].rotation = rotation
      }
    }

    if (ninjaGraphics.x > global.renderer.view.width / 4) {
      this.stage.x = -ninjaGraphics.x + stageToNinjaOffsetX
      backgroundSprite.tilePosition.x = this.stage.x * 0.1
    }

    // debug draw
    if (global.DEBUG_DRAW) {
      DebugDraw.draw(this.debugDrawContainer, world, pixelsPerMeter, ratio)
      this.debugDrawContainer.x = this.stage.x
    }

  },
}

module.exports = gameScene
