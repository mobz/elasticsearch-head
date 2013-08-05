module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		concat: {
			options: {
//        separator: ';'
			},
			setup: {
				src: [
					'src/vendor/jquery/jquery.js',

					'src/app/boot.js',

					'lib/jsacx/src/jsacx.js',
					'lib/nohtml/jquery.acx-nohtml.js'
				],
				dest: 'dist/core.js'
			},
			uijs: {
				src: [
					'src/app/ux/observable.js',
					'src/app/ui/abstractWidget/abstractWidget.js',
					'src/app/ui/abstractField/abstractField.js',
					'lib/jsacx/src/jsacx-widgets.js',
					'lib/jsacx/src/jsacx-fields.js',

					'src/app/data/dataSourceInterface.js',

					'lib/es/core.js',
					'lib/es/widgets.js',
					'lib/graphael/g.raphael.standalone.js',
					'lib/dateRangeParser/date-range-parser.js',

					'src/app/services/cluster.js',

					'src/app/ui/button/button.js',
					'src/app/ui/menuButton/menuButton.js',
					'src/app/ui/splitButton/splitButton.js',

					'src/app/ui/connect/connect.js',
					'src/app/ui/header/header.js',

					'src/app/app.js'
				],
				dest: 'dist/ui.js'
			},
			uicss: {
				src: [
					'src/app/ui/button/button.css',
					'src/app/ui/menuButton/menuButton.css',
					'src/app/ui/splitButton/splitButton.css',

					'src/app/ui/header/header.css'
				],
				dest: 'dist/ui.css'
			}
		},

		watch: {
			scripts: {
				files: ['lib/**/*.js','src/**/*.js', 'src/**/*.css'],
				tasks: ['concat'],
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

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');

	// Default task(s).
	grunt.registerTask('default', ['concat']);
	grunt.registerTask('server', ['connect:server']);

};