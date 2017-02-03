var PIXI = require('pixi.js')

var bodyGraphics = {}

var bodyDraw = function (pixiContainer, world, pixelsPerMeter, interpolationRatio) {
  var bodies
  var body
  var graphics
  var i
  var worldPosition
  var x
  var y

  // TODO: delete graphics for bodies not present anymore

  bodies = world.bodies

  for (i = 0; i < bodies.length; i++) {
    body = bodies[i]

    if (!bodyGraphics[body.id]) {
      graphics = new PIXI.Graphics()
      graphics.lineStyle(1, 0x9999ff)
      graphics.drawCircle(
          0,
          0,
          0.08 * pixelsPerMeter)

      graphics.x = body.position[0] * pixelsPerMeter
      graphics.y = body.position[1] * pixelsPerMeter

      bodyGraphics[body.id] = graphics

      pixiContainer.addChild(graphics)

    } else {
      graphics = bodyGraphics[body.id]

      // currentPosition * ratio + previousPosition * (1 - ratio)
      x = body.position[0] * interpolationRatio + body.previousPosition[0] * (1 - interpolationRatio)
      y = body.position[1] * interpolationRatio + body.previousPosition[1] * (1 - interpolationRatio)

      graphics.x = x * pixelsPerMeter
      graphics.y = y * pixelsPerMeter

    }
  }
}

var draw = function (pixiContainer, world, pixelsPerMeter, interpolationRatio) {
  // TODO: if interpolationRatio is undefined/null set to 1
  bodyDraw(pixiContainer, world, pixelsPerMeter, interpolationRatio)
}

module.exports = {
  draw: draw,
}
