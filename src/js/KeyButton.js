
var KeyButton = function (config) {
  this._onKeyDown = config.onKeyDown || function () {}
  this._onKeyUp = config.onKeyUp || function () {}
  this.key = config.key

  this.isDown = false

  this.onKeyDown = this.onKeyDown.bind(this)
  document.addEventListener('keydown', this.onKeyDown)

  this.onKeyUp = this.onKeyUp.bind(this)
  document.addEventListener('keyup', this.onKeyUp)

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
