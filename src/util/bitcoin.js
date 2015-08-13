/**
 * @param {number} i
 * @return {number}
 */
export function varIntSize (i) {
  if (i < 253) {
    return 1
  }

  if (i < 0x10000) {
    return 3
  }

  if (i < 0x100000000) {
    return 5
  }

  return 9
}
