(function( app ) {

	var ux = app.ns("ux");

	ux.FieldCollection = ux.Observable.extend({
		defaults: {
			fields: []	// the collection of fields
		},
		init: function() {
			this._super();
			this.fields = this.config.fields;
		},
		validate: function() {
			return this.fields.reduce(function(r, field) {
				return r && field.validate();
			}, true);
		},
		getData: function(type) {
			return this.fields.reduce(function(r, field) {
				r[field.name] = field.val(); return r;
			}, {});
		}
	});

})( this.app );
