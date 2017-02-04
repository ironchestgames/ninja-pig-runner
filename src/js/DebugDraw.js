var PIXI = require('pixi.js')
var p2 = require('p2')

var fillColorStatic = 0x333333
var fillColorDynamic = 0x339933
var lineStyleStatic = 0xdddddd
var lineStyleDynamic = 0xdddddd
var lineStyleSensor = 0x993333
var lineStyleSensorActive = 0xff3333
var lineStyleBody = 0x9999ff

var bodyGraphics = {}
var shapeGraphics = {}

var tempVec = [0, 0]
var tempPositionVec = [0, 0]
var tempPreviousPositionVec = [0, 0]

var calcInterpolatedPosition = function (position, previousPosition, interpolationRatio) {
  tempVec[0] = position[0] * interpolationRatio + previousPosition[0] * (1 - interpolationRatio)
  tempVec[1] = position[1] * interpolationRatio + previousPosition[1] * (1 - interpolationRatio)
  return tempVec
}

var calcInterpolatedAngle = function (angle, previousAngle, interpolationRatio) {
  return angle * interpolationRatio + previousAngle * (1 - interpolationRatio)
}

var setShapeGraphicsColors = function (shape, graphics) {
  if (shape.sensor) {
    graphics.lineStyle(1, lineStyleSensor)
    // TODO: add color change if active
  } else if (shape.body.type === p2.Body.STATIC) {
    graphics.lineStyle(1, lineStyleStatic)
    graphics.beginFill(fillColorStatic)
  } else if (shape.body.type === p2.Body.DYNAMIC) {
    graphics.lineStyle(1, lineStyleDynamic)
    graphics.beginFill(fillColorDynamic)
  }
  // TODO: add kinematic bodies
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

    // create it if it doesn't exist
    if (!bodyGraphics[body.id]) {
      graphics = new PIXI.Graphics()
      graphics.lineStyle(1, lineStyleBody)
      graphics.drawCircle(
          0,
          0,
          0.09 * pixelsPerMeter)
      graphics.moveTo(0, 0)
      graphics.lineTo(0.09 * pixelsPerMeter, 0)

      graphics.x = body.position[0] * pixelsPerMeter
      graphics.y = body.position[1] * pixelsPerMeter
      graphics.rotation = body.angle

      bodyGraphics[body.id] = graphics

      pixiContainer.addChild(graphics)

    // move it if it already exist
    } else {
      graphics = bodyGraphics[body.id]

      tempVec = calcInterpolatedPosition(body.position, body.previousPosition, interpolationRatio)

      graphics.x = tempVec[0] * pixelsPerMeter
      graphics.y = tempVec[1] * pixelsPerMeter
      graphics.rotation = calcInterpolatedAngle(body.angle, body.previousAngle, interpolationRatio)

    }
  }
}

var shapeDraw = function (pixiContainer, world, pixelsPerMeter, interpolationRatio) {
  var bodies
  var body
  var graphics
  var i
  var j
  var shapes
  var shape
  var worldPosition

  // TODO: delete graphics for shapes not present anymore

  bodies = world.bodies

  for (i = 0; i < bodies.length; i++) {
    body = bodies[i]

    for (j = 0; j < body.shapes.length; j++) {
      shape = body.shapes[j]

      // create it if it doesn't exist
      if (!shapeGraphics[shape.id]) {

        graphics = new PIXI.Graphics()

        body.toWorldFrame(tempVec, shape.position)

        // box
        if (shape instanceof p2.Box) {
          setShapeGraphicsColors(shape, graphics)

          graphics.drawRect(
              (-shape.width / 2) * pixelsPerMeter,
              (-shape.height / 2) * pixelsPerMeter,
              shape.width * pixelsPerMeter,
              shape.height * pixelsPerMeter)

          graphics.x = tempVec[0] * pixelsPerMeter
          graphics.y = tempVec[1] * pixelsPerMeter
          graphics.rotation = shape.angle + body.angle

          shapeGraphics[shape.id] = graphics

          pixiContainer.addChild(graphics)
        }

        // circle
        if (shape instanceof p2.Circle) {
          setShapeGraphicsColors(shape, graphics)

          graphics.drawCircle(
              0,
              0,
              shape.radius * pixelsPerMeter)
          graphics.moveTo(0, 0)
          graphics.lineTo(shape.radius * pixelsPerMeter, 0)

          graphics.x = tempVec[0] * pixelsPerMeter
          graphics.y = tempVec[1] * pixelsPerMeter
          graphics.rotation = shape.angle + body.angle

          shapeGraphics[shape.id] = graphics

          pixiContainer.addChild(graphics)
        }

      // move it if it already exists
      } else {

        graphics = shapeGraphics[shape.id]

        body.toWorldFrame(tempPositionVec, shape.position)
        body.toWorldFrame(tempPreviousPositionVec, shape.position) // TODO: get previous position

        tempVec = calcInterpolatedPosition(
            tempPositionVec,
            tempPreviousPositionVec,
            interpolationRatio)

        graphics.x = tempVec[0] * pixelsPerMeter
        graphics.y = tempVec[1] * pixelsPerMeter
        graphics.rotation = shape.angle + body.angle // TODO: interpolate angle

      }
    }
  }
}

var draw = function (pixiContainer, world, pixelsPerMeter, interpolationRatio) {
  // TODO: if interpolationRatio is undefined/null set to 1
  shapeDraw(pixiContainer, world, pixelsPerMeter, interpolationRatio)
  bodyDraw(pixiContainer, world, pixelsPerMeter, interpolationRatio)
}

module.exports = {
  draw: draw,
}
