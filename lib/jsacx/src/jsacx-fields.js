acx.ui.PanelForm = app.ui.AbstractWidget.extend({
	defaults: {
		fields: null	// (required) instanceof acx.ux.FieldCollection
	},
	init: function(parent) {
		this._super();
		this.el = $(this._main_template());
		this.attach( parent );
	},
	_main_template: function() {
		return { tag: "DIV", id: this.id(), cls: "uiPanelForm", children: this.config.fields.fields.map(this._field_template, this) };
	},
	_field_template: function(field) {
		return { tag: "LABEL", cls: "uiPanelForm-field", children: [
			{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, acx.ut.require_template(field) ] },
			field
		]}
	}
});