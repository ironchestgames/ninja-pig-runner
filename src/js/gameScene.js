var debug = require('debug')
var p2 = require('p2')
var DebugDraw = require('./DebugDraw')
var SpriteUtilities = require('../lib/spriteUtilities')
var gameUtils = require('./gameUtils')
var NinjaGraphics = require('./NinjaGraphics')
var NinjaSensor = require('./NinjaSensor')
var Hook = require('./Hook')

var actionsLog = debug('logic:actions')
var buttonsLog = debug('logic:buttons')

var spriteUtilities

var pixelsPerMeter = 50
var heightInMeters = 10
var widthInPixels

var world = new p2.World({
  gravity: [0, 10]
})

// collision groups
var PLAYER = Math.pow(2, 0)
var WALL = Math.pow(2, 1)
var SENSOR = Math.pow(2, 2)
var CEILING = Math.pow(2, 3)

window.world = world

var buttonEventQueue = []
var BUTTON_UPWARD_DOWN = 'BUTTON_UPWARD_DOWN'
var BUTTON_UPWARD_UP = 'BUTTON_UPWARD_UP'
var BUTTON_FORWARD_DOWN = 'BUTTON_FORWARD_DOWN'
var BUTTON_FORWARD_UP = 'BUTTON_FORWARD_UP'

var leftButton
var rightButton

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
var jumpUpForce = 80
var pressingForce = 12
var minimumRunningSpeed = 9
var currentRunningSpeed = 0
var forwardHookShortenSpeed = 0.014
var ninjaMass = 0.45
var forwardHookRelativeAimX = 10
var forwardHookRelativeAimY = -12
var upwardHookRelativeAimX = 0
var upwardHookRelativeAimY = -12

var ninjaBody
var ninjaStartPosition
var ninjaGraphics
var ropeSprite
var backgroundSprite
var skySprite

var ninjaBottomSensor
var ninjaLeftSensor
var ninjaRightSensor

var isKeyUpwardDown = false
var isKeyForwardDown = false

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
}

var onKeyDown = function (event) {
  if (event.key === 'ArrowUp' && !isKeyUpwardDown) {
    buttonEventQueue.push(BUTTON_UPWARD_DOWN)
    isKeyUpwardDown = true
  }

  if (event.key === 'ArrowRight' && !isKeyForwardDown) {
    buttonEventQueue.push(BUTTON_FORWARD_DOWN)
    isKeyForwardDown = true
  }
}

var onKeyUp = function (event) {
  if (event.key === 'ArrowUp' && isKeyUpwardDown) {
    buttonEventQueue.push(BUTTON_UPWARD_UP)
    isKeyUpwardDown = false
  }

  if (event.key === 'ArrowRight' && isKeyForwardDown) {
    buttonEventQueue.push(BUTTON_FORWARD_UP)
    isKeyForwardDown = false
  }
}

var restartNinja = function () {
  ninjaBody.position[0] = ninjaStartPosition[0]
  ninjaBody.position[1] = ninjaStartPosition[1]

  ninjaBody.velocity[0] = 0
  ninjaBody.velocity[1] = 0
}

var createNinja = function() {

  var ninjaRadius
  var bottomShape
  var topShape
  var middleShape

  ninjaRadius = 0.5

  // body
  ninjaBody = new p2.Body({
    mass: ninjaMass,
    velocity: [0.5, -3],
  })
  ninjaBody.fixedRotation = true

  // shapes
  middleShape = new p2.Box({
    width: ninjaRadius * 2,
    height: ninjaRadius * 2,
    collisionGroup: PLAYER,
    collisionMask: WALL,
  })
  ninjaBody.addShape(middleShape)
  middleShape.name = 'middleShape'

  bottomShape = new p2.Circle({
    radius: ninjaRadius,
    collisionGroup: PLAYER,
    collisionMask: WALL,
  })
  ninjaBody.addShape(bottomShape)
  bottomShape.position[1] = ninjaRadius
  bottomShape.name = 'bottomShape'

  topShape = new p2.Circle({
    radius: ninjaRadius,
    collisionGroup: PLAYER,
    collisionMask: WALL,
  })
  ninjaBody.addShape(topShape)
  topShape.position[1] = -ninjaRadius
  topShape.name = 'topShape'

  // sensor bottom
  ninjaBottomSensor = new NinjaSensor({
    name: 'ninjaBottomSensor',
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    relativePosition: [0, ninjaRadius * 2],
  })

  ninjaBody.addShape(ninjaBottomSensor.shape)

  // sensor left
  ninjaLeftSensor = new NinjaSensor({
    name: 'ninjaLeftSensor',
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    relativePosition: [-ninjaRadius, 0],
  })

  ninjaBody.addShape(ninjaLeftSensor.shape)

  // sensor right
  ninjaRightSensor = new NinjaSensor({
    name: 'ninjaRightSensor',
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    relativePosition: [ninjaRadius, 0],
  })

  ninjaBody.addShape(ninjaRightSensor.shape)

  // add to world
  ninjaBody.damping = 0
  ninjaBody.angularDamping = 0
  ninjaBody.name = 'ninjaBody'
  world.addBody(ninjaBody)

}

var createHooks = function () {
  
  forwardHook = new Hook({
    world: world,
    source: ninjaBody,
    relativeAimPoint: [forwardHookRelativeAimX, forwardHookRelativeAimY],
    collisionMask: WALL | CEILING,
    shortenSpeed: forwardHookShortenSpeed,
  })

  upwardHook = new Hook({
    world: world,
    source: ninjaBody,
    relativeAimPoint: [upwardHookRelativeAimX, upwardHookRelativeAimY],
    collisionMask: WALL | CEILING,
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
    collisionGroup: CEILING,
  })

  ceilingBody.addShape(ceilingShape)

  world.addBody(ceilingBody)

}

var getFileNameFromUrl = function (str) {
  return str.split('/').pop().split('.').shift()
}

var loadMap = function (mapLayer, propLayer) {

  var bodiesData
  var body
  var bodyData
  var bodyType
  var bodyTypeMap
  var box
  var boxHeight
  var boxPositionX
  var boxPositionY
  var boxWidth
  var fixtureData
  var fixturesData
  var i
  var image
  var imageData
  var imageName
  var imagesData
  var j
  var sprite
  var spriteX
  var spriteY
  var texture
  var widthHeightRatio
  var worldPosition

  // props first (rendered below the level as of now)
  imagesData = PIXI.loader.resources['level1'].data.image

  for (i = 0; i < imagesData.length; i++) {

    imageData = imagesData[i]
    imageName = getFileNameFromUrl(imageData.file)
    imagePosition = [imageData.center.x, -imageData.center.y]

    texture = PIXI.loader.resources[imageName].texture

    widthHeightRatio = texture.width / texture.height

    sprite = new PIXI.Sprite(texture)

    sprite.anchor.x = 0.5
    sprite.anchor.y = 0.5
    sprite.rotation = imageData.angle || 0
    sprite.x = imagePosition[0] * pixelsPerMeter
    sprite.y = imagePosition[1] * pixelsPerMeter
    sprite.height = imageData.scale * pixelsPerMeter
    sprite.width = imageData.scale * widthHeightRatio * pixelsPerMeter

    propLayer.addChild(sprite)

  }

  // the level

  // rube/box2d to p2 mapping of body type
  bodyTypeMap = {
    [0]: p2.Body.STATIC,
    [1]: p2.Body.KINEMATIC,
    [2]: p2.Body.DYNAMIC,
  }

  worldPosition = [0, 0]

  bodiesData = PIXI.loader.resources['level1'].data.body

  for (i = 0; i < bodiesData.length; i++) {

    bodyData = bodiesData[i]

    if (bodyData.name === 'ninja') {

      ninjaStartPosition = [bodyData.position.x, -bodyData.position.y]
      ninjaBody.position = [bodyData.position.x, -bodyData.position.y]

    } else if (bodyData.name === 'wall' || bodyData.name === 'goal') {

      body = new p2.Body({
        position: [bodyData.position.x, -bodyData.position.y],
        angle: -bodyData.angle,
        mass: bodyData['massData-mass'] || 0,
      })

      body.type = bodyTypeMap[bodyData.type]
      body.name = bodyData.name // NOTE: not in p2 spec, but a nice-to-have for debugging purposes

      world.addBody(body)

      // NOTE: this code assumes that all fixtures are box-shaped
      fixturesData = bodyData.fixture

      for (j = 0; j < fixturesData.length; j++) {
        fixtureData = fixturesData[j]

        boxWidth = Math.abs(fixtureData.polygon.vertices.x[0] - fixtureData.polygon.vertices.x[2])
        boxHeight = Math.abs(fixtureData.polygon.vertices.y[0] - fixtureData.polygon.vertices.y[2])

        boxPositionX = fixtureData.polygon.vertices.x[0] + fixtureData.polygon.vertices.x[2]
        boxPositionY = fixtureData.polygon.vertices.y[0] + fixtureData.polygon.vertices.y[2]

        box = new p2.Box({
          width: boxWidth,
          height: boxHeight,
          position: [boxPositionX, boxPositionY],
          // NOTE: angle for fixtures in rube does not exist
          collisionGroup: WALL,
          collisionMask: PLAYER | SENSOR,
        })

        body.addShape(box)

        // create the sprite for this shape
        var sprite = new PIXI.Sprite(PIXI.loader.resources['static_texture_8x8'].texture)

        body.toWorldFrame(worldPosition, [boxPositionX, boxPositionY])
        sprite.anchor.x = 0.5
        sprite.anchor.y = 0.5
        sprite.x = worldPosition[0] * pixelsPerMeter
        sprite.y = worldPosition[1] * pixelsPerMeter
        sprite.rotation = body.angle
        sprite.width = boxWidth * pixelsPerMeter
        sprite.height = boxHeight * pixelsPerMeter
        mapLayer.addChild(sprite)
      }

    } else if (bodyData.name === 'prop_texture') {

      // NOTE: this code assumes that all prop textures are box-shaped
      fixturesData = bodyData.fixture

      for (j = 0; j < fixturesData.length; j++) {
        fixtureData = fixturesData[j]

        boxWidth = Math.abs(fixtureData.polygon.vertices.x[0] - fixtureData.polygon.vertices.x[2])
        boxHeight = Math.abs(fixtureData.polygon.vertices.y[0] - fixtureData.polygon.vertices.y[2])

        boxPositionX = bodyData.position.x
        boxPositionY = -bodyData.position.y

        // create the sprite for this shape
        var sprite = new PIXI.Sprite(PIXI.loader.resources['prop_texture_8x8'].texture)

        sprite.anchor.x = 0.5
        sprite.anchor.y = 0.5
        sprite.x = boxPositionX * pixelsPerMeter
        sprite.y = boxPositionY * pixelsPerMeter
        sprite.rotation = bodyData.angle
        sprite.width = boxWidth * pixelsPerMeter
        sprite.height = boxHeight * pixelsPerMeter
        propLayer.addChild(sprite)
      }

    }

  }

  createCeiling()

}

var createHookSprite = function (layer) {
  ropeSprite = new PIXI.Sprite(PIXI.loader.resources['rope'].texture)
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

  // update the sensors' values
  ninjaLeftSensor.updateContact()
  ninjaRightSensor.updateContact()
  ninjaBottomSensor.updateContact()

  // remove hook when flying above screen
  if (currentHook && ninjaBody.position[1] < 0) {
    currentHook.unsetHook()
    currentHook = null
  }

  // if hooked
  if (currentHook) {

    // shorten the rope
    currentHook.shorten()

    // pressing (leaning back when swinging kind of)
    if (currentHook.body.position[0] - ninjaBody.position[0] < 1 &&
        currentHook.body.position[0] - ninjaBody.position[0] > 0 &&
        ninjaBody.velocity[0] > 0 &&
        ninjaBody.velocity[1] < 0) {
      ninjaBody.applyForce([pressingForce, 0])
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
  if (ninjaBottomSensor.isContactUsable()) {
    if (!isRunning) {
      if (ninjaBody.velocity[0] < minimumRunningSpeed) {
        currentRunningSpeed = minimumRunningSpeed
      } else {
        currentRunningSpeed = ninjaBody.velocity[0]
      }
    }
    isRunning = true
  } else {
    isRunning = false
  }

  // jump away from wall on left side
  if (!currentHook &&
      !isRunning &&
      ninjaBody.velocity[0] > 0 &&
      ninjaLeftSensor.isContactUsable()) {

    var y = 0
    if (ninjaBody.velocity[0] < 0) {
      ninjaBody.velocity[0] = 0
    }
    if (ninjaBody.velocity[1] <= wallBounceThreshold) {
      y = wallBounceForceY
    }
    ninjaBody.applyForce([wallBounceForceX, y])
    ninjaLeftSensor.setContactUsed(true)
    actionsLog('BOUNCE LEFT', y)
  }

  // jump away from wall on right side
  if (!currentHook &&
      !isRunning &&
      ninjaBody.velocity[0] < 0 &&
      ninjaRightSensor.isContactUsable()) {

    var y = 0
    if (ninjaBody.velocity[0] > 0) {
      ninjaBody.velocity[0] = 0
    }
    if (ninjaBody.velocity[1] <= wallBounceThreshold) {
      y = wallBounceForceY
    }
    ninjaBody.applyForce([-wallBounceForceX, y])
    ninjaRightSensor.setContactUsed(true)
    actionsLog('BOUNCE RIGHT', y)
  }

  // jump up
  if (shouldJump) {
    if (ninjaBody.velocity[1] > 0) {
      ninjaBody.velocity[1] = 0
    }
    ninjaBody.applyForce([0, -jumpUpForce])
    ninjaBottomSensor.setContactUsed(true)
    shouldJump = false
    isRunning = false
    actionsLog('JUMP')
    ninjaGraphics.handleEvent(NinjaGraphics.EVENT_INAIR_UPWARDS)
  }

  // determine if already jumped while in contact with ground
  if (ninjaBottomSensor.contactCount === 0) {
    ninjaGraphics.handleEvent(NinjaGraphics.EVENT_INAIR_UPWARDS)
  }

  if (!currentHook && isRunning) {
    // is on top of wall and should be running

    ninjaBody.velocity[0] = currentRunningSpeed // TODO: don't set velocity, check velocity and apply force instead
    actionsLog('RUNNING')
    ninjaGraphics.handleEvent(NinjaGraphics.EVENT_RUNNING)

  }

  if (!isRunning) {
    if (currentHook) {
      ninjaGraphics.handleEvent(NinjaGraphics.EVENT_INAIR_FALLING)
    } else if (ninjaBody.velocity[1] < 0) {
      ninjaGraphics.handleEvent(NinjaGraphics.EVENT_INAIR_UPWARDS)
    } else if (ninjaBody.velocity[1] > 0) {
      ninjaGraphics.handleEvent(NinjaGraphics.EVENT_INAIR_FALLING)
    }
  }

  // TODO: what is this? is it for debugging?
  ninjaBottomSensor.shape.previousWorldPosition = p2.vec2.clone(ninjaBottomSensor.shape.worldPosition)
  ninjaBody.toWorldFrame(ninjaBottomSensor.shape.worldPosition, ninjaBottomSensor.shape.position)

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
      restartNinja()
    }
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
  create: function () {

    widthInPixels = this.renderer.view.width
    pixelsPerMeter = this.renderer.view.height / heightInMeters

    spriteUtilities = new SpriteUtilities(PIXI, this.renderer)

    // set up layers
    this.backgroundLayer = new PIXI.Container()
    this.stage = new PIXI.Container()
    var mapLayer = new PIXI.Container()
    var propLayer = new PIXI.Container()
    var guiLayer = new PIXI.Container()
    this.debugDrawContainer = new PIXI.Container()

    this.baseStage.addChild(this.backgroundLayer)
    this.baseStage.addChild(this.stage)
    this.baseStage.addChild(guiLayer)
    this.baseStage.addChild(this.debugDrawContainer)

    this.stage.addChild(propLayer)
    this.stage.addChild(mapLayer)

    // set up background layer contents
    // NOTE: bc of the nature of the image it has to be this exact square (suns/moons are round)
    skySprite = new PIXI.Sprite(PIXI.loader.resources['backgroundsky1'].texture)
    skySprite.anchor.x = 0.5
    skySprite.anchor.y = 0.5
    skySprite.position.x = this.renderer.view.width / 2
    skySprite.position.y = this.renderer.view.height / 2
    skySprite.width = this.renderer.view.width
    skySprite.height = this.renderer.view.width

    // NOTE: bc of the nature of the image it doesn't matter that much to stretch it
    backgroundSprite = new PIXI.extras.TilingSprite(
        PIXI.loader.resources['background1'].texture,
        512,
        512)
    backgroundSprite.tileScale.x = this.renderer.view.height / 512
    backgroundSprite.tileScale.y = this.renderer.view.height / 512
    backgroundSprite.height = this.renderer.view.height
    backgroundSprite.width = this.renderer.view.width

    this.backgroundLayer.addChild(skySprite)
    this.backgroundLayer.addChild(backgroundSprite)

    // set up input buttons
    leftButton = new PIXI.Sprite(PIXI.Texture.EMPTY)
    leftButton.renderable = false
    leftButton.interactive = true
    leftButton.width = this.renderer.view.width / 2
    leftButton.height = this.renderer.view.height

    leftButton.on('touchstart', onLeftDown)
    leftButton.on('touchend', onLeftUp)

    rightButton = new PIXI.Sprite(PIXI.Texture.EMPTY)
    rightButton.renderable = false
    rightButton.interactive = true
    rightButton.width = this.renderer.view.width / 2
    rightButton.height = this.renderer.view.height
    rightButton.position.x = this.renderer.view.width / 2

    rightButton.on('touchstart', onRightDown)
    rightButton.on('touchend', onRightUp)

    guiLayer.addChild(leftButton)
    guiLayer.addChild(rightButton)

    // set up physics
    createNinja()
    createHooks() // depends on createNinja
    loadMap(mapLayer, propLayer) // depends on createNinja

    // set up ninja and hook
    ninjaGraphics = new NinjaGraphics({
      container: this.stage,
      ninjaHeight: 2,
      pixelsPerMeter: pixelsPerMeter,
      spriteUtilities: spriteUtilities,
    })
    createHookSprite(this.stage)

    world.on('beginContact', beginContact)
    world.on('endContact', endContact)
    world.on('postStep', postStep.bind(this))

    // set up inputs
    document.addEventListener('keypress', onKeyPress.bind(this))
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    // NOTE: for debugging purposes only, remove in prod
    window.world = world

  },
  destroy: function () {
    this.stage = null
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

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
        ratio) * pixelsPerMeter

    ninjaGraphics.draw(
        x,
        y,
        rotation)

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

      a = hookBodyX - ninjaGraphics.x
      b = hookBodyY - ninjaGraphics.y
      ropeSprite.x = ninjaGraphics.x
      ropeSprite.y = ninjaGraphics.y
      ropeSprite.width = Math.sqrt(a * a + b * b)
      ropeSprite.rotation = Math.atan2(b, a)

    } else {

      ropeSprite.visible = false
    }

    if (ninjaGraphics.x > this.renderer.view.width / 4) {
      this.stage.x = -ninjaGraphics.x + this.renderer.view.width / 4
      backgroundSprite.tilePosition.x = this.stage.x * 0.1
    }

    if (global.DEBUG_DRAW) {
      DebugDraw.draw(this.debugDrawContainer, world, pixelsPerMeter, ratio)
      this.debugDrawContainer.x = this.stage.x
    }

  },
}

module.exports = gameScene
