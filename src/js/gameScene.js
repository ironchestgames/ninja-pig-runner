var Matter = require('matter-js')
var DebugRenderer = require('./DebugRenderer')

var DEBUG_DRAW = !false

var isDown = false

var hookPoint

var onDown = function (event) {
  if (isDown === false) {
    isDown = true
    hookPoint = event.data.global
    setupHook()
  }
}

var onUp = function () {
  if (isDown === true) {
    isDown = false
    removeHook()
  }
}

var World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint;

var engine = Matter.Engine.create(),
  world = engine.world,
  render;

var ninjaBody, hookConstraint

var setupNinja = function() {
   
  ninjaBody = Bodies.rectangle(400, 000, 50, 50, {
    mass: 8,
    frictionAir: 0,
  })

  World.add(world, ninjaBody)

}

var setupHook = function () {
  hookConstraint = Constraint.create({
    bodyB: ninjaBody,
    pointB: { x: 0, y: 0 },
    pointA: hookPoint,
    stiffness: 1,
  })

  World.add(world, hookConstraint)
}

var removeHook = function () {
  World.remove(world, hookConstraint)
}


var gameScene = {
  name: 'game',
  create: function () {

    this.stage = new PIXI.Container()

    // input area
    var inputArea = new PIXI.Graphics()

    inputArea.beginFill(0x00ff00, 0)
    inputArea.drawRect(0, 0, 4, 4)
    inputArea.endFill()

    inputArea.interactive = true
    inputArea.on('mousedown', onDown)
    inputArea.on('touchstart', onDown)
    inputArea.on('mouseup', onUp)
    inputArea.on('touchend', onUp)

    inputArea.scale.x = window.innerWidth / 4
    inputArea.scale.y = window.innerHeight / 4

    this.stage.addChild(inputArea)

    setupNinja()

    if (DEBUG_DRAW) {
      render = DebugRenderer.create({
        canvas: this.renderView,
        engine: engine,
        options: {
          width: this.renderView.width,
          height: this.renderView.height,
        },
      })
    }

  },
  destroy: function () {
    this.stage = null
  },
  update: function (step) {

    Matter.Engine.update(engine, step)

    // update objects
    // leave previous/next positions accessible
    // velocities are in units(pixels)/ms

  },
  draw: function (renderer, ratio) {

    // interpolate position between current and previous/next position
    // (ratio is how far in the frame we've gone represented as a percentage, 0 - 1)
    // currentPosition * ratio + previousPosition * (1 - ratio)

    if (DEBUG_DRAW) {
      var context = this.renderView.getContext('2d')
      context.save()
    }

    renderer.render(this.stage)

    if (DEBUG_DRAW) {
      context.restore()
      DebugRenderer.world(render)
    }

  },
}

module.exports = gameScene
