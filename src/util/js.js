export function getArrayOfNull (n) {
  let result = new Array(n)
  for (let i = 0; i < n; ++i) {
    result[i] = null
  }
  return result
}

export function promisify (fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...result) => {
        if (err) {
          return reject(err)
        }

        resolve(...result)
      })

      fn.apply(this, args)
    })
  }
}
