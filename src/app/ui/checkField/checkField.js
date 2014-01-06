(function( app ) {

	var ui = app.ns("ui");

	ui.CheckField = ui.AbstractField.extend({
		_main_template: function() { return (
			{ tag: "DIV", id: this.id(), cls: "uiCheckField", children: [
				{ tag: "INPUT", type: "checkbox", name: this.config.name, checked: !!this.config.value }
			] }
		); },
		validate: function() {
			return this.val() || ( ! this.require );
		},
		val: function( val ) {
			if( val === undefined ) {
				return !!this.field.attr( "checked" );
			} else {
				this.field.attr( "checked", !!val );
			}
		}
	});

})( this.app );


