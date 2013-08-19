module.exports = function(grunt) {

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
				src: [
					'src/app/core/boot.js',

					'src/app/ux/class.js',
					'src/app/ux/templates.js',
					'src/app/ux/observable.js',
					'src/app/ux/dragdrop.js',
					'src/app/ux/fieldCollection.js',

					'src/app/data/dataSourceInterface.js',
					'src/app/data/resultDataSourceInterface.js',
					'src/app/data/metaData.js',
					'src/app/data/metaDataFactory.js',
					'src/app/data/query.js',
					'src/app/data/queryDataSourceInterface.js',
					'src/app/data/boolQuery.js',

					'src/app/services/storage.js',
					'src/app/services/cluster.js',

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
					'src/app/ui/jsonPretty/jsonPretty.js',
					'src/app/ui/panelForm/panelForm.js',
					'src/app/ui/helpPanel/helpPanel.js',
					'src/app/ui/jsonPanel/jsonPanel.js',
					'src/app/ui/sidebarSection/sidebarSection.js',
					'src/app/ui/resultTable/resultTable.js',
					'src/app/ui/queryFilter/queryFilter.js',
					'src/app/ui/page/page.js',
					'src/app/ui/browser/browser.js',
					'src/app/ui/anyRequest/anyRequest.js',
					'src/app/ui/clusterOverview/clusterOverview.js',
					'src/app/ui/dateHistogram/dateHistogram.js',
					'src/app/ui/abstractQuery/abstractQuery.js',
					'src/app/ui/clusterConnect/clusterConnect.js',
					'src/app/ui/structuredQuery/structuredQuery.js',
					'src/app/ui/filterBrowser/filterBrowser.js',
					'src/app/ui/indexSelector/indexSelector.js',
					'src/app/ui/header/header.js',

					'src/app/app.js'
				],
				dest: 'dist/app.js'
			},
			appcss: {
				src: [
					'src/app/ui/abstractField/abstractField.css',
					'src/app/ui/button/button.css',
					'src/app/ui/menuButton/menuButton.css',
					'src/app/ui/splitButton/splitButton.css',
					'src/app/ui/toolbar/toolbar.css',
					'src/app/ui/abstractPanel/abstractPanel.css',
					'src/app/ui/infoPanel/infoPanel.css',
					'src/app/ui/menuPanel/menuPanel.css',
					'src/app/ui/table/table.css',
					'src/app/ui/jsonPretty/jsonPretty.css',
					'src/app/ui/jsonPanel/jsonPanel.css',
					'src/app/ui/panelForm/panelForm.css',
					'src/app/ui/sidebarSection/sidebarSection.css',
					'src/app/ui/queryFilter/queryFilter.css',
					'src/app/ui/browser/browser.css',
					'src/app/ui/anyRequest/anyRequest.css',
					'src/app/ui/clusterOverview/clusterOverview.css',
					'src/app/ui/clusterConnect/clusterConnect.css',
					'src/app/ui/structuredQuery/structuredQuery.css',
					'src/app/ui/filterBrowser/filterBrowser.css',
					'src/app/ui/header/header.css',
					'src/app/app.css'
				],
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
