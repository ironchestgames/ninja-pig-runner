var PIXI = require('pixi.js')

var bodyGraphics = {}

var tempVec = [0, 0]

var calcInterpolatedPosition = function (position, previousPosition, interpolationRatio) {
  tempVec[0] = position[0] * interpolationRatio + previousPosition[0] * (1 - interpolationRatio)
  tempVec[1] = position[1] * interpolationRatio + previousPosition[1] * (1 - interpolationRatio)
  return tempVec
}

var bodyDraw = function (pixiContainer, world, pixelsPerMeter, interpolationRatio) {
  var bodies
  var body
  var graphics
  var i
  var worldPosition

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

      tempVec = calcInterpolatedPosition(body.position, body.previousPosition, interpolationRatio)

      graphics.x = tempVec[0] * pixelsPerMeter
      graphics.y = tempVec[1] * pixelsPerMeter

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
