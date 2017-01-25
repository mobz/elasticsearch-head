// Gruntfile to go with Dockerfile-alpine
// Uses grunt-http-server to serve the static content in _site
// Ref: https://divhide.com/node-grunt-http-server-1-x/
module.exports = function(grunt) {

  grunt.initConfig({
      'http-server': {
          'dev': {
              root: "_site",
              port: 9100,
              host: "0.0.0.0",
              runInBackground: false
          }
      }
  });

  grunt.loadNpmTasks('grunt-http-server');

};
