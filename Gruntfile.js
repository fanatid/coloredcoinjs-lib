module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      'coloredcoinlib.js': 'src/index.js',
      options: {
        bundleOptions: {
          standalone: 'coloredcoinlib'
        }
      }
    },
    jshint: {
      options: {
        asi: true,
        camelcase: true,
        freeze: true,
        immed: true,
        indent: 2,
        latedef: true,
        maxcomplexity: 10,
        maxlen: 120,
        noarg: true,
        noempty: true,
        nonbsp: true,
        node: true,
        nonew: true,
        undef: true,
        unused: true,
        strict: false,
        trailing: true
      },
      files: ['src/*.js']
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          excludes: ['test/mocks.js', 'test/stubs.js'],
          mask: '*.js',
          reporter: 'spec'
        }
      },
      coveralls: {
        src: 'test',
        options: {
          coverage: true,
          excludes: ['test/mocks.js', 'test/stubs.js'],
          mask: '*.js',
          reporter: 'spec'
        }
      }
    },
    uglify: {
      'coloredcoinlib-min.js': 'coloredcoinlib.js'
    }
  })

  grunt.event.on('coverage', function (lcov, done) {
    require('coveralls').handleInput(lcov, function(error) {
      if (error && !(error instanceof Error))
        error = new Error(error)

      done(error)
    })
  })

  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-mocha-istanbul')

  grunt.registerTask('compile', ['browserify', 'uglify'])
  grunt.registerTask('coverage', ['mocha_istanbul:coverage'])
  grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
}
