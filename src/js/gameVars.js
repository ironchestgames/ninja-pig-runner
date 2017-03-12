
var gameVars = {}

// collision groups
gameVars.PLAYER = Math.pow(2, 0)
gameVars.WALL = Math.pow(2, 1)
gameVars.SENSOR = Math.pow(2, 2)
gameVars.CEILING = Math.pow(2, 3)
gameVars.COIN = Math.pow(2, 4)

// level themes
gameVars.themes = {
  sunsetCity: {
    staticsColor: 0x261d05,
  }
}

module.exports = gameVars
