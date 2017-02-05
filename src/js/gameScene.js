var p2 = require('p2')
var DebugDraw = require('./DebugDraw')

var pixelsPerMeter = 50
var widthInMeters
var heightInMeters

var world = new p2.World({
  gravity: [0, 10]
})

var PLAYER = Math.pow(2, 0)
var WALL = Math.pow(2, 1)
var SENSOR = Math.pow(2, 2)

window.world = world

var isDown = false
var touchPointInMeters

var hookPoint
var hookBody
var hookConstraint
var isHooked = false
var shouldRemoveHook = false
var shouldAddHook = false
var shouldJump = false
var isRunning = false
var pushedLeft = false
var bounceLeft = false
var pushedRight = false
var bounceRight = false

var ninjaBody
var ninjaSprite

var ninjaBottomSensor
var ninjaLeftSensor
var ninjaRightSensor

var ninjaBottomSensorContactCount = 0
var ninjaLeftSensorContactCount = 0
var ninjaRightSensorContactCount = 0

var lineGraphics

var onDown = function (event) {
  if (isDown === false) { // isHooked === false instead
    if (event.changedTouches) {
      event.clientX = event.changedTouches[0].clientX
      event.clientY = event.changedTouches[0].clientY
    }
    isDown = true
    touchPointInMeters = [
      (-this.stage.x + event.clientX) / pixelsPerMeter,
      event.clientY / pixelsPerMeter,
    ]

    if (isRunning) {
      shouldJump = true
    } else {
      shouldAddHook = true
    }
  }
}

var onUp = function () {
  if (isDown === true) {
    isDown = false
    shouldRemoveHook = true
  }
}

var setupNinja = function() {

  ninjaBody = new p2.Body({
    mass: 0.5,
    position: [3, 0],
    velocity: [0.5, 0],
  })
  ninjaBody.fixedRotation = true

  var circleShape = new p2.Circle({
    radius: (64 / 2) / pixelsPerMeter,
    collisionGroup: PLAYER,
    collisionMask: WALL,
  })
  ninjaBody.addShape(circleShape)
  circleShape.name = 'ninjaShape'

  ninjaBottomSensor = new p2.Circle({
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    sensor: true,
  })
  ninjaBody.addShape(ninjaBottomSensor)
  ninjaBottomSensor.position = [0, 0.7]
  ninjaBottomSensor.worldPosition = [0, 0]
  ninjaBottomSensor.previousWorldPosition = [0, 0]
  ninjaBottomSensor.name = 'ninjaBottomSensor'

  ninjaLeftSensor = new p2.Circle({
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    sensor: true,
  })
  ninjaBody.addShape(ninjaLeftSensor)
  ninjaLeftSensor.position = [-0.7, 0]
  ninjaLeftSensor.worldPosition = [0, 0]
  ninjaLeftSensor.previousWorldPosition = [0, 0]
  ninjaLeftSensor.name = 'ninjaLeftSensor'

  ninjaRightSensor = new p2.Circle({
    radius: 0.2,
    collisionGroup: SENSOR,
    collisionMask: WALL,
    sensor: true,
  })
  ninjaBody.addShape(ninjaRightSensor)
  ninjaRightSensor.position = [0.7, 0]
  ninjaRightSensor.worldPosition = [0, 0]
  ninjaRightSensor.previousWorldPosition = [0, 0]
  ninjaRightSensor.name = 'ninjaRightSensor'

  ninjaBody.damping = 0
  ninjaBody.angularDamping = 0
  ninjaBody.name = 'ninjaBody'
  world.addBody(ninjaBody)

}

var setupHook = function () {
  // setup hook body
  hookBody = new p2.Body({
    position: [10, 0],
    mass: 0, // static
  })

  world.addBody(hookBody)

  // setup hook constraint
  hookConstraint = new p2.DistanceConstraint(hookBody, ninjaBody)
  hookConstraint.upperLimitEnabled = true
  hookConstraint.lowerLimitEnabled = true
  hookConstraint.upperLimit = 1
  hookConstraint.lowerLimit = 1.18
  // hookConstraint.setStiffness(100)
  // hookConstraint.setRelaxation(4)
}

var setupMap = function (stage) {

  var offsetX = widthInMeters * 0.5
  var boxWidth = widthInMeters / 3

  for (var i = 0; i < 100; i++) {
    var shapeWidth = boxWidth
    var shapeHeight = heightInMeters / 6
    var shapeX = offsetX + (widthInMeters / 1.7) * i
    var shapeY = heightInMeters * 0.22
    if (i % 2 === 1) {
      shapeY = heightInMeters * 0.35
      shapeHeight = heightInMeters / 4
    } else if (i % 3 === 1) {
      shapeHeight = heightInMeters / 4
      shapeWidth = 10
      shapeY = heightInMeters - shapeHeight / 2
    }
    shapeY = Math.random() * heightInMeters

    var body = new p2.Body({
      mass: 0,
      position: [shapeX, shapeY],
    })
    body.name = 'wall1'

    var shape = new p2.Box({
      width: shapeWidth,
      height: shapeHeight,
      position: [0, 0],
      collisionGroup: WALL,
      collisionMask: PLAYER | SENSOR,
    })

    shape.name = 'wall'

    body.addShape(shape)
    world.addBody(body)

    var wallSprite = new PIXI.Sprite(PIXI.loader.resources['static_texture_8x8'].texture)
    wallSprite.anchor.x = 0.5
    wallSprite.anchor.y = 0.5
    wallSprite.x = shapeX * pixelsPerMeter
    wallSprite.y = shapeY * pixelsPerMeter
    wallSprite.width = shapeWidth * pixelsPerMeter
    wallSprite.height = shapeHeight * pixelsPerMeter
    stage.addChild(wallSprite)

    // another one at the same x
    shapeY = Math.random() * heightInMeters / 1.5

    var body = new p2.Body({
      mass: 0,
      position: [shapeX, shapeY],
    })
    body.name = 'wall2'

    var shape = new p2.Box({
      width: shapeWidth,
      height: shapeHeight,
      position: [0, 0],
      collisionGroup: WALL,
      collisionMask: PLAYER | SENSOR,
    })
    shape.name = 'wall2'

    body.addShape(shape)
    world.addBody(body)

    var wallSprite = new PIXI.Sprite(PIXI.loader.resources['static_texture_8x8'].texture)
    wallSprite.anchor.x = 0.5
    wallSprite.anchor.y = 0.5
    wallSprite.x = shapeX * pixelsPerMeter
    wallSprite.y = shapeY * pixelsPerMeter
    wallSprite.width = shapeWidth * pixelsPerMeter
    wallSprite.height = shapeHeight * pixelsPerMeter
    stage.addChild(wallSprite)
  }

}

var postStep = function () {

  if (shouldAddHook) {

    var dx = touchPointInMeters[0] - ninjaBody.position[0]
    var dy = touchPointInMeters[1] - ninjaBody.position[1]
    var angle = Math.atan2(dy, dx)
    var toX = Math.cos(angle) * 40 + ninjaBody.position[0]
    var toY = Math.sin(angle) * 40 + ninjaBody.position[1]

    var ray = new p2.Ray({
      mode: p2.Ray.CLOSEST,
      from: [ninjaBody.position[0], ninjaBody.position[1]],
      to: [toX, toY],
      collisionMask: WALL,
    })
    var result = new p2.RaycastResult()
    world.raycast(result, ray)

    if (result.hasHit()) {
      // Get the hit point
      var hitPoint = p2.vec2.create()
      result.getHitPoint(hitPoint, ray)
      hookPoint = hitPoint
      hookBody.position = hookPoint
      hookBody.previousPosition = hookPoint
      hookConstraint.upperLimit = p2.vec2.distance(hookPoint, ninjaBody.position)
      world.addConstraint(hookConstraint)
      isHooked = true
    }
    shouldAddHook = false
  }

  // console.log(hookBody.position[0] - ninjaBody.position[0])
  // if (isHooked &&
  //     hookBody.position[0] - ninjaBody.position[0] < 0.1 &&
  //     ninjaBody.velocity[0] > 0 &&
  //     ninjaBody.velocity[1] < 0) {
  //   ninjaBody.applyForce([6, 0])
  // }
  if (isHooked && hookConstraint.upperLimit > hookConstraint.lowerLimit) {

    hookConstraint.upperLimit -= 0.022
    hookConstraint.update()
  }

  // determine if isRunning
  if (ninjaBottomSensorContactCount > 0) {
    isRunning = true
  } else {
    isRunning = false
  }

  // push away from wall on left side
  if (isHooked && ninjaLeftSensorContactCount > 0 && !pushedLeft) {
    if (ninjaBody.velocity[0] < 0) {
      ninjaBody.velocity[0] = 0
    }
    ninjaBody.applyForce([100, 0])
    pushedLeft = true
    console.log('PUSHED LEFT')
  }

  // jump away from wall on left side
  if (!bounceLeft && !isHooked && ninjaLeftSensorContactCount > 0 && !isRunning) {
    var y = 0
    if (ninjaBody.velocity[0] < 0) {
      ninjaBody.velocity[0] = 0
    }
    if (ninjaBody.velocity[1] <= 0) {
      y = -80
    }
    ninjaBody.applyForce([100, y])
    bounceLeft = true
    console.log('BOUNCE LEFT', y)
  }

  // reset left sensor logic
  if (ninjaLeftSensorContactCount === 0) {
    pushedLeft = false
    bounceLeft = false
  }

  // push away from wall on right side
  if (isHooked && ninjaRightSensorContactCount > 0 && !pushedRight) {
    if (ninjaBody.velocity[0] > 0) {
      ninjaBody.velocity[0] = 0
    }
    ninjaBody.applyForce([-100, 0])
    pushedRight = true
    console.log('PUSHED RIGHT')
  }

  // jump away from wall on right side
  if (!bounceRight && !isHooked && ninjaRightSensorContactCount > 0 && !isRunning) {
    var y = 0
    if (ninjaBody.velocity[0] > 0) {
      ninjaBody.velocity[0] = 0
    }
    if (ninjaBody.velocity[1] <= 0) {
      y = -80
    }
    ninjaBody.applyForce([-100, y])
    bounceRight = true
    console.log('BOUNCE RIGHT', y)
  }

  // reset right sensor logic
  if (ninjaRightSensorContactCount === 0) {
    pushedRight = false
    bounceRight = false
  }

  if (shouldJump) {
    if (ninjaBody.velocity[1] > 0) {
      ninjaBody.velocity[1] = 0
    }
    ninjaBody.applyForce([0, -100])
    shouldJump = false
    console.log('JUMP')
  }

  if (!isHooked && isRunning) {
    // is on top of wall and should be running

    ninjaBody.velocity[0] = 8 // TODO: don't set velocity, check velocity and apply force instead
    console.log('RUNNING')
  }

  if (shouldRemoveHook) {
    world.removeConstraint(hookConstraint)
    shouldRemoveHook = false
    isHooked = false
  }

  ninjaBottomSensor.previousWorldPosition = p2.vec2.clone(ninjaBottomSensor.worldPosition)
  ninjaBody.toWorldFrame(ninjaBottomSensor.worldPosition, ninjaBottomSensor.position)
}

var beginContact = function (contactEvent) {
  // console.log('beginContact', contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaBottomSensor || contactEvent.shapeB === ninjaBottomSensor) {
    ninjaBottomSensorContactCount++
  }

  if (contactEvent.shapeA === ninjaLeftSensor || contactEvent.shapeB === ninjaLeftSensor) {
    ninjaLeftSensorContactCount++
  }

  if (contactEvent.shapeA === ninjaRightSensor || contactEvent.shapeB === ninjaRightSensor) {
    ninjaRightSensorContactCount++
  }
}

var endContact = function (contactEvent) {
  // console.log('endContact',  contactEvent.shapeA.name, contactEvent.shapeB.name, contactEvent)
  if (contactEvent.shapeA === ninjaBottomSensor || contactEvent.shapeB === ninjaBottomSensor) {
    ninjaBottomSensorContactCount--
  }

  if (contactEvent.shapeA === ninjaLeftSensor || contactEvent.shapeB === ninjaLeftSensor) {
    ninjaLeftSensorContactCount--
  }

  if (contactEvent.shapeA === ninjaRightSensor || contactEvent.shapeB === ninjaRightSensor) {
    ninjaRightSensorContactCount--
  }
}

var gameScene = {
  name: 'game',
  create: function () {

    widthInMeters = this.renderer.view.width / pixelsPerMeter
    heightInMeters = this.renderer.view.height / pixelsPerMeter

    this.stage = new PIXI.Container()

    this.baseStage.addChild(this.stage)

    lineGraphics = new PIXI.Graphics()

    this.stage.addChild(lineGraphics)

    setupNinja()
    setupHook()

    setupMap(this.stage)

    ninjaSprite = new PIXI.Sprite(PIXI.loader.resources['ninja'].texture)

    // center the sprite's anchor point
    ninjaSprite.anchor.x = 0.5
    ninjaSprite.anchor.y = 0.5

    this.stage.addChild(ninjaSprite)

    console.log(ninjaSprite)

    console.log(world)

    world.on('beginContact', beginContact)
    world.on('endContact', endContact)
    world.on('postStep', postStep)

    var onDownBinded = onDown.bind(this)

    this.renderer.view.onmousedown = onDownBinded
    this.renderer.view.onmouseup = onUp

    this.renderer.view.addEventListener('touchstart', onDownBinded)
    this.renderer.view.addEventListener('touchend', onUp)


    // this.debugDrawContainer = new PIXI.Container()
    // this.stage.addChild(this.debugDrawContainer)

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

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    ninjaSprite.x = (ninjaBody.position[0] * ratio + ninjaBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.y = (ninjaBody.position[1] * ratio + ninjaBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.rotation = (ninjaBody.angle * ratio + ninjaBody.previousAngle * (1 - ratio))

    lineGraphics.clear()
    if (isHooked) {
      var hookBodyX = (hookBody.position[0] * ratio + hookBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
      var hookBodyY = (hookBody.position[1] * ratio + hookBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter
      lineGraphics.lineStyle(4, 0x663311)
      lineGraphics.moveTo(ninjaSprite.x, ninjaSprite.y)
      lineGraphics.lineTo(hookBodyX, hookBodyY)
    }

    if (ninjaSprite.x > this.renderer.view.width / 4) {
      this.stage.x = -ninjaSprite.x + this.renderer.view.width / 4
    }

    // DebugDraw.draw(this.debugDrawContainer, world, pixelsPerMeter, ratio)

  },
}

module.exports = gameScene
