var debug = require('debug')
var p2 = require('p2')
var DebugDraw = require('./DebugDraw')
var SpriteUtilities = require('../lib/spriteUtilities')
var gameUtils = require('./gameUtils')
var NinjaGraphics = require('./NinjaGraphics')
var NinjaSensor = require('./NinjaSensor')
var Hook = require('./Hook')
var MapLoader = require('./MapLoader')
var gameVars = require('./gameVars')
var buttonAreaFactory = require('./buttonAreaFactory')
var KeyButton = require('./KeyButton')

var actionsLog = debug('gameScene:actions')
var buttonsLog = debug('gameScene:buttons')

var isPaused = false

var spriteUtilities
var mapLoader
var resourceLoader
var sceneParams

var pixelsPerMeter = 50
var heightInMeters = 10
var widthInPixels

var world
var bodiesToRemove = []
var capturedBalloonBodies = []

var buttonEventQueue = []
var BUTTON_UPWARD_DOWN = 'BUTTON_UPWARD_DOWN'
var BUTTON_UPWARD_UP = 'BUTTON_UPWARD_UP'
var BUTTON_FORWARD_DOWN = 'BUTTON_FORWARD_DOWN'
var BUTTON_FORWARD_UP = 'BUTTON_FORWARD_UP'

var leftButton
var rightButton

var keyRight
var keyUp

var forwardHook
var shouldRemoveForwardHook = false
var shouldAddForwardHook = false

var upwardHook
var shouldRemoveUpwardHook = false
var shouldAddUpwardHook = false

var currentHook = null

var shouldJump = false
var isRunning = false

var wallPushForce = 85
var wallBounceForceX = 100
var wallBounceForceY = -70
var wallBounceThreshold = 1
var jumpUpForce = 100
var pressingForce = 12
var minimumRunningSpeed = 10
var currentRunningSpeed = 0
var forwardHookShortenSpeed = 0.015
var forwardHookRelativeAimX = 10
var forwardHookRelativeAimY = -12
var upwardHookRelativeAimX = 0
var upwardHookRelativeAimY = -12
var dieOfFallY = 13
var ninjaRadius = 0.375
var balloonHolderLocalAnchor = [0, 0.25]

var ninjaBody
var ninjaHandBody
var ninjaBalloonHolderBody
var ninjaGraphics
var ropeSprite
var backgroundSprite
var skySprite
var dynamicSprites = {}
var ballonStringSprites = {}
var mapLayer
var ballonStringLayer

var ninjaBottomSensor
var ninjaLeftSensor
var ninjaRightSensor

var tempVector = [0, 0]

var onLeftDown = function (event) {
  buttonsLog('onLeftDown', event)
  buttonEventQueue.push(BUTTON_UPWARD_DOWN)
}

var onLeftUp = function (event) {
  buttonsLog('onLeftUp', event)
  buttonEventQueue.push(BUTTON_UPWARD_UP)
}

var onRightDown = function (event) {
  buttonsLog('onRightDown', event)
  buttonEventQueue.push(BUTTON_FORWARD_DOWN)
}

var onRightUp = function (event) {
  buttonsLog('onRightUp', event)
  buttonEventQueue.push(BUTTON_FORWARD_UP)
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

  ninjaHandBody.position[0] = mapLoader.ninjaStartPosition[0]
  ninjaHandBody.position[1] = mapLoader.ninjaStartPosition[1]

  ninjaBody.velocity[0] = 0
  ninjaBody.velocity[1] = 0
}

var levelFail = function (sceneParams) {
  isPaused = true
  global.sceneManager.changeScene('levelFail', sceneParams)
}

var levelWon = function (sceneParams) {
  isPaused = true
  global.sceneManager.changeScene('levelWon', sceneParams)
}

var createNinja = function() {

  var bottomShape
  var topShape
  var middleShape

  // body
  ninjaBody = new p2.Body({
    mass: 0.35,
    velocity: [0.5, -3],
  })
  ninjaBody.fixedRotation = true

  // hand body
  ninjaHandBody = new p2.Body({
    mass: 0.1,
  })
  ninjaHandBody.name = 'ninjaHandBody'
  ninjaHandBody.position[0] = ninjaRadius + 0.07
  ninjaHandBody.position[1] = -0.15

  // balloon holder body
  ninjaBalloonHolderBody = new p2.Body()
  ninjaBalloonHolderBody.name = 'ninjaBalloonHolderBody'
  ninjaBalloonHolderBody.type = p2.Body.KINEMATIC

  // shapes
  middleShape = new p2.Box({
    width: ninjaRadius * 2,
    height: ninjaRadius * 2,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL,
  })
  ninjaBody.addShape(middleShape)
  middleShape.name = 'middleShape'

  bottomShape = new p2.Circle({
    radius: ninjaRadius * 1.1,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL | gameVars.BALLOON,
  })
  ninjaBody.addShape(bottomShape)
  bottomShape.position[1] = ninjaRadius
  bottomShape.name = 'bottomShape'

  topShape = new p2.Circle({
    radius: ninjaRadius,
    collisionGroup: gameVars.PLAYER,
    collisionMask: gameVars.WALL | gameVars.BALLOON,
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
    collisionMask: gameVars.WALL | gameVars.BALLOON,
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
  world.addBody(ninjaHandBody)
  world.addBody(ninjaBalloonHolderBody)

  // hand body constraint
  ninjaHandBodyConstraint = new p2.LockConstraint(ninjaBody, ninjaHandBody, {
    collideConnected: false,
  })

  world.addConstraint(ninjaHandBodyConstraint)

}

var createHooks = function () {
  
  forwardHook = new Hook({
    world: world,
    source: ninjaHandBody,
    relativeAimPoint: [forwardHookRelativeAimX, forwardHookRelativeAimY],
    collisionMask: gameVars.WALL | gameVars.CEILING,
    shortenSpeed: forwardHookShortenSpeed,
  })

  upwardHook = new Hook({
    world: world,
    source: ninjaHandBody,
    relativeAimPoint: [upwardHookRelativeAimX, upwardHookRelativeAimY],
    collisionMask: gameVars.WALL | gameVars.CEILING,
    shortenSpeed: forwardHookShortenSpeed,
  })

}

var createCeiling = function () {

  var ceilingBody
  var ceilingShape
  var highestX
  var i

  highestX = 0

  // NOTE: only getting the bodies position since we only need an approx. value
  for (i = 0; i < world.bodies.length; i++) {
    if (world.bodies[i].position[0] > highestX) {
      highestX = world.bodies[i].position[0]
    }
  }

  ceilingBody = new p2.Body({
    position: [highestX / 2, -1],
    type: p2.Body.STATIC,
  })

  ceilingShape = new p2.Box({
    position: [0, 0],
    width: highestX,
    height: 2,
    collisionGroup: gameVars.CEILING,
  })

  ceilingBody.addShape(ceilingShape)

  world.addBody(ceilingBody)

}

var createBalloonString = function () {
  var sprite = new PIXI.Sprite(resourceLoader.resources['rope'].texture)
  sprite.anchor.y = 0.5

  ballonStringLayer.addChild(sprite)

  return sprite
}

var createHookSprite = function (layer) {
  ropeSprite = new PIXI.Sprite(resourceLoader.resources['rope'].texture)
  ropeSprite.anchor.y = 0.5

  layer.addChild(ropeSprite)
}

var postStep = function () {
  var buttonEvent

  while (buttonEventQueue.length > 0) {
    buttonEvent = buttonEventQueue.shift()

    switch (buttonEvent) {
      case BUTTON_UPWARD_DOWN:
        if (currentHook) {
          buttonsLog('unset current on UPWARD')
          currentHook.unsetHook()
          currentHook = null
        }
        if (isRunning) {
          shouldJump = true
        } else {
          upwardHook.setHook()
          currentHook = upwardHook
        }
        break

      case BUTTON_FORWARD_DOWN:
        if (currentHook) {
          buttonsLog('unset current on FORWARD')
          currentHook.unsetHook()
          currentHook = null
        }
        if (isRunning) {
          shouldJump = true
        } else {
          forwardHook.setHook()
          currentHook = forwardHook
        }
        break

      case BUTTON_UPWARD_UP:
        if (currentHook === upwardHook) {
          buttonsLog('unset upwardHook')
          currentHook.unsetHook()
          currentHook = null
        }
        break

      case BUTTON_FORWARD_UP:
        if (currentHook === forwardHook) {
          buttonsLog('unset forwardHook')
          currentHook.unsetHook()
          currentHook = null
        }
        break
    }
  }

  actionsLog('STEP')

  // remove bodies from bodiesToRemove
  while (bodiesToRemove.length > 0) {
    var body = bodiesToRemove.pop()
    var sprite = dynamicSprites[body.id]
    mapLayer.removeChild(sprite)
    world.removeBody(body)
  }

  // update balloon holder position
  ninjaBalloonHolderBody.position[0] = ninjaBody.position[0]
  ninjaBalloonHolderBody.position[1] = ninjaBody.position[1]

  // update the sensors' values
  ninjaLeftSensor.postStep()
  ninjaRightSensor.postStep()
  ninjaBottomSensor.postStep()

  // remove hook when flying above screen
  if (currentHook && ninjaBody.position[1] < 0) {
    currentHook.unsetHook()
    currentHook = null
  }

  // if hooked
  if (currentHook) {

    // shorten the rope
    currentHook.shorten()

    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_HOOKED)

    // pressing (leaning back when swinging kind of)
    if (currentHook.body.position[0] - ninjaBody.position[0] > 0 &&
        ninjaBody.velocity[0] > 0 &&
        ninjaBody.velocity[1] < 0 &&
        ninjaBottomSensor.contactCount <= 0) {
      ninjaBody.applyForce([pressingForce, pressingForce])
      actionsLog('PRESSING')
    }

    // push away from wall on left side
    if (ninjaLeftSensor.isContactUsable() && ninjaBody.velocity[0] > 0) {
      if (ninjaBody.velocity[0] < 0) {
        ninjaBody.velocity[0] = 0
      }
      ninjaBody.applyForce([wallPushForce, 0])
      ninjaLeftSensor.setContactUsed(true)
      actionsLog('PUSHED LEFT')
    }

    // push away from wall on right side
    if (ninjaRightSensor.isContactUsable() && ninjaBody.velocity[0] < 0) {
      if (ninjaBody.velocity[0] > 0) {
        ninjaBody.velocity[0] = 0
      }
      ninjaBody.applyForce([-wallPushForce, 0])
      ninjaRightSensor.setContactUsed(true)
      actionsLog('PUSHED RIGHT')
    }
  }

  // determine if isRunning
  if (!currentHook &&
      !shouldJump &&
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
  if (!currentHook &&
      !isRunning &&
      ninjaBody.velocity[0] > 0 &&
      ninjaLeftSensor.isContactUsable()) {

    var y = 0
    if (ninjaBody.velocity[1] <= wallBounceThreshold) {
      y = wallBounceForceY
    }

    ninjaBody.velocity[0] = 0

    ninjaBody.applyForce([wallBounceForceX, y])
    ninjaLeftSensor.setContactUsed(true)
    ninjaGraphics.changeState(NinjaGraphics.STATE_BOUNCED_LEFT)
    actionsLog('BOUNCE LEFT', y)
  }

  // jump away from wall on right side
  if (!currentHook &&
      !isRunning &&
      ninjaBody.velocity[0] < 0 &&
      ninjaRightSensor.isContactUsable()) {

    var y = 0
    if (ninjaBody.velocity[1] <= wallBounceThreshold) {
      y = wallBounceForceY
    }

    ninjaBody.velocity[0] = 0

    ninjaBody.applyForce([-wallBounceForceX, y])
    ninjaRightSensor.setContactUsed(true)
    ninjaGraphics.changeState(NinjaGraphics.STATE_BOUNCED_RIGHT)
    actionsLog('BOUNCE RIGHT', y)
  }

  // jump up
  if (shouldJump) {
    ninjaBody.velocity[1] = 0
    ninjaBody.applyForce([0, -jumpUpForce])
    ninjaBottomSensor.setContactUsed(true)
    shouldJump = false
    actionsLog('JUMP')
    ninjaGraphics.changeState(NinjaGraphics.STATE_INAIR_UPWARDS)
  }

  if (!currentHook && ninjaBody.position[1] > dieOfFallY) {
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

    // end of level check
    if (contactEvent.bodyA.name === 'goal' || contactEvent.bodyB.name === 'goal') {
      levelWon(sceneParams)
    }
  }

  if ((contactEvent.bodyA.name === 'balloon' || contactEvent.bodyB.name === 'balloon') &&
    (contactEvent.bodyA.name === 'ninjaBody' || contactEvent.bodyB.name === 'ninjaBody')) {
    var balloonBody = contactEvent.bodyA
    if (contactEvent.bodyB.name === 'balloon') {
      balloonBody = contactEvent.bodyB
    }

    // constrain balloon to balloon holder
    var constraint = new p2.DistanceConstraint(ninjaBalloonHolderBody, balloonBody, {
      localAnchorB: balloonHolderLocalAnchor,
    })
    constraint.upperLimitEnabled = true
    constraint.lowerLimitEnabled = true
    constraint.lowerLimit = 0
    constraint.upperLimit = 0.5
    constraint.setStiffness(10)
    constraint.setRelaxation(1)
    world.addConstraint(constraint)

    for (var i = 0; i < balloonBody.shapes.length; i++) {
      var shape = balloonBody.shapes[i]
      shape.collisionMask = gameVars.CAPTURED_BALLOON
      shape.collisionGroup = gameVars.CAPTURED_BALLOON
      shape.collisionResponse = true
    }

    capturedBalloonBodies.push(balloonBody)

    balloonBody.toWorldFrame(tempVector, balloonHolderLocalAnchor)
    balloonBody.localAnchorBPreviousWorldPosition = p2.vec2.clone(tempVector)

    ballonStringSprites[balloonBody.id] = createBalloonString()

    // TODO: count the balloons, target next
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
    pixelsPerMeter = global.renderer.view.height / heightInMeters

    sceneParams = _sceneParams
    resourceLoader = sceneParams.resourceLoader
    spriteUtilities = new SpriteUtilities(PIXI, global.renderer)
    mapLoader = new MapLoader()

    if (world) {
      world.clear()
    }

    world = new p2.World({
      gravity: [0, 10]
    })

    window.world = world // TODO: remove before prod

    bodiesToRemove = []
    capturedBalloonBodies = []
    ballonStringSprites = {} // TODO: do the same to dynamic sprites

    // set up layers
    this.container = new PIXI.Container()
    this.backgroundLayer = new PIXI.Container()
    this.stage = new PIXI.Container()
    mapLayer = new PIXI.Container()
    ballonStringLayer = new PIXI.Container()
    var propLayer = new PIXI.Container()
    var guiLayer = new PIXI.Container()
    this.debugDrawContainer = new PIXI.Container()

    global.baseStage.addChild(this.container)

    this.container.addChild(this.backgroundLayer)
    this.container.addChild(this.stage)
    this.container.addChild(guiLayer)
    this.container.addChild(this.debugDrawContainer)

    this.stage.addChild(propLayer)
    this.stage.addChild(ballonStringLayer)
    this.stage.addChild(mapLayer)

    // set up background layer contents
    // NOTE: bc of the nature of the image it has to be this exact square (suns/moons are round)
    skySprite = new PIXI.Sprite(resourceLoader.resources['backgroundsky1'].texture)
    skySprite.anchor.x = 0.5
    skySprite.anchor.y = 0.5
    skySprite.position.x = global.renderer.view.width / 2
    skySprite.position.y = global.renderer.view.height / 2
    skySprite.width = global.renderer.view.width
    skySprite.height = global.renderer.view.width

    // NOTE: bc of the nature of the image it doesn't matter that much to stretch it
    backgroundSprite = new PIXI.extras.TilingSprite(
        resourceLoader.resources['background1'].texture,
        512,
        512)
    backgroundSprite.tileScale.x = global.renderer.view.height / 512
    backgroundSprite.tileScale.y = global.renderer.view.height / 512
    backgroundSprite.height = global.renderer.view.height
    backgroundSprite.width = global.renderer.view.width

    this.backgroundLayer.addChild(skySprite)
    this.backgroundLayer.addChild(backgroundSprite)

    // set up input buttons
    leftButton = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      touchStart: onLeftDown,
      touchEnd: onLeftUp,
    })

    rightButton = buttonAreaFactory({
      width: global.renderer.view.width / 2,
      height: global.renderer.view.height,
      x: global.renderer.view.width / 2,
      touchStart: onRightDown,
      touchEnd: onRightUp,
    })

    guiLayer.addChild(leftButton)
    guiLayer.addChild(rightButton)

    // set up physics
    createNinja()
    createHooks() // depends on createNinja
    mapLoader.loadMap({ // depends on createNinja
      resourceLoader: resourceLoader,
      name: 'level' + sceneParams.level,
      world: world,
      mapLayer: mapLayer,
      propLayer: propLayer,
      ninjaBody: ninjaBody,
      ninjaRadius: ninjaRadius,
      pixelsPerMeter: pixelsPerMeter,
      staticsColor: 0x261d05,
      dynamicSprites: dynamicSprites,
    })
    createCeiling()

    // set up ninja and hook graphics
    createHookSprite(this.stage)
    ninjaGraphics = new NinjaGraphics({
      resourceLoader: resourceLoader,
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

    keyRight = new KeyButton({
      key: 'ArrowRight',
      onKeyDown: onRightDown,
      onKeyUp: onRightUp,
    })

    keyUp = new KeyButton({
      key: 'ArrowUp',
      onKeyDown: onLeftDown,
      onKeyUp: onLeftUp,
    })

    isPaused = false

    // NOTE: for debugging purposes only, remove in prod
    window.world = world

  },
  destroy: function () {
    this.container.destroy()
    keyRight.destroy()
    keyUp.destroy()
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

    if (isPaused) {
      return
    }

    var stepInSeconds = stepInMilliseconds / 1000
    world.step(stepInSeconds)

  },
  draw: function (renderer, ratio) {

    var a
    var b
    var currentHook
    var hookBodyX
    var hookBodyY
    var rotation
    var x
    var y

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    if (isPaused) {
      return
    }

    currentHook = null

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

    if (forwardHook.isHooked) {
      currentHook = forwardHook
    } else if (upwardHook.isHooked) {
      currentHook = upwardHook
    }

    if (currentHook) {

      ropeSprite.visible = true

      hookBodyX = gameUtils.calcInterpolatedValue(
          currentHook.body.position[0],
          currentHook.body.previousPosition[0],
          ratio) * pixelsPerMeter
      hookBodyY = gameUtils.calcInterpolatedValue(
          currentHook.body.position[1],
          currentHook.body.previousPosition[1],
          ratio) * pixelsPerMeter

      handX = gameUtils.calcInterpolatedValue(
        ninjaHandBody.position[0],
        ninjaHandBody.previousPosition[0],
        ratio) * pixelsPerMeter

      handY = gameUtils.calcInterpolatedValue(
        ninjaHandBody.position[1],
        ninjaHandBody.previousPosition[1],
        ratio) * pixelsPerMeter

      a = hookBodyX - handX
      b = hookBodyY - handY
      ropeSprite.x = handX
      ropeSprite.y = handY
      ropeSprite.width = Math.sqrt(a * a + b * b)
      ropeSprite.rotation = Math.atan2(b, a)

    } else {

      ropeSprite.visible = false
    }

    for (var i = 0; i < capturedBalloonBodies.length; i++) {
      var balloonBody = capturedBalloonBodies[i]
      var sprite = ballonStringSprites[balloonBody.id]

      balloonBody.toWorldFrame(tempVector, balloonHolderLocalAnchor)


      balloonX = gameUtils.calcInterpolatedValue(
          tempVector[0],
          balloonBody.localAnchorBPreviousWorldPosition[0],
          ratio) * pixelsPerMeter
      balloonY = gameUtils.calcInterpolatedValue(
          tempVector[1],
          balloonBody.localAnchorBPreviousWorldPosition[1],
          ratio) * pixelsPerMeter

      balloonBody.localAnchorBPreviousWorldPosition = p2.vec2.clone(tempVector) // NOTE: save this world position

      ninjaX = gameUtils.calcInterpolatedValue(
        ninjaBody.position[0],
        ninjaBody.previousPosition[0],
        ratio) * pixelsPerMeter

      ninjaY = gameUtils.calcInterpolatedValue(
        ninjaBody.position[1],
        ninjaBody.previousPosition[1],
        ratio) * pixelsPerMeter

      a = balloonX - ninjaX
      b = balloonY - ninjaY
      sprite.x = ninjaX
      sprite.y = ninjaY
      sprite.width = Math.sqrt(a * a + b * b)
      sprite.rotation = Math.atan2(b, a)

    }

    for (var i = 0; i < world.bodies.length; i++) {
      var body = world.bodies[i]

      if (body.type === p2.Body.DYNAMIC &&
          body.name !== 'ninjaBody' &&
          body.name !== 'ninjaHandBody' &&
          body.name !== 'hook') {

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
      this.stage.x = -ninjaGraphics.x + global.renderer.view.width / 4
      backgroundSprite.tilePosition.x = this.stage.x * 0.1
    }

    if (global.DEBUG_DRAW) {
      DebugDraw.draw(this.debugDrawContainer, world, pixelsPerMeter, ratio)
      this.debugDrawContainer.x = this.stage.x
    }

  },
}

module.exports = gameScene
