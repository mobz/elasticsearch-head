(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	ui.ClusterConnect = ui.AbstractWidget.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.prefs = services.Preferences.instance();
			this.cluster = this.config.cluster;
			this.el = $.joey(this._main_template());
			this.cluster.get( "", this._node_handler );
		},

		_node_handler: function(data) {
			if(data) {
				this.prefs.set("app-base_uri", this.cluster.base_uri);
				if(data.version && data.version.number)
					this.cluster.setVersion(data.version.number);
			}
		},

		_reconnect_handler: function() {
			var base_uri = this.el.find(".uiClusterConnect-uri").val();
			var url;
			if(base_uri.indexOf("?") !== -1) {
				url = base_uri.substring(0, base_uri.indexOf("?")-1);
			} else {
				url = base_uri;
			}
			var argstr = base_uri.substring(base_uri.indexOf("?")+1, base_uri.length);
			var args = argstr.split("&").reduce(function(r, p) {
				r[decodeURIComponent(p.split("=")[0])] = decodeURIComponent(p.split("=")[1]);
				return r;
			}, {});
			$("body").empty().append(new app.App("body", { id: "es",
				base_uri: url,
			 	auth_user : args["auth_user"] || "",
			 	auth_password : args["auth_password"] || ""
			}));
		},

		_main_template: function() {
			return { tag: "SPAN", cls: "uiClusterConnect", children: [
				{ tag: "INPUT", type: "text", cls: "uiClusterConnect-uri", onkeyup: function( ev ) {
					if(ev.which === 13) {
						ev.preventDefault();
						this._reconnect_handler();
					}
				}.bind(this), id: this.id("baseUri"), value: this.cluster.base_uri },
				{ tag: "BUTTON", type: "button", text: i18n.text("Header.Connect"), onclick: this._reconnect_handler }
			]};
		}
	});

})( this.jQuery, this.app, this.i18n );

