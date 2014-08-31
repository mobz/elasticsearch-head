(function( app ) {

	var ux = app.ns("ux");

	var extend = ux.Observable.extend;
	var instance = function() {
		if( ! ("me" in this) ) {
			this.me = new this();
		}
		return this.me;
	};

	ux.Singleton = ux.Observable.extend({});

	ux.Singleton.extend = function() {
		var Self = extend.apply( this, arguments );
		Self.instance = instance;
		return Self;
	};

})( this.app );
