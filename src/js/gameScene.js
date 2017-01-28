var p2 = require('p2')

var pixelsPerMeter = 50
var widthInMeters
var heightInMeters

var world = new p2.World({
  gravity: [0, 10]
})

var ninjaMaterial
var wallMaterial

window.world = world

var isDown = false

var hookPoint
var hookBody
var hookConstraint
var isHooked = false
var shouldRemoveHook = false
var shouldAddHook = false

var ninjaBody
var ninjaSprite

var lineGraphics

var onDown = function (event) {
  if (isDown === false) {
    if (event.changedTouches) {
      event.clientX = event.changedTouches[0].clientX
      event.clientY = event.changedTouches[0].clientY
    }
    isDown = true
    hookPoint = [
      (-this.stage.x + event.clientX) / pixelsPerMeter,
      event.clientY / pixelsPerMeter,
    ]
    setupHook()
  }
}

var onUp = function () {
  if (isDown === true) {
    isDown = false
    removeHook()
  }
}

var setupNinjaAndHook = function() {

  ninjaMaterial = new p2.Material()

  ninjaBody = new p2.Body({
    mass: 0.5,
    position: [3, 0],
  })

  var circleShape = new p2.Circle({ radius: (64 / 2) / pixelsPerMeter });
  circleShape.material = ninjaMaterial
  ninjaBody.addShape(circleShape)

  ninjaBody.damping = 0
  ninjaBody.angularDamping = 0

  world.addBody(ninjaBody)

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
  hookConstraint.lowerLimit = 0
  // hookConstraint.setStiffness(100)
  // hookConstraint.setRelaxation(4)

}

var setupHook = function () {
  shouldAddHook = true
}

var removeHook = function () {
  shouldRemoveHook = true
}

// var constrainVelocity = function (body, maxVelocity) {
//   var angle
//   var currVelocitySqr
//   var vx
//   var vy
//   var newx
//   var newy

//   vx = body.velocity[0]
//   vy = body.velocity[1]
//   currVelocitySqr = vx * vx + vy * vy

//   if (currVelocitySqr > maxVelocity * maxVelocity) {
//     angle = Math.atan2(vy, vx)
//     newx = Math.cos(angle) * maxVelocity
//     newy = Math.sin(angle) * maxVelocity
//     body.velocity[0] = newx
//     body.velocity[1] = newy
//     // console.log('limited speed to', maxVelocity)
//   }
// }

var setupMap = function (stage) {

  wallMaterial = new p2.Material()
  var offsetX = widthInMeters * 0.5
  var boxWidth = widthInMeters / 3

  for (var i = 0; i < 100; i++) {
    var shapeWidth = boxWidth
    var shapeHeight = heightInMeters / 6
    var shapeX = offsetX + (widthInMeters / 1.5) * i
    var shapeY = heightInMeters * 0.22
    if (i % 2 === 1) {
      shapeY = heightInMeters * 0.35
      shapeHeight = heightInMeters / 4
    } else if (i % 3 === 1) {
      shapeHeight = heightInMeters / 4
      shapeWidth = 10
      shapeY = heightInMeters - shapeHeight / 2
    }

    var body = new p2.Body({
      mass: 0,
      position: [shapeX, shapeY],
    })

    var shape = new p2.Box({
      width: shapeWidth,
      height: shapeHeight,
      position: [0, 0],
    })

    shape.material = wallMaterial

    body.addShape(shape)
    world.addBody(body)

    var sprite = new PIXI.Graphics()
    sprite.beginFill(0x003333)
    sprite.drawRect(
      (shapeX - shapeWidth / 2) * pixelsPerMeter,
      (shapeY - shapeHeight / 2) * pixelsPerMeter,
      shapeWidth * pixelsPerMeter,
      shapeHeight * pixelsPerMeter)
    stage.addChild(sprite)
  }

}

var setupMaterials = function () {
  var contactMaterial = new p2.ContactMaterial(wallMaterial, ninjaMaterial, {
    restitution: 0.65,
    // friction: 1,
  })
  world.addContactMaterial(contactMaterial)
}

var postStep = function () {
  if (shouldRemoveHook) {
    world.removeConstraint(hookConstraint)
    shouldRemoveHook = false
    isHooked = false
  }
  if (shouldAddHook) {
    // hookPoint[1] = 0
    hookBody.position = hookPoint
    hookBody.previousPosition = hookPoint
    world.addConstraint(hookConstraint)
    hookConstraint.upperLimit = p2.vec2.distance(hookPoint, ninjaBody.position)
    hookConstraint.update()
    shouldAddHook = false
    isHooked = true
  }

  // console.log(hookBody.position[0] - ninjaBody.position[0])
  if (isHooked && hookBody.position[0] - ninjaBody.position[0] < 0.1) {
    ninjaBody.applyForce([6, 0])
  }
  if (isHooked) {
    hookConstraint.upperLimit -= 0.022
    hookConstraint.update()
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

    setupNinjaAndHook()

    setupMap(this.stage)

    setupMaterials()

    ninjaSprite = new PIXI.Sprite(PIXI.loader.resources['ninja'].texture)

    // center the sprite's anchor point
    ninjaSprite.anchor.x = 0.5
    ninjaSprite.anchor.y = 0.5

    this.stage.addChild(ninjaSprite)

    console.log(ninjaSprite)

    console.log(world)

    world.on('postStep', postStep)

    var onDownBinded = onDown.bind(this)

    this.renderer.view.onmousedown = onDownBinded
    this.renderer.view.onmouseup = onUp

    this.renderer.view.addEventListener('touchstart', onDownBinded)
    this.renderer.view.addEventListener('touchend', onUp)

  },
  destroy: function () {
    this.stage = null
  },
  update: function (stepInMilliseconds) {

    // update objects
    // leave previous/next positions accessible
    // (velocities are in units/ms)

    // console.log(ninjaBody.position[0], ninjaBody.position[1])

    var stepInSeconds = stepInMilliseconds / 1000
    world.step(stepInSeconds)

  },
  draw: function (renderer, ratio) {

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    ninjaSprite.x = (ninjaBody.position[0] * ratio + ninjaBody.previousPosition[0] * (1 - ratio)) * pixelsPerMeter
    ninjaSprite.y = (ninjaBody.position[1] * ratio + ninjaBody.previousPosition[1] * (1 - ratio)) * pixelsPerMeter

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

  },
}

module.exports = gameScene
