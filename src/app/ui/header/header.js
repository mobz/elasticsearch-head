(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.Header = ui.AbstractWidget.extend({
		defaults: {
			cluster: null,
			clusterState: null
		},
		_baseCls: "uiHeader",
		init: function() {
			this._clusterConnect = new ui.ClusterConnect({
				cluster: this.config.cluster
			});
			var quicks = [
				{ text: i18n.text("Nav.Info"), path: "" },
				{ text: i18n.text("Nav.Status"), path: "_stats" },
				{ text: i18n.text("Nav.NodeStats"), path: "_nodes/stats" },
				{ text: i18n.text("Nav.ClusterNodes"), path: "_nodes" },
				{ text: i18n.text("Nav.Plugins"), path: "_nodes/plugins" },
				{ text: i18n.text("Nav.ClusterState"), path: "_cluster/state" },
				{ text: i18n.text("Nav.ClusterHealth"), path: "_cluster/health" },
				{ text: i18n.text("Nav.Templates"), path: "_template" }
			];
			var cluster = this.config.cluster;
			var quickPanels = {};
			var menuItems = quicks.map( function( item ) {
				return { text: item.text, onclick: function() {
					cluster.get( item.path, function( data ) {
						quickPanels[ item.path ] && quickPanels[ item.path ].el && quickPanels[ item.path ].remove();
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
			this.el = $.joey( this._main_template() );
			this.nameEl = this.el.find(".uiHeader-name");
			this.statEl = this.el.find(".uiHeader-status");
			this._clusterState = this.config.clusterState;
			this._clusterState.on("data", function( state ) {
				var shards = state.status._shards;
				var colour = state.clusterHealth.status;
				var name = state.clusterState.cluster_name;
				this.nameEl.text( name );
				this.statEl
					.text( i18n.text("Header.ClusterHealth", colour, shards.successful, shards.total ) )
					.css( "background", colour );
			}.bind(this));
			this.statEl.text( i18n.text("Header.ClusterNotConnected") ).css("background", "grey");
			this._clusterState.refresh();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, children: [
				this._clusterConnect,
				{ tag: "SPAN", cls: "uiHeader-name" },
				{ tag: "SPAN", cls: "uiHeader-status" },
				{ tag: "H1", text: i18n.text("General.Elasticsearch") },
				{ tag: "SPAN", cls: "pull-right", children: [
					this._quickMenu
				] }
			] }
		); }
	} );

})( this.jQuery, this.app, this.i18n );
