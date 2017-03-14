var gameUtils = require('./gameUtils')
var gameVars = require('./gameVars')
var p2 = require('p2')

var MapLoader = function () {

}

MapLoader.prototype.loadMap = function (config) {

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
  var k
  var levelName
  var mapLayer
  var ninjaBody
  var ninjaRadius
  var pixelsPerMeter
  var propLayer
  var shape
  var sprite
  var spriteX
  var spriteY
  var staticsColor
  var texture
  var widthHeightRatio
  var world
  var worldPosition

  world = config.world
  mapLayer = config.mapLayer
  propLayer = config.propLayer
  ninjaBody = config.ninjaBody
  ninjaRadius = config.ninjaRadius
  pixelsPerMeter = config.pixelsPerMeter
  staticsColor = config.theme.staticsColor
  levelName = config.name

  // props first (rendered below the level as of now)
  imagesData = PIXI.loader.resources[levelName].data.image || []

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

  bodiesData = PIXI.loader.resources[levelName].data.body

  for (i = 0; i < bodiesData.length; i++) {

    bodyData = bodiesData[i]

    if (bodyData.name === 'ninja') {

      this.ninjaStartPosition = [bodyData.position.x, -bodyData.position.y]
      ninjaBody.position = [bodyData.position.x, -bodyData.position.y]

    } else if (bodyData.name === 'wall' ||
        bodyData.name === 'goal') {

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

        var vertices = []

        var graphics = new PIXI.Graphics()
        graphics.beginFill(staticsColor)

        for (k = fixtureData.polygon.vertices.x.length - 1; k >= 0; k--) {

          vertices.push([
            fixtureData.polygon.vertices.x[k],
            -fixtureData.polygon.vertices.y[k],
            ])

        }

        for (k = 0; k < vertices.length; k++) {
          if (k === 0) {
            graphics.moveTo(
                vertices[k][0] * pixelsPerMeter,
                vertices[k][1] * pixelsPerMeter)
          } else {
            graphics.lineTo(
                vertices[k][0] * pixelsPerMeter,
                vertices[k][1] * pixelsPerMeter)
          }
        }

        graphics.endFill()

        var convex = new p2.Convex({
          vertices: vertices,
          collisionGroup: gameVars.WALL,
          collisionMask: gameVars.PLAYER | gameVars.SENSOR | gameVars.WALL,
        })

        body.addShape(convex)

        var container = new PIXI.Container()
        container.addChild(graphics)
        container.cacheAsBitmap = true
        container.width += 1
        container.height += 1

        container.x = body.position[0] * pixelsPerMeter
        container.y = body.position[1] * pixelsPerMeter
        container.rotation = body.angle

        mapLayer.addChild(container)

        if (body.type === p2.Body.DYNAMIC) {
          // add it to the collection 
          config.dynamicSprites[body.id] = container // NOTE: I know this is backwards
        }

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

    } else if (bodyData.name === 'coin' || bodyData.name === 'star') {

      body = new p2.Body({
        position: [bodyData.position.x, -bodyData.position.y],
        angle: -bodyData.angle,
        mass: 0,
      })
      body.type = p2.Body.STATIC

      body.name = bodyData.name // NOTE: not in p2 spec, but a nice-to-have for debugging purposes

      shape = new p2.Circle({
        radius: ninjaRadius * 0.7,
        collisionGroup: gameVars.COIN,
        collisionMask: gameVars.PLAYER,
        collisionResponse: false,
      })

      body.addShape(shape)

      world.addBody(body)

      // create the sprite
      var sprite = new PIXI.Sprite(PIXI.loader.resources[bodyData.name].texture)
      sprite.anchor.x = 0.5
      sprite.anchor.y = 0.5
      sprite.x = bodyData.position.x * pixelsPerMeter
      sprite.y = -bodyData.position.y * pixelsPerMeter
      sprite.width = ninjaRadius * 2 * pixelsPerMeter
      sprite.height = ninjaRadius * 2 * pixelsPerMeter
      mapLayer.addChild(sprite)

      config.dynamicSprites[body.id] = sprite

    }

  }

}

module.exports = MapLoader
