
var LevelManager = function () {
  this.levelProgression = []
  this.currentLevelIndex = 0
}

LevelManager.prototype.currentLevelDone = function () {
  this.levelProgression[this.currentLevelIndex].isDone = true
}

LevelManager.prototype.setCurrentLevel = function (newCurrentLevel) {
  this.currentLevelIndex = newCurrentLevel

  // cap it
  if (this.currentLevelIndex > this.levelProgression.length - 1) {
    this.currentLevelIndex = this.levelProgression.length - 1
  } else if (this.currentLevelIndex < 0) {
    this.currentLevelIndex = 0
  }
}

LevelManager.prototype.incCurrentLevel = function () {
  this.setCurrentLevel(this.currentLevelIndex + 1)
}

LevelManager.prototype.getCurrentLevel = function () {
  return this.levelProgression[this.currentLevelIndex]
}

LevelManager.prototype.addLevel = function (config) {
  var level = {}
  level.name = config.name
  level.theme = config.theme
  level.isDone = config.isDone || false
  this.levelProgression.push(level)

  return this
}

module.exports = LevelManager
