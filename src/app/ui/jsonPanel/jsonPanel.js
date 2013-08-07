(function( app ) {

	var ui = app.ns("ui");

	ui.JsonPanel = ui.InfoPanel.extend({
		defaults: {
			json: null, // (required)
			modal: false,
			open: true,
			autoRemove: true,
			height: 500,
			width: 600
		},
		_body_template: function() {
			var body = this._super();
			body.child = new es.JsonPretty({ obj: this.config.json });
			return body;
		}
	});

})( this.app );
