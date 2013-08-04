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
				{ tag: "INPUT", type: "text", plcaeholder: "connect..." },
				new acx.ui.SplitButton({
					label: "Connect",
					items: [
						{ label: acx.text("General.ManualRefresh"), value: -1, selected: true },
						{ label: acx.text("General.RefreshQuickly"), value: 100 },
						{ label: acx.text("General.Refresh5seconds"), value: 5000 },
						{ label: acx.text("General.Refresh1minute"), value: 60000 }
					]
				})
			] }
		); }
	});

})( this.jQuery, this.app );