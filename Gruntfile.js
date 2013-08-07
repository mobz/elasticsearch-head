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
					'lib/nohtml/jquery.acx-nohtml.js',
					'lib/graphael/g.raphael.standalone.js',
					'lib/dateRangeParser/date-range-parser.js'
				],
				dest: 'dist/core.js'
			},
			uijs: {
				src: [
					'src/app/ux/observable.js',
					'src/app/ux/dragdrop.js',
					'src/app/ux/fieldCollection.js',

					'src/app/data/dataSourceInterface.js',
					'src/app/data/metaData.js',
					'src/app/data/metaDataFactory.js',
					'src/app/data/query.js',

					'src/app/ui/abstractWidget/abstractWidget.js',
					'src/app/ui/abstractField/abstractField.js',
					'src/app/ui/textField/textField.js',
					'src/app/ui/button/button.js',
					'src/app/ui/menuButton/menuButton.js',
					'src/app/ui/splitButton/splitButton.js',
					'src/app/ui/toolbar/toolbar.js',
					'src/app/ui/abstractPanel/abstractPanel.js',
					'src/app/ui/draggablePanel/draggablePanel.js',
					'src/app/ui/infoPanel/infoPanel.js',
					'src/app/ui/dialogPanel/dialogPanel.js',
					'src/app/ui/menuPanel/menuPanel.js',
					'src/app/ui/table/table.js',
					'src/app/ui/panelForm/panelForm.js',

					'lib/es/core.js',
					'lib/es/widgets.js',

					'src/app/services/storage.js',
					'src/app/services/cluster.js',

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
					'src/app/ui/toolbar/toolbar.css',
					'src/app/ui/abstractPanel/abstractPanel.css',
					'src/app/ui/menuPanel/menuPanel.css',
					'src/app/ui/table/table.css',
					'src/app/ui/panelForm/panelForm.css',
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