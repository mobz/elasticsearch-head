(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.Header = ui.AbstractWidget.extend({
		defaults: {
			base_uri: null
		},
		_baseCls: "uiHeader",
		init: function() {
			this._clusterConnect = new ui.ClusterConnect({
				base_uri: this.config.base_uri
			});
			this.el = $( this._main_template() );
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, children: [
				this._clusterConnect,
				{ tag: "H1", text: i18n.text("General.ElasticSearch") }
			] }
		); }

	} );

})( this.jQuery, this.app, this.i18n );