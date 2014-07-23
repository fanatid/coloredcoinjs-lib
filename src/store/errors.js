var inherits = require('util').inherits


/**
 * @class UnknownTypeDBError
 *
 * Inherits Error
 */
function UnknownTypeDBError() {
  Error.apply(this, Array.prototype.slice.call(arguments))
}

inherits(UnknownTypeDBError, Error)


/**
 * @class UniqueConstraintError
 *
 * Inherits Error
 */
function UniqueConstraintError() {
  Error.apply(this, Array.prototype.slice.call(arguments))
}

inherits(UniqueConstraintError, Error)


module.exports = {
  UnknownTypeDBError: UnknownTypeDBError,
  UniqueConstraintError: UniqueConstraintError
}
