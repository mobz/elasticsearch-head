(function( $, joey, app ) {

	var ui = app.ns("ui");
	var ux = app.ns("ux");

	ui.AbstractWidget = ux.Observable.extend({
		defaults : {
			id: null     // the id of the widget
		},

		el: null,       // this is the jquery wrapped dom element(s) that is the root of the widget

		init: function() {
			this._super();
			for(var prop in this) {       // automatically bind all the event handlers
				if(prop.contains("_handler")) {
					this[prop] = this[prop].bind(this);
				}
			}
		},

		id: function(suffix) {
			return this.config.id ? (this.config.id + (suffix ? "-" + suffix : "")) : undefined;
		},

		attach: function( parent, method ) {
			if( parent ) {
				this.el[ method || "appendTo"]( parent );
			}
			this.fire("attached", this );
			return this;
		},

		remove: function() {
			this.el.remove();
			this.fire("removed", this );
			this.removeAllObservers();
			this.el = null;
			return this;
		}
	});

	joey.plugins.push( function( obj ) {
		if( obj instanceof ui.AbstractWidget ) {
			return obj.el[0];
		}
	});

})( this.jQuery, this.joey, this.app );
