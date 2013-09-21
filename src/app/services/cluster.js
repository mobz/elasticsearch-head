(function( $, app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	services.Cluster = ux.Class.extend({
		defaults: {
			base_uri: "http://localhost:9200/"
		},
		init: function() {
			this.base_uri = this.config.base_uri;
		},
		request: function( params ) {
			return $.ajax( $.extend({
				url: this.base_uri + params.path,
				dataType: "json",
				error: function(xhr, type, message) {
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			},  params) );
		},
		"get": function(path, success) { return this.request( { type: "GET", path: path, success: success } ); },
		"post": function(path, data, success) { return this.request( { type: "POST", path: path, data: data, success: success } ); },
		"put": function(path, data, success) { return this.request( { type: "PUT", path: path, data: data, success: success } ); },
		"delete": function(path, data, success) { return this.request( { type: "DELETE", path: path, data: data, success: success } ); }
	});

})( this.jQuery, this.app );