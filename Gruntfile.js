module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      production: {
        src: ['src_production/index.js'],
        dest: 'coloredcoinlib.js',
        options: {
          bundleOptions: {
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
        src: ['coloredcoinlib.js', 'coloredcoinlib.test.js', 'coloredcoinlib-min.js']
      },
      production: {
        src: ['src_production']
      }
    },
    copy: {
      production: {
        expand: true,
        cwd: 'src',
        src: '**',
        dest: 'src_production'
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
    strip_code: {
      production: {
        options: {
          start_comment: 'test-code',
          end_comment: 'end-test-code',
        },
        src: 'src_production/*.js'
      }
    },
    uglify: {
      production: {
        files: {
          'coloredcoinlib-min.js': 'coloredcoinlib.js'
        }
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
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-mocha-istanbul')
  grunt.loadNpmTasks('grunt-strip-code')

  grunt.registerTask('compile', [
    'copy:production',
    'strip_code:production',
    'browserify:production',
    'uglify:production',
    'clean:production'
  ])
  grunt.registerTask('compile_test', ['browserify:test'])
  grunt.registerTask('coverage', ['mocha_istanbul:coverage'])
  grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
}
