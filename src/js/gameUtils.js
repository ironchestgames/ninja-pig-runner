
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

gameUtils.getAngleBetweenPoints = function (x1, y1, x2, y2) {
	return Math.atan2(y2 - y1, x2 - x1)
}

module.exports = gameUtils
