var Matter = require('matter-js')
var DebugRenderer = require('./DebugRenderer')
var paused = false

var isDown = false

var graphics

var onDown = function () {
  isDown = true
}

var onUp = function () {
  isDown = false
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


var setupPhysics = function() {
  var group = Body.nextGroup(true);
   
  var ropeA = Composites.stack(400, 0, 5, 2, 10, 10, function(x, y) {
      return Bodies.rectangle(x, y, 50, 20, { collisionFilter: { group: group } });
  });
  
  Composites.chain(ropeA, 0.5, 0, -0.5, 0, { stiffness: 0.8, length: 2 });
  Composite.add(ropeA, Constraint.create({ 
      bodyB: ropeA.bodies[0],
      pointB: { x: 0, y: 0 },
      pointA: { x: 400, y: 0 },
      stiffness: 0.5
  }));
  
  World.add(world, ropeA);

};


var gameScene = {
  name: 'game',
  create: function () {

    this.stage = new PIXI.Container()

    graphics = new PIXI.Graphics()

    // input area
    // var inputArea = new PIXI.Graphics()

    // inputArea.beginFill(0x00ff00, 0)
    // inputArea.drawRect(0, 0, 4, 4)
    // inputArea.endFill()

    // inputArea.interactive = true
    // inputArea.on('mousedown', onDown)
    // inputArea.on('touchstart', onDown)
    // inputArea.on('mouseup', onUp)
    // inputArea.on('touchend', onUp)

    // inputArea.scale.x = window.innerWidth / 4
    // inputArea.scale.y = window.innerHeight / 4

    // // chainSprite = new PIXI.Sprite(PIXI.loader.resources['chain'].texture)

    // this.stage.addChild(inputArea)
    this.stage.addChild(graphics)

    setupPhysics()

    render = DebugRenderer.create({
      canvas: this.renderView,
      engine: engine,
      options: {
        width: this.renderView.width,
        height: this.renderView.height,
      },
    })

    window.world = world

  },
  destroy: function () {
    this.stage = null
  },
  update: function (step) {

    if (paused) { return }

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
