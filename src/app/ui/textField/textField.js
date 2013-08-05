(function( app ) {

	var ui = app.ns("ui");

	ui.TextField = ui.AbstractField.extend({
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiField uiTextField", children: [
				{ tag: "INPUT", type: "text", name: this.config.name }
			]};
		}
	});

})( this.app );
