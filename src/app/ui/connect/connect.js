(function( $, app ) {

	var ui = app.ns("ui");

	ui.Connect = ui.SplitButton.extend({
		defaults: {
			label: "Connect",
			items: [
				{ label: "localhost:9200", value: "http://localhost:9200", selected: true },
				{ label: "Connection Manager...", value: -1 }
			]
		}
	});

})( this.jQuery, this.app );
