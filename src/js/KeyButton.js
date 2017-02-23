
var KeyButton = function (config) {
  this._onKeyDown = config.onKeyDown
  this._onKeyUp = config.onKeyUp
  this.key = config.key

  this.isDown = false

  document.addEventListener('keydown', this.onKeyDown.bind(this))
  document.addEventListener('keyup', this.onKeyUp.bind(this))
}

KeyButton.prototype.onKeyDown = function (event) {
  if (event.key === this.key && this.isDown === false) {
    this.isDown = true
    this._onKeyDown(event)
  }
}

KeyButton.prototype.onKeyUp = function (event) {
  if (event.key === this.key && this.isDown === true) {
    this.isDown = false
    this._onKeyUp(event)
  }
}

KeyButton.prototype.destroy = function () {
  document.removeEventListener('keydown', this.onKeyDown)
  document.removeEventListener('keyup', this.onKeyUp)
}

module.exports = KeyButton
