(function( $, app ) {

	var ui = app.ns("ui");

	ui.Toolbar = ui.AbstractWidget.extend({
		defaults: {
			label: "",
			left: [],
			right: []
		},
		init: function(parent) {
			this._super();
			this.el = $.joey(this._main_template());
		},
		_main_template: function() {
			return { tag: "DIV", cls: "uiToolbar", children: [
				{ tag: "DIV", cls: "pull-left", children: [
					{ tag: "H2", text: this.config.label }
				].concat(this.config.left) },
				{ tag: "DIV", cls: "pull-right", children: this.config.right }
			]};
		}
	});

})( this.jQuery, this.app );
