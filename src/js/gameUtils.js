
var gameUtils = {}

gameUtils.calcInterpolatedValue = function (value, previousValue, interpolationRatio) {
  return value * interpolationRatio + previousValue * (1 - interpolationRatio)
}

gameUtils.getFileNameFromUrl = function (str) {
  return str.split('/').pop().split('.').shift()
}

gameUtils.getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = gameUtils
