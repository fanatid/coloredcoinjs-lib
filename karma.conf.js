module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'detectBrowsers', 'mocha'],
    files: [
      'node_modules/babel-core/browser-polyfill.js',
      'test/*.js',
      'test/definitions/*.js',
      'test/integration/*.js',
      'test/storage/data/*.js',
      'test/storage/definitions/*.js',
      'test/tx/*.js'
    ],
    preprocessors: {
      'test/*.js': ['browserify'],
      'test/definitions/*.js': ['browserify'],
      'test/integration/*.js': ['browserify'],
      'test/storage/data/*.js': ['browserify'],
      'test/storage/definitions/*.js': ['browserify'],
      'test/tx/*.js': ['browserify']
    },
    singleRun: true,
    plugins: [
      'karma-browserify',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-detect-browsers',
      'karma-mocha'
    ],
    browserify: {
      debug: true,
      transform: [
        ['babelify']
      ]
    },
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false,
      postDetection: function (availableBrowser) {
        if (process.env.TRAVIS) {
          return ['Firefox']
        }

        var browsers = ['Chrome', 'Firefox']
        return browsers.filter(function (browser) {
          return availableBrowser.indexOf(browser) !== -1
        })
      }
    }
  })
}
