(function( app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	app.App = ui.AbstractWidget.extend({
		defaults: {
			base_uri: localStorage["base_uri"] || "http://localhost:9200/"   // the default Elasticsearch host
		},
		init: function(parent) {
			this._super();
			this.base_uri = this.config.base_uri;
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
			this.$body = $( this._body_template() );
			this.el = $(this._main_template());
			this.attach( parent );
			this.instances = {};
			this.el.find(".uiApp-headerMenuItem:first").click();
			if( this.config.dashboard ) {
				if( this.config.dashboard === "cluster" ) {
					var page = this.instances["ClusterOverview"];
					page._redrawValue = 5000;
					page.redraw("reset");
				}
			}
		},
		
		show: function(type, config, jEv) {
			if(! this.instances[type]) {
				var page = this.instances[type] = new ui[type]( config );
				this.$body.append( page );
			}
			$(jEv.target).closest("DIV.uiApp-headerMenuItem").addClass("active").siblings().removeClass("active");
			for(var p in this.instances) {
				this.instances[p][ p === type ? "show" : "hide" ]();
			}
		},

		showNew: function(type, config, jEv, tab_text) {
			var that = this,
				type_name = '',
				type_index = 0,
				page, $tab;

			// Loop through until we find an unused type name
			while (type_name === '') {
				type_index++;
				if (!this.instances[type + type_index.toString()]) {
					// Found an available type name, so put it together and add it to the UI
					type_name = type + type_index.toString();
					page = this.instances[type_name] = new ui[type](config);
					this.$body.append( page );
				}
			}

			// Make sure we have text for the tab
			if (tab_text) {
				tab_text += ' ' + type_index.toString();
			} else {
				tab_text = type_name;
			}

			// Add the tab and its click handlers
			$tab = this.newTab(tab_text, {
				click: function (jEv) {
					that.show(type_name, config, jEv);
				},
				close_click: function (jEv) {
					$tab.remove();
					page.remove();
					delete that.instances[type_name];
				}
			});
			
			// Click the new tab to make it show
			$tab.trigger('click');
		},

		_openAnyRequest_handler: function(jEv) { this.show("AnyRequest", { cluster: this.cluster }, jEv); },
		_openNewAnyRequest_handler: function(jEv) { this.showNew("AnyRequest", { cluster: this.cluster }, jEv, i18n.text("Nav.AnyRequest")); return false; },
		_openStructuredQuery_handler: function(jEv) { this.show("StructuredQuery", { cluster: this.cluster }, jEv); },
		_openNewStructuredQuery_handler: function(jEv) { this.showNew("StructuredQuery", { cluster: this.cluster }, jEv, i18n.text("Nav.StructuredQuery")); return false; },
		_openBrowser_handler: function(jEv) { this.show("Browser", { cluster: this.cluster }, jEv);  },
		_openClusterOverview_handler: function(jEv) { this.show("ClusterOverview", { cluster: this.cluster, clusterState: this._clusterState }, jEv); },

		_body_template: function() { return (
			{ tag: "DIV", id: this.id("body"), cls: "uiApp-body" }
		); },

		_main_template: function() {
			return { tag: "DIV", cls: "uiApp", children: [
				{ tag: "DIV", id: this.id("header"), cls: "uiApp-header", children: [
					this._header,
					{ tag: "DIV", cls: "uiApp-headerMenu", children: [
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Overview"), onclick: this._openClusterOverview_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.Browser"), onclick: this._openBrowser_handler },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.StructuredQuery"), onclick: this._openStructuredQuery_handler, children: [
							{ tag: "A", text: ' [+]', onclick: this._openNewStructuredQuery_handler}
						] },
						{ tag: "DIV", cls: "uiApp-headerMenuItem pull-left", text: i18n.text("Nav.AnyRequest"), onclick: this._openAnyRequest_handler, children: [
							{ tag: "A", text: ' [+]', onclick: this._openNewAnyRequest_handler}
						] },
					]}
				]},
				this.$body
			]};
		},

		newTab: function(text, events) {
			var $el = $({tag: 'DIV', cls: 'uiApp-headerMenuItem pull-left', text: text, children: [
				{tag: 'A', text: ' [-]'}
			]});

			// Apply the events to the tab as given
			$.each(events || {}, function (event_name, fn) {
				if (event_name === 'close_click') {
					$('a',$el).bind('click', fn);
				} else {
					$el.bind(event_name, fn);
				}
			});

			$('.uiApp-headerMenu').append($el);
			return $el;
		}
		
	});

})( this.app, this.i18n );
