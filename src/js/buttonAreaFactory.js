
var buttonAreaFactory = function (config) {
	var touchStart = config.touchStart
	var touchEnd = config.touchEnd
	var width = config.width
	var height = config.height
	var x = config.x || 0
	var y = config.y || 0

	var sprite = new PIXI.Sprite(PIXI.Texture.EMPTY)
  sprite.renderable = false
  sprite.interactive = true
  sprite.width = width
  sprite.height = height
  sprite.position.x = x
  sprite.position.y = y

  if (touchStart) {
    sprite.on('touchstart', touchStart)
  }

  if (touchEnd) {
    sprite.on('touchend', touchEnd)
  }

  return sprite
}

module.exports = buttonAreaFactory
