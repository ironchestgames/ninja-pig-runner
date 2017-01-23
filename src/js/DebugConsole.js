var DebugVars = require('./DebugVars')
var Console = require('console.js')

module.exports = {
  init: function () {
    global.debugConsole = new Console({}, {
      caseSensitive: true,
    })

    global.debugConsole.register('help', function () {
      global.debugConsole.printHelp()
    }, {
      usage: 'help',
      desc: 'shows this help'
    })
    
    global.debugConsole.register('set', function (varName, value) {
      if (!DebugVars.exists(varName)) {
        var str = 'available debug vars'
        var defaults = DebugVars.getDefaults()
        for (var _varName in defaults) {
          if (defaults.hasOwnProperty(_varName)) {
            str += '\n' + _varName + ' = ' + DebugVars.get(_varName)
          }
        }
        return str
      }
      DebugVars.set(varName, JSON.parse(value))
      return varName + ' = ' + value
    }, {
      usage: 'set [var] [value]',
      desc: 'sets a global debug var (it will persist in local storage)'
    })
  }
}
