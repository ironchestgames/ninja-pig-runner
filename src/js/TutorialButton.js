
var TutorialButton = function (config) {

  this.stateSprites = config.stateSprites // [{ state: 'running', sprite: PIXI.Sprite }, ...]
  this.isDown = false

  this.nextStates = []

}

TutorialButton.prototype.changeState = function (newState) {
  var i
  var nextState
  var stateSprite

  if (newState !== this.nextStates[0]) {
    this.nextStates.push(newState)
  }

  if (!this.isDown) {
    while (this.nextStates.length) {
      nextState = this.nextStates.shift()

      for (i = 0; i < this.stateSprites.length; i++) {
        stateSprite = this.stateSprites[i]
        if (stateSprite.state === nextState) {
          stateSprite.sprite.visible = true
        } else {
          stateSprite.sprite.visible = false
        }
      }
    }
  }
}

TutorialButton.prototype.onDown = function () {
  var stateSpriteScale

  this.isDown = true

  for (i = 0; i < this.stateSprites.length; i++) {
    stateSpriteScale = this.stateSprites[i].sprite.scale
    stateSpriteScale.x = 2
    stateSpriteScale.y = 2
  }
}

TutorialButton.prototype.onUp = function () {
  var stateSpriteScale

  this.isDown = false

  for (i = 0; i < this.stateSprites.length; i++) {
    stateSpriteScale = this.stateSprites[i].sprite.scale
    stateSpriteScale.x = 1
    stateSpriteScale.y = 1
  }
}

module.exports = TutorialButton
