var createError = require('errno').create


var ColoredCoinError = createError('ColoredCoinError')
var IncompatibilityError = createError('IncompatibilityError', ColoredCoinError)
var VerifyTypeError = createError('VerifyTypeError', ColoredCoinError)


module.exports = {
  // Base error
  ColoredCoinError: ColoredCoinError,

  // Verification errors
  VerifyTypeError: VerifyTypeError,
  ZeroArrayLengthError: createError('ZeroArrayLengthError', VerifyTypeError),

  // Abstract methods
  NotImplementedError: createError('NotImplementedError', ColoredCoinError),

  // DataStorage
  UniqueConstraintError: createError('UniqueConstraintError', ColoredCoinError),

  // Incompatibility errors (ComposeGenesisTx, ColorValue, etc ...)
  IncompatibilityError: IncompatibilityError,
  IncompatibilityColorDefinitionsError: createError('IncompatibilityColorDefinitionsError', IncompatibilityError),
  IncompatibilityColorValuesError: createError('IncompatibilityColorValuesError', IncompatibilityError),

  // Other
  ColorDefinitionAlreadyRegisteredError: createError('ColorDefinitionAlreadyRegisteredError', ColoredCoinError),
  ColorDefinitionBadDescriptionError: createError('ColorDefinitionBadDescriptionError', ColoredCoinError),
  ColorDefinitionBadColorIdError: createError('ColorDefinitionBadColorIdError', ColoredCoinError),
  ComposeGenesisTxError: createError('ComposeGenesisTxError', ColoredCoinError),
  EPOBCPaddingError: createError('EPOBCPaddingError', ColoredCoinError)
}
