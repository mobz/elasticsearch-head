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
			title: i18n.text("General.Help")
		},
		init: function() {
			this._super();
			this.body.append(i18n.text(this.config.ref));
		}
	});

})( this.app );
