
var gameUtils = {}

gameUtils.calcInterpolatedValue = function (value, previousValue, interpolationRatio) {
  return value * interpolationRatio + previousValue * (1 - interpolationRatio)
}

gameUtils.getFileNameFromUrl = function (str) {
  return str.split('/').pop().split('.').shift()
}

module.exports = gameUtils
