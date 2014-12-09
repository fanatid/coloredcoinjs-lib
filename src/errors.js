var createError = require('errno').create


module.exports = {
  NotImplementedError: createError('NotImplementedError'),
  UniqueConstraint: createError('UniqueConstraint')
}
