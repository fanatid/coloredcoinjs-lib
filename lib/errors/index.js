var errorSystem = require('error-system')

/**
 * Error
 *  +-- ColoredCoin
 *       +-- ColorDefinition
 *       |    +-- AlreadyRegistered
 *       |    +-- EPOBC
 *       |    |    +-- PaddingError
 *       |    +-- IncompatibilityError
 *       |    +-- IncorrectDesc
 *       |    +-- IncorrectColorId
 *       +-- ColorValue
 *       |    +-- IncompatibilityError
 *       +-- ComposeGenesisTxError
 *       +-- NotImplemented
 */

var spec = {
  name: 'ColoredCoin',
  message: 'Internal error',
  errors: [{
    name: 'ColorDefinition',
    message: '{0}',
    errors: [{
      name: 'AlreadyRegistered',
      message: '{0}: {1}'
    }, {
      name: 'EPOBC',
      message: 'Internal error',
      errors: [{
        name: 'PaddingError',
        message: 'Required {0}, otherwise max 9223372036854775808'
      }]
    }, {
      name: 'IncompatibilityError',
      message: '{0}'
    }, {
      name: 'IncorrectDesc',
      message: '{0} fail with color description: {1}'
    }, {
      name: 'IncorrectColorId',
      message: '{0} fail with color id: {1}'
    }]
  }, {
    name: 'ColorValue',
    message: '{0}',
    errors: [{
      name: 'IncompatibilityError',
      message: '{0}'
    }]
  }, {
    name: 'ComposeGenesisTxError',
    message: '{0}'
  }, {
    name: 'NotImplemented',
    message: '{0}'
  }]
}

errorSystem.extend(Error, spec)
module.exports = Error.ColoredCoin
