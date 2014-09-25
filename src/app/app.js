(function( app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	app.App = ui.AbstractWidget.extend({
		defaults: {
			base_uri: null
		},
		init: function(parent) {
			this._super();
			this.prefs = services.Preferences.instance();
			this.base_uri = this.config.base_uri || this.prefs.get("app-base_uri") || "http://localhost:9200";
			if( this.base_uri.charAt( this.base_uri.length - 1 ) !== "/" ) {
				// XHR request fails if the URL is not ending with a "/"
				this.base_uri += "/";
			}
			if( this.config.auth_user ) {
				var credentials = window.btoa( this.config.auth_user + ":" + this.config.auth_password );
				$.ajaxSetup({
					headers: {
						"Authorization": "Basic " + credentials
					}
				});
			}
			this.cluster = new services.Cluster({ base_uri: this.base_uri });
			this._clusterState = new services.ClusterState({
				cluster: this.cluster
			});

			this._header = new ui.Header({ cluster: this.cluster, clusterState: this._clusterState });
			this.$body = $.joey( this._body_template() );
			this.el = $.joey(this._main_template());
			this.attach( parent );
			this.instances = {};
			this.el.find(".uiApp-headerMenuItem:first").click();
			if( this.config.dashboard ) {
				if( this.config.dashboard === "cluster" ) {
					var page = this.instances["ClusterOverview"];
					page._refreshButton.set( 5000 );
				}
			}
		},

		navigateTo: function( type, config, ev ) {
			if( ev.target.classList.contains( "uiApp-headerNewMenuItem" ) ) {
				this.showNew( type, config, ev );
			} else {
				var ref = type + "0";
				if(! this.instances[ ref ]) {
					this.createPage( type, 0, config );
				}
				this.show( ref, ev );
			}
		},

		createPage: function( type, id, config ) {
			var page = this.instances[ type + id ] = new ui[ type ]( config );
			this.$body.append( page );
			return page;
		},

		show: function( ref, ev ) {
			$( ev.target ).closest("DIV.uiApp-headerMenuItem").addClass("active").siblings().removeClass("active");
			for(var p in this.instances) {
				this.instances[p][ p === ref ? "show" : "hide" ]();
			}
		},

		showNew: function( type, config, jEv ) {
			var ref, page, $tab,
				type_index = 0;

			while ( ! page ) {
				ref = type + ( ++type_index );
				if (! ( ref in this.instances ) ) {
					page = this.createPage( type, type_index, config );
				}
			}

			// Add the tab and its click handlers
			$tab = $.joey({
				tag: "DIV",
				cls: "uiApp-headerMenuItem pull-left",
				text: i18n.text("Nav." + type ) + " " + type_index,
				onclick: function( ev ) { this.show( ref, ev ); }.bind(this),
				children: [
					{ tag: "A", text: " [-]", onclick: function (ev) {
						$tab.remove();
						page.remove();
						delete this.instances[ ref ];
					}.bind(this) }
				]
			});

			$('.uiApp-headerMenu').append( $tab );
			$tab.trigger("click");
		},

		_openAnyRequest_handler: function(ev) { this.navigateTo("AnyRequest", { cluster: this.cluster }, ev ); },
		_openStructuredQuery_handler: function(ev) { this.navigateTo("StructuredQuery", { cluster: this.cluster }, ev ); },
		_openBrowser_handler: function(ev) { this.navigateTo("Browser", { cluster: this.cluster }, ev );  },
		_openClusterOverview_handler: function(ev) { this.navigateTo("ClusterOverview", { cluster: this.cluster, clusterState: this._clusterState }, ev ); },
		_openIndexOverview_handler: function(ev) { this.navigateTo("IndexOverview", { cluster: this.cluster, clusterState: this._clusterState }, ev ); },

		_body_template: function() { return (
			{ tag: "DIV", id: this.id("body"), cls: "uiApp-body" }
		); },

		_main_template: function() {
			return { tag: "DIV", cls: "uiApp", children: [
				{ tag: "DIV", id: this.id("header"), cls: "uiApp-header", children: [
					this._header,
					{ tag: "DIV", cls: "uiApp-headerMenu", children: [
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Overview"), onclick: this._openClusterOverview_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Indices"), onclick: this._openIndexOverview_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Browser"), onclick: this._openBrowser_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.StructuredQuery"), onclick: this._openStructuredQuery_handler, children: [
							{ tag: "A", cls: "uiApp-headerNewMenuItem ", text: ' [+]' }
						] },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.AnyRequest"), onclick: this._openAnyRequest_handler, children: [
							{ tag: "A", cls: "uiApp-headerNewMenuItem ", text: ' [+]' }
						] },
					]}
				]},
				this.$body
			]};
		}
		
	});

})( this.app, this.i18n );
