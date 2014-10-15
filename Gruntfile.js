module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      production: {
        src: ['src/index.js'],
        dest: 'coloredcoinlib.js',
        options: {
          browserifyOptions: {
            standalone: 'coloredcoinlib'
          }
        }
      },
      test: {
        src: ['test/*.js'],
        dest: 'coloredcoinlib.test.js'
      }
    },
    clean: {
      builds: {
        src: ['coloredcoinlib.js', 'coloredcoinlib.min.js', 'coloredcoinlib.test.js']
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
      files: ['src']
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          excludes: ['helpers.js', 'mocks.js', 'stubs.js'],
          mask: '*.js',
          reporter: 'spec',
          timeout: 10000
        }
      },
      coveralls: {
        src: 'test',
        options: {
          coverage: true,
          excludes: ['helpers.js', 'mocks.js', 'stubs.js'],
          mask: '*.js',
          reporter: 'spec',
          timeout: 10000
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          timeout: 10000
        },
        src: ['test/*.js']
      }
    },
    uglify: {
      production: {
        files: {
          'coloredcoinlib.min.js': 'coloredcoinlib.js'
        }
      }
    },
    watch: {
      configFiles: {
        files: ['Gruntfile.js'],
        options: {
          reload: true
        }
      },
      src: {
        files: ['src/**.js', 'test/*.js', 'test/fixtures/*.json'],
        tasks: ['jshint', 'coverage']
      }
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
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-mocha-istanbul')
  grunt.loadNpmTasks('grunt-mocha-test')

  grunt.registerTask('compile', ['browserify:production', 'uglify:production'])
  grunt.registerTask('compile_test', ['browserify:test'])
  grunt.registerTask('coverage', ['mocha_istanbul:coverage'])
  grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
  grunt.registerTask('test', ['mochaTest'])
}
