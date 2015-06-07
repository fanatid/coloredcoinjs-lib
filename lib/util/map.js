module.exports = (function () {
  try {
    return Map
  } catch (err) {
    return require('core-js/library/fn/map')
  }
})()
