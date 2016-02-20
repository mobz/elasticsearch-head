module.exports = function(grunt) {

    var fileSets = require("./grunt_fileSets.js");

    // Project configuration.
    grunt.initConfig({
	deb_package: {
	    task: ['debian_package'],
	    options: {
	    maintainer: "Konstantin Tushakov ktu@tradeshift.com",
	    version: "2.0.0",
	    name: "elasticsearch-head",
	    short_description: "Head plugin for elasticsearch",
	    long_description: "Debian package for the elasticsearch head plugin",
	    target_architecture: "all",
	    category: "devel",
	    build_number: "1",
	    dependencies: [],           // List of the package dependencies 
	    tmp_dir: './.tmp/',            // The task working dir 
	    output: './output/'         // Where your .deb should be created 
	    },
	    build: {
		    files: [{
		        cwd: './_site',
		        src: '**/*',
		        dest: '/usr/share/elasticsearch/plugins/head/_site'
		    },
		    {
			cwd: './src/',
			src: '**/*',
			dest: '/usr/share/elasticsearch/plugins/head/src/'
		    },
		    {
			cwd: './test/',
			src: '**/*',
			dest: '/usr/share/elasticsearch/plugins/head/test/'
		    },
		    {
			src: ['plugin-descriptor.properties', 'README.textile', 'index.html'],
			dest: '/usr/share/elasticsearch/plugins/head/'
		    }],
	    }
	}

    });

    grunt.loadNpmTasks('grunt-deb');

    grunt.registerTask('debian_package', ['deb_package']);

};
