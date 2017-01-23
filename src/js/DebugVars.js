var localPreferences = require('local-preferences')

var defaults = {
  DEBUG_DRAW: false,
}

// populate global
for (var key in defaults) {
  if (defaults.hasOwnProperty(key)) {
    var value = defaults[key]
    var storedValue = localPreferences.get(key)
    if (storedValue !== null) {
      value = storedValue
    }
    global[key] = value
  }
}

module.exports = {
  getDefaults: function () {
    return defaults
  },
  exists: function (key) {
    return defaults.hasOwnProperty(key)
  },
  get: function (key) {
    var storedValue = localPreferences.get(key)
    if (storedValue === null) {
      return defaults[key]
    }
    return storedValue
  },
  set: function (key, value) {
    global[key] = value
    localPreferences.set(key, value)
  }
}
