(function( $, app, i18n ) {
	
	var ui = app.ns("ui");

	ui.IndexOverview = ui.Page.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.el = $(this._main_template());
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiIndexOverview", children: [
				new ui.Toolbar({
					label: i18n.text("IndexOverview.PageTitle"),
					left: [
						new ui.Button({
							label: i18n.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						}),
					]
				}),
				{ tag: "DIV", cls: "uiIndexOverview-table" }
			] };
		}

	});

})( this.jQuery, this.app, this.i18n );
