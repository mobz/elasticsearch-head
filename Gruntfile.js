module.exports = function(grunt) {

	var fileSets = require("./grunt_fileSets.js");

	// Project configuration.
	grunt.initConfig({
		clean: {
			_site: {
				src: ['_site']
			}
		},
		concat: {
			vendorjs: {
				src: fileSets.vendorJs,
				dest: '_site/vendor.js'
			},
			vendorcss: {
				src: fileSets.vendorCss,
				dest: '_site/vendor.css'
			},
			appjs: {
				src: fileSets.srcJs,
				dest: '_site/app.js'
			},
			appcss: {
				src: fileSets.srcCss,
				dest: '_site/app.css'
			}
		},

		copy: {
			base: {
				expand: true,
				cwd: 'src/app/base/',
				src: [ '*.gif', '*.png', '*.css' ],
				dest: '_site/base/'
			},
			iconFonts: {
				expand: true,
				cwd: 'src/vendor/font-awesome/fonts/',
				src: '**',
				dest: '_site/fonts'
			},
			i18n: {
				src: 'src/vendor/i18n/i18n.js',
				dest: '_site/i18n.js'
			},
			lang: {
				expand: true,
				cwd: 'src/app/lang/',
				src: '**',
				dest: '_site/lang/'
			}
		},

		jasmine: {
			task: {
				src: [ fileSets.vendorJs, 'src/vendor/i18n/i18n.js', 'src/app/lang/en_strings.js', fileSets.srcJs ],
				options: {
					specs: 'src/app/**/*Spec.js',
					helpers: 'test/spec/*Helper.js',
					display: "short",
					summary: true
				}
			}
		},

		watch: {
			"scripts": {
				files: ['src/**/*', 'test/spec/*' ],
				tasks: ['default'],
				options: {
					spawn: false
				}
			},
			"grunt": {
				files: [ 'Gruntfile.js' ]
			}
		},

		connect: {
			server: {
				options: {
					port: 9100,
					base: '.',
					keepalive: true
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	// Default task(s).
	grunt.registerTask('default', ['clean', 'concat', 'copy', 'jasmine']);
	grunt.registerTask('server', ['connect:server']);
	grunt.registerTask('dev', [ 'default', 'watch' ]);


};
