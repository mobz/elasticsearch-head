module.exports = function(grunt) {

	var fileSets = require("./grunt_fileSets.js");

	// Project configuration.
	grunt.initConfig({
		clean: {
			dist: {
				src: ['dist']
			}
		},
		concat: {
			vendorjs: {
				src: [
					'src/vendor/jquery/jquery.js',
					'src/vendor/nohtml/jquery-nohtml.js',
					'src/vendor/graphael/g.raphael.standalone.js',
					'src/vendor/dateRangeParser/date-range-parser.js'
				],
				dest: 'dist/vendor.js'
			},
			appjs: {
				src: fileSets.srcJs,
				dest: 'dist/app.js'
			},
			appcss: {
				src: fileSets.srcCss,
				dest: 'dist/app.css'
			}
		},

		copy: {
			base: {
				expand: true,
				cwd: 'src/app/base/',
				src: '**',
				dest: 'dist/base/'
			},
			i18n: {
				src: 'src/vendor/i18n/i18n.js',
				dest: 'dist/i18n.js'
			},
			lang: {
				expand: true,
				cwd: 'src/app/lang/',
				src: '**',
				dest: 'dist/lang/'
			}
		},

		watch: {
			scripts: {
				files: ['src/**/*' ],
				tasks: ['default'],
				options: {
					spawn: false
				}
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

	// Default task(s).
	grunt.registerTask('default', ['clean', 'concat', 'copy']);
	grunt.registerTask('server', ['connect:server']);

};
