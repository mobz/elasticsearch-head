(function( $, app ) {

	var ui = app.ns("ui");

	ui.Header = acx.ui.Widget.extend({
		init: function() {
			this._super();
			this.el = $( this._main_template() );
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiHeader", children: [
				{ tag: "H1", text: "elasticsearch" },
				new ui.Connect({})
			] }
		); }
	});

})( this.jQuery, this.app );