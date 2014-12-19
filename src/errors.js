var createError = require('errno').create


/**
 * Error
 *  +-- ColoredCoinError
 *       +-- ColorDefinitionAlreadyRegisteredError
 *       +-- ColorDefinitionBadDescError
 *       +-- ColorDefinitionBadColorIdError
 *       +-- ComposeGenesisTxError
 *       +-- EPOBCPaddingError
 *       +-- IncompatibilityError
 *       |    +-- IncompatibilityColorDefinitionsError
 *       |    +-- IncompatibilityColorValuesError
 *       +-- NotImplementedError
 *       +-- UniqueConstraintError
 *       +-- VerifyTypeError
 *            +-- ZeroArrayLengthError
 */

/**
 * @class ColoredCoinError
 * @extends Error
 */
var ColoredCoinError = createError('ColoredCoinError')

/**
 * @class ColorDefinitionAlreadyRegisteredError
 * @extends ColoredCoinError
 */
var ColorDefinitionAlreadyRegisteredError = createError('ColorDefinitionAlreadyRegisteredError', ColoredCoinError)

/**
 * @class ColorDefinitionBadDescError
 * @extends ColoredCoinError
 */
var ColorDefinitionBadDescError = createError('ColorDefinitionBadDescError', ColoredCoinError)

/**
 * @class ColorDefinitionBadColorIdError
 * @extends ColoredCoinError
 */
var ColorDefinitionBadColorIdError = createError('ColorDefinitionBadColorIdError', ColoredCoinError)

/**
 * @class ComposeGenesisTxError
 * @extends ColoredCoinError
 */
var ComposeGenesisTxError = createError('ComposeGenesisTxError', ColoredCoinError)

/**
 * @class EPOBCPaddingError
 * @extends ColoredCoinError
 */
var EPOBCPaddingError = createError('EPOBCPaddingError', ColoredCoinError)

/**
 * @class IncompatibilityError
 * @extends ColoredCoinError
 */
var IncompatibilityError = createError('IncompatibilityError', ColoredCoinError)

/**
 * @class IncompatibilityColorDefinitionsError
 * @extends IncompatibilityError
 */
var IncompatibilityColorDefinitionsError = createError('IncompatibilityColorDefinitionsError', IncompatibilityError)

/**
 * @class IncompatibilityColorValuesError
 * @extends IncompatibilityError
 */
var IncompatibilityColorValuesError = createError('IncompatibilityColorValuesError', IncompatibilityError)

/**
 * @class NotImplementedError
 * @extends ColoredCoinError
 */
var NotImplementedError = createError('NotImplementedError', ColoredCoinError)

/**
 * @class UniqueConstraintError
 * @extends ColoredCoinError
 */
var UniqueConstraintError = createError('UniqueConstraintError', ColoredCoinError)

/**
 * @class VerifyTypeError
 * @extends ColoredCoinError
 */
var VerifyTypeError = createError('VerifyTypeError', ColoredCoinError)

/**
 * @class ZeroArrayLengthError
 * @extends VerifyTypeError
 */
var ZeroArrayLengthError = createError('ZeroArrayLengthError', VerifyTypeError)


module.exports = {
  // Base error
  ColoredCoinError: ColoredCoinError,

  // Verification errors
  VerifyTypeError: VerifyTypeError,
  ZeroArrayLengthError: ZeroArrayLengthError,

  // Abstract methods
  NotImplementedError: NotImplementedError,

  // DataStorage
  UniqueConstraintError: UniqueConstraintError,

  // Incompatibility errors (ComposeGenesisTx, ColorValue, etc ...)
  IncompatibilityError: IncompatibilityError,
  IncompatibilityColorDefinitionsError: IncompatibilityColorDefinitionsError,
  IncompatibilityColorValuesError: IncompatibilityColorValuesError,

  // Other
  ColorDefinitionAlreadyRegisteredError: ColorDefinitionAlreadyRegisteredError,
  ColorDefinitionBadDescError: ColorDefinitionBadDescError,
  ColorDefinitionBadColorIdError: ColorDefinitionBadColorIdError,
  ComposeGenesisTxError: ComposeGenesisTxError,
  EPOBCPaddingError: EPOBCPaddingError
}
