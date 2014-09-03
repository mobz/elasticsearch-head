(function( app ) {
	
	var ux = app.ns("ux");
	var services = app.ns("services");

	services.Preferences = ux.Singleton.extend({
		init: function() {
			this._storage = window.localStorage;
			this._setItem("__version", 1 );
		},
		get: function( key ) {
			return this._getItem( key );
		},
		set: function( key, val ) {
			return this._setItem( key, val );
		},
		_getItem: function( key ) {
			try {
				return JSON.parse( this._storage.getItem( key ) );
			} catch(e) {
				console.warn( e );
				return undefined;
			}
		},
		_setItem: function( key, val ) {
			try {
				return this._storage.setItem( key, JSON.stringify( val ) );
			} catch(e) {
				console.warn( e );
				return undefined;
			}
		}
	});

})( this.app );
