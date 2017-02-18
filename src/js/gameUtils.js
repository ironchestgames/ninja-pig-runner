
var gameUtils = {}

gameUtils.calcInterpolatedValue = function (value, previousValue, interpolationRatio) {
  return value * interpolationRatio + previousValue * (1 - interpolationRatio)
}

module.exports = gameUtils
