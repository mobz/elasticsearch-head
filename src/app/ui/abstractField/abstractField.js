(function( $, app, joey ) {

	var ui = app.ns("ui");

	ui.AbstractField = ui.AbstractWidget.extend({

		defaults: {
			name : "",			// (required) - name of the field
			require: false,	// validation requirements (false, true, regexp, function)
			value: "",			// default value
			label: ""				// human readable label of this field
		},

		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
			this.field = this.el.find("[name="+this.config.name+"]");
			this.label = this.config.label;
			this.require = this.config.require;
			this.name = this.config.name;
			this.val( this.config.value );
			this.attach( parent );
		},

		val: function( val ) {
			if(val === undefined) {
				return this.field.val();
			} else {
				this.field.val( val );
				return this;
			}
		},

		validate: function() {
			var val = this.val(), req = this.require;
			if( req === false ) {
				return true;
			} else if( req === true ) {
				return val.length > 0;
			} else if( req.test && $.isFunction(req.test) ) {
				return req.test( val );
			} else if( $.isFunction(req) ) {
				return req( val, this );
			}
		}

	});

})( this.jQuery, this.app, this.joey );
