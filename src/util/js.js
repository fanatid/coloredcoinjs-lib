export function getArrayOfNull (n) {
  let arr = new Array(n)
  for (let i = 0; i < n; ++i) {
    arr[i] = null
  }
  return arr
}
