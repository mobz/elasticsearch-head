(function( $, app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.Model = ux.Observable.extend({
		defaults: {
			data: null
		},
		init: function() {
			this.set( this.config.data );
		},
		set: function( key, value ) {
			if( arguments.length === 1 ) {
				this._data = $.extend( {}, key );
			} else {
				key.split(".").reduce(function( ptr, prop, i, props) {
					if(i === (props.length - 1) ) {
						ptr[prop] = value;
					} else {
						if( !(prop in ptr) ) {
							ptr[ prop ] = {};
						}
						return ptr[prop];
					}
				}, this._data );
			}
		},
		get: function( key ) {
			return key.split(".").reduce( function( ptr, prop ) {
				return ( ptr && ( prop in ptr ) ) ? ptr[ prop ] : undefined;
			}, this._data );
		},
	});
})( this.jQuery, this.app );
