(function( $, app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	function parse_version( v ) {
		return v.match(/^(\d+)\.(\d+)\.(\d+)/).slice(1,4).map( function(d) { return parseInt(d || 0, 10); } );
	}

	services.Cluster = ux.Class.extend({
		defaults: {
			base_uri: null,
            username: null,
            password: null,
		},
		init: function() {
			this.base_uri = this.config.base_uri;
            var m = this.base_uri.match(/^http[s]?:\/\/(\w+):(\w+)@.+/);
            if (m != null) {
                this.username = m[1];
                this.password = m[2];
            }
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
            var call = {
				url: this.base_uri + params.path,
				contentType: "application/json",
				dataType: "json",
				error: function(xhr, type, message) {
                    //debugger;
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			};

            if (this.username != null && this.password != null) {
                call['username'] = this.username;
                call['password'] = this.password;
                call['xhrFields'] = { withCredentials: true };
            }

            call = $.extend(call, params);
			return $.ajax(call);
		},
		"get": function(path, success, error) { return this.request( { type: "GET", path: path, success: success, error: error } ); },
		"post": function(path, data, success, error) { return this.request( { type: "POST", path: path, data: data, success: success, error: error } ); },
		"put": function(path, data, success, error) { return this.request( { type: "PUT", path: path, data: data, success: success, error: error } ); },
		"delete": function(path, data, success, error) { return this.request( { type: "DELETE", path: path, data: data, success: success, error: error } ); }
	});

})( this.jQuery, this.app );
