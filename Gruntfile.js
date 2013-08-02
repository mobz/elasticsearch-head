module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		concat: {
			options: {
//        separator: ';'
			},
			setup: {
				src: [
					'lib/jsacx/src/jquery.js',
					'lib/jsacx/src/jsacx.js',
					'lib/nohtml/jquery.acx-nohtml.js'
				],
				dest: 'dist/core.js'
			},
			ui: {
				src: [
					'lib/jsacx/src/jsacx-widgets.js',
					'lib/jsacx/src/jsacx-fields.js',
					'lib/jsacx/src/jsacx-data.js',
					'lib/es/core.js',
					'lib/es/widgets.js',
					'lib/graphael/g.raphael.standalone.js',
					'lib/dateRangeParser/date-range-parser.js'
				],
				dest: 'dist/ui.js'
			}
		}
	});
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-concat');

	// Default task(s).
	grunt.registerTask('default', ['concat']);

};