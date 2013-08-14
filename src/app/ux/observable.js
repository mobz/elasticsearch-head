(function( app ) {

	var ux = app.ns("ux");

	ux.Observable = ux.Class.extend((function() {
		return {
			init: function() {
				this.observers = {};
				for( var opt in this.config ) { // automatically install observers that are defined in the configuration
					if( opt.indexOf( 'on' ) === 0 ) {
						this.on( opt.substring(2) , this.config[ opt ] );
					}
				}
			},
			_getObs: function( type ) {
				return ( this.observers[ type.toLowerCase() ] || ( this.observers[ type.toLowerCase() ] = [] ) );
			},
			on: function( type, fn, params, thisp ) {
				this._getObs( type ).push( { "cb" : fn, "args" : params || [] , "cx" : thisp || this } );
				return this;
			},
			fire: function( type ) {
				var params = Array.prototype.slice.call( arguments, 1 );
				this._getObs( type ).slice().forEach( function( ob ) {
					ob["cb"].apply( ob["cx"], ob["args"].concat( params ) );
				} );
				return this;
			},
			removeAllObservers: function() {
				this.observers = {};
			},
			removeObserver: function( type, fn ) {
				var obs = this._getObs( type ),
					index = obs.reduce( function(p, t, i) { return (t.cb === fn) ? i : p; }, -1 );
				if(index !== -1) {
					obs.splice( index, 1 );
				}
				return this; // make observable functions chainable
			},
			hasObserver: function( type ) {
				return !! this._getObs( type ).length;
			}
		};
	})());

})( this.app );