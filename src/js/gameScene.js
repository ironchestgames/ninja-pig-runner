var Matter = require('matter-js')
var DebugRenderer = require('./DebugRenderer')
var paused = false

var isDown = false

var graphics

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
    stiffness: 0.1,
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

    graphics = new PIXI.Graphics()

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
    this.stage.addChild(graphics)

    setupNinja()

    render = DebugRenderer.create({
      canvas: this.renderView,
      engine: engine,
      options: {
        width: this.renderView.width,
        height: this.renderView.height,
      },
      background: '#f00',
    })

    window.world = world

    // chainSprite = new PIXI.Sprite(PIXI.loader.resources['chain'].texture)

  },
  destroy: function () {
    this.stage = null
  },
  update: function (step) {

    if (paused) {
      return
    }

    Matter.Engine.update(engine, step)

    // shipPosition.prevX = shipPosition.x
    // shipPosition.prevY = shipPosition.y
    // shipPosition.x += shipVelocity.x * step
    // shipPosition.y += shipVelocity.y * step

  },
  draw: function (renderer, ratio) {
    // console.log(ratio)
    // chainSprite.x = (shipPosition.x * ratio) + (shipPosition.prevX * (1 - ratio))
    // chainSprite.y = (shipPosition.y * ratio) + (shipPosition.prevY * (1 - ratio))

    renderer.render(this.stage)

    DebugRenderer.world(render)

  },
}

module.exports = gameScene
