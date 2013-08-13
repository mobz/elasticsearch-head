(function( $, app ) {

	var ui = app.ns("ui");

		ui.ClusterConnect = ui.AbstractQuery.extend({
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
			this.nameEl = this.el.find(".es-header-clusterName");
			this.statEl = this.el.find(".es-header-clusterStatus");
			this.statEl.text("cluster health: not connected").css("background", "red");
			this._request_handler({ type: "GET", path: "", success: this._node_handler });
			this._request_handler({	type: "GET", path: "_cluster/health", success: this._health_handler });
		},
		
		_node_handler: function(data) {
			if(data) {
				this.nameEl.text(data.name);
				this.fire("reconnect", this.base_uri);
			}
		},
		
		_health_handler: function(data) {
			if(data) {
				this.statEl.text(i18n.text("Header.ClusterHealth", data.status, data.number_of_nodes, data.active_primary_shards ) ).css("background", data.status);
				this.fire("status", data.status);
			}
		},
		
		_reconnect_handler: function() {
			var base_uri = this.el.find(".es-header-uri").val();
			$("body").empty().append(new app.App("body", { id: "es", base_uri: base_uri }));
		},
		
		_main_template: function() {
			return { tag: "SPAN", cls: "es-cluster", children: [
				{ tag: "INPUT", type: "text", cls: "es-header-uri", onkeyup: function( jEv ) {
					if(jEv.which === 13) {
						jEv.preventDefault();
						this._reconnect_handler();
					}
				}.bind(this), id: this.id("baseUri"), value: this.config.base_uri },
				{ tag: "BUTTON", type: "button", text: i18n.text("Header.Connect"), onclick: this._reconnect_handler },
				{ tag: "SPAN", cls: "es-header-clusterName" },
				{ tag: "SPAN", cls: "es-header-clusterStatus" }
			]};
		}
	});

})( this.jQuery, this.app );