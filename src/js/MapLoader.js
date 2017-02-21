var gameUtils = require('./gameUtils')
var gameVars = require('./gameVars')
var p2 = require('p2')

var MapLoader = function () {

}

MapLoader.prototype.loadMap = function (world, mapLayer, propLayer, ninjaBody, pixelsPerMeter) {

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
    imageName = gameUtils.getFileNameFromUrl(imageData.file)
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

      this.ninjaStartPosition = [bodyData.position.x, -bodyData.position.y]
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
          collisionGroup: gameVars.WALL,
          collisionMask: gameVars.PLAYER | gameVars.SENSOR,
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

}

module.exports = MapLoader
