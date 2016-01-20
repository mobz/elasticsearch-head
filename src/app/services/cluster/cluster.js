(function( $, app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	function parse_version( v ) {
		return v.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1,4).map( function(d) { return parseInt(d || 0, 10); } );
	}

	services.Cluster = ux.Class.extend({
		defaults: {
			base_uri: null
		},
		init: function() {
			this.base_uri = this.config.base_uri;
		},
		setVersion: function( v ) {
			this.version = v;
			this._version_parts = parse_version( v );
		},
		versionAtLeast: function( v ) {
			var testVersion = parse_version( v );
			for( var i = 0; i < 3; i++ ) {
				if( testVersion[i] !== this._version_parts[i] ) {
					return testVersion[i] < this._version_parts[i];
				}
			}
			return true;
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
