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

		_baseCls: "uiPanel uiInfoPanel uiJsonPanel",

		_body_template: function() {
			var body = this._super();
			body.children = [ new ui.JsonPretty({ obj: this.config.json }) ];
			return body;
		}
	});

})( this.app );
