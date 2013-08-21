(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.Header = ui.AbstractWidget.extend({
		defaults: {
			cluster: null,
			base_uri: null
		},
		_baseCls: "uiHeader",
		init: function() {
			this._clusterConnect = new ui.ClusterConnect({
				base_uri: this.config.base_uri
			});
			var quicks = [
				{ text: i18n.text("Nav.Info"), path: "" },
				{ text: i18n.text("Nav.Status"), path: "_status" },
				{ text: i18n.text("Nav.NodeStats"), path: "_cluster/nodes/stats" },
				{ text: i18n.text("Nav.ClusterNodes"), path: "_cluster/nodes" },
				{ text: i18n.text("Nav.ClusterState"), path: "_cluster/state" },
				{ text: i18n.text("Nav.ClusterHealth"), path: "_cluster/health" }
			];
			var cluster = this.config.cluster;
			var quickPanels = {};
			var menuItems = quicks.map( function( item ) {
				return { text: item.text, onclick: function() {
					cluster.get( item.path, function( data ) {
						quickPanels[ item.path ] && quickPanels[ item.path ].remove();
						quickPanels[ item.path ] = new ui.JsonPanel({
							title: item.text,
							json: data
						});
					} );
				} };
			}, this );
			this._quickMenu = new ui.MenuButton({
				label: i18n.text("NodeInfoMenu.Title"),
				menu: new ui.MenuPanel({
					items: menuItems
				})
			});
			this.el = $( this._main_template() );
		},
		quick: function(title, path) {
			this.quicks[path] && this.quicks[path].remove();
			this.cluster.get(path, function(data) {
				this.quicks[path] = new ui.JsonPanel({ title: title, json: data });
			}.bind(this));
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, children: [
				this._clusterConnect,
				{ tag: "H1", text: i18n.text("General.ElasticSearch") },
				{ tag: "SPAN", cls: "pull-right", children: [
					this._quickMenu
				] }
			] }
		); }
	} );

})( this.jQuery, this.app, this.i18n );
