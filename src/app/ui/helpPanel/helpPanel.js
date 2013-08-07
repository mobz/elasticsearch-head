(function( app ){

	var ui = app.ns("ui");

	ui.HelpPanel = ui.InfoPanel.extend({
		defaults: {
			ref: "",
			open: true,
			autoRemove: true,
			modal: false,
			width: 500,
			height: 450,
			title: acx.text("General.Help")
		},
		init: function() {
			this._super();
			this.body.append(acx.text(this.config.ref));
		}
	});

})( this.app );
