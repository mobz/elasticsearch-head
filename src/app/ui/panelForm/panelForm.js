(function( $, app ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.PanelForm = ui.AbstractWidget.extend({
		defaults: {
			fields: null	// (required) instanceof app.ux.FieldCollection
		},
		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
			this.attach( parent );
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiPanelForm", children: this.config.fields.fields.map(this._field_template, this) };
		},
		_field_template: function(field) {
			return { tag: "LABEL", cls: "uiPanelForm-field", children: [
				{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, ut.require_template(field) ] },
				field
			]};
		}
	});

})( this.jQuery, this.app );
