(function( app ) {

	var ui = app.ns("ui");

	ui.TextField = ui.AbstractField.extend({
		init: function() {
			this._super();
		},
		_keyup_handler: function() {
			this.fire("change", this );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiField uiTextField", children: [
				{ tag: "INPUT",
					type: "text",
					name: this.config.name,
					placeholder: this.config.placeholder,
					onkeyup: this._keyup_handler
				}
			]};
		}
	});

})( this.app );
