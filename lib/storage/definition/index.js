module.exports.Interface = require('./interface')

var storages = {
  Memory: require('./memory'),
  SQLite: require('./sqlite'),
  WebSQL: require('./websql'),
  IndexedDB: require('./indexeddb'),
  LocalStorage: require('./localstorage')
}

Object.keys(storages).forEach(function (name) {
  module.exports[name] = storages[name]
})

module.exports.getAvailableStorages = function getAvailableStorages () {
  return storages.filter(function (cls) {
    return cls.isAvailable()
  })
}
