(function( $, app, i18n, raphael ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");
	var services = app.ns("services");

	ui.AnyRequest = ui.Page.extend({
		defaults: {
			cluster: null,       // (required) instanceof app.services.Cluster
			path: "_search",     // default uri to send a request to
			query: { query: { match_all: { }}},
			transform: "  return root;" // default transformer function (does nothing)
		},
		init: function(parent) {
			this._super();
			this.prefs = services.Preferences.instance();
			this.history = this.prefs.get("anyRequest-history") || [ { type: "POST", path: this.config.path, query : JSON.stringify(this.config.query), transform: this.config.transform } ];
			this.el = $.joey(this._main_template());
			this.base_uriEl = this.el.find("INPUT[name=base_uri]");
			this.pathEl = this.el.find("INPUT[name=path]");
			this.typeEl = this.el.find("SELECT[name=method]");
			this.dataEl = this.el.find("TEXTAREA[name=body]");
			this.prettyEl = this.el.find("INPUT[name=pretty]");
			this.transformEl = this.el.find("TEXTAREA[name=transform]");
			this.asGraphEl = this.el.find("INPUT[name=asGraph]");
			this.asTableEl = this.el.find("INPUT[name=asTable]");
			this.asJsonEl = this.el.find("INPUT[name=asJson]");
			this.cronEl = this.el.find("SELECT[name=cron]");
			this.outEl = this.el.find("DIV.uiAnyRequest-out");
			this.errEl = this.el.find("DIV.uiAnyRequest-jsonErr");
			this.typeEl.val("GET");
			this.attach(parent);
			this.setHistoryItem(this.history[this.history.length - 1]);
		},
		setHistoryItem: function(item) {
			this.pathEl.val(item.path);
			this.typeEl.val(item.type);
			this.dataEl.val(item.query);
			this.transformEl.val(item.transform);
		},
		_request_handler: function( ev ) {
			if(! this._validateJson_handler()) {
				return;
			}
			var path = this.pathEl.val(),
					type = this.typeEl.val(),
					query = JSON.stringify(JSON.parse(this.dataEl.val())),
					transform = this.transformEl.val(),
					base_uri = this.base_uriEl.val();
			if( ev ) { // if the user click request
				if(this.timer) {
					window.clearTimeout(this.timer); // stop any cron jobs
				}
				delete this.prevData; // remove data from previous cron runs
				this.outEl.text(i18n.text("AnyRequest.Requesting"));
				if( ! /\/$/.test( base_uri )) {
					base_uri += "/";
					this.base_uriEl.val( base_uri );
				}
				for(var i = 0; i < this.history.length; i++) {
					if(this.history[i].path === path &&
						this.history[i].type === type &&
						this.history[i].query === query &&
						this.history[i].transform === transform) {
						this.history.splice(i, 1);
					}
				}
				this.history.push({
					path: path,
					type: type,
					query: query,
					transform: transform
				});
				this.history.slice(250); // make sure history does not get too large
				this.prefs.set( "anyRequest-history", this.history );
				this.el.find("UL.uiAnyRequest-history")
					.empty()
					.append($( { tag: "UL", children: this.history.map(this._historyItem_template, this) }).children())
					.children().find(":last-child").each(function(i, j) { j.scrollIntoView(false); }).end()
					.scrollLeft(0);
			}
			this.config.cluster.request({
				url: base_uri + path,
				type: type,
				data: query,
				success: this._responseWriter_handler,
				error: this._responseError_handler
			});
		},
		_responseError_handler: function (response) {
			var obj;
			try {
				obj = JSON.parse(response.responseText);
				if (obj) {
					this._responseWriter_handler(obj);
				}
			} catch (err) {
			}
		},
		_responseWriter_handler: function(data) {
			this.outEl.empty();
			try {
				data = (new Function("root", "prev", this.transformEl.val()))(data, this.prevData)
			} catch(e) {
				this.errEl.text(e.message);
				return;
			}
			if(this.asGraphEl.attr("checked")) {
				var w = this.outEl.width();
				raphael(this.outEl[0], w - 10, 300)
					.g.barchart(10, 10, w - 20, 280, [data]);
			}
			if(this.asTableEl.attr("checked")) {
				try {
					var store = new app.data.ResultDataSourceInterface();
					this.outEl.append(new app.ui.ResultTable({
						width: this.outEl.width() - 23,
						store: store
					} ) );
					store.results(data);
				} catch(e) {
					this.errEl.text("Results Table Failed: " + e.message);
				}
			}
			if(this.asJsonEl.attr("checked")) {
				this.outEl.append(new ui.JsonPretty({ obj: data }));
			}
			if(this.cronEl.val() > 0) {
				this.timer = window.setTimeout(function(){
					this._request_handler();
				}.bind(this), this.cronEl.val());
			}
			this.prevData = data;
		},
		_validateJson_handler: function( ev ) {
			/* if the textarea is empty, we replace its value by an empty JSON object : "{}" and the request goes on as usual */
			var jsonData = this.dataEl.val().trim();
			var j;
			if(jsonData === "") {
				jsonData = "{}";
				this.dataEl.val( jsonData );
			}
			try {
				j = JSON.parse(jsonData);
			} catch(e) {
				this.errEl.text(e.message);
				return false;
			}
			this.errEl.text("");
			if(this.prettyEl.attr("checked")) {
				this.dataEl.val(JSON.stringify(j, null, "  "));
			}
			return true;
		},
		_historyClick_handler: function( ev ) {
			var item = $( ev.target ).closest( "LI" ).data( "item" );
			this.setHistoryItem( item );
		},
		_main_template: function() {
			return { tag: "DIV", cls: "anyRequest", children: [
				{ tag: "DIV", cls: "uiAnyRequest-request", children: [
					new app.ui.SidebarSection({
						open: false,
						title: i18n.text("AnyRequest.History"),
						body: { tag: "UL", onclick: this._historyClick_handler, cls: "uiAnyRequest-history", children: this.history.map(this._historyItem_template, this)	}
					}),
					new app.ui.SidebarSection({
						open: true,
						title: i18n.text("AnyRequest.Query"),
						body: { tag: "DIV", children: [
							{ tag: "INPUT", type: "text", name: "base_uri", value: this.config.cluster.config.base_uri },
							{ tag: "BR" },
							{ tag: "INPUT", type: "text", name: "path", value: this.config.path },
							{ tag: "SELECT", name: "method", children: ["POST", "GET", "PUT", "HEAD", "DELETE"].map(ut.option_template) },
							{ tag: "TEXTAREA", name: "body", rows: 20, text: JSON.stringify(this.config.query) },
							{ tag: "BUTTON", css: { cssFloat: "right" }, type: "button", children: [ { tag: "B", text: i18n.text("AnyRequest.Request") } ], onclick: this._request_handler },
							{ tag: "BUTTON", type: "button", text: i18n.text("AnyRequest.ValidateJSON"), onclick: this._validateJson_handler },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "pretty" }, i18n.text("AnyRequest.Pretty") ] },
							{ tag: "DIV", cls: "uiAnyRequest-jsonErr" }
						]}
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.Transformer"),
						help: "AnyRequest.TransformerHelp",
						body: { tag: "DIV", children: [
							{ tag: "CODE", text: "function(root, prev) {" },
							{ tag: "BR" },
							{ tag: "TEXTAREA", name: "transform", rows: 5, text: this.config.transform },
							{ tag: "BR" },
							{ tag: "CODE", text: "}" }
						] }
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.RepeatRequest"),
						body: { tag: "DIV", children: [
							i18n.text("AnyRequest.RepeatRequestSelect"), " ",
							{ tag: "SELECT", name: "cron", children: [
								{ value: 0, text: "do not repeat" },
								{ value: 1000, text: "second" },
								{ value: 1000 * 2, text: "2 seconds" },
								{ value: 1000 * 5, text: "5 seconds" },
								{ value: 1000 * 20, text: "20 seconds" },
								{ value: 1000 * 60, text: "minute" },
								{ value: 1000 * 60 * 10, text: "10 minutes" },
								{ value: 1000 * 60 * 60, text: "hour" }
							].map(function(op) { return $.extend({ tag: "OPTION"}, op); }) }
						] }
					}),
					new app.ui.SidebarSection({
						title: i18n.text("AnyRequest.DisplayOptions"),
						help: "AnyRequest.DisplayOptionsHelp",
						body: { tag: "DIV", children: [
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", checked: true, name: "asJson" }, i18n.text("AnyRequest.AsJson") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asGraph" }, i18n.text("AnyRequest.AsGraph") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asTable" }, i18n.text("AnyRequest.AsTable") ] }
						] }
					})
				] },
				{ tag: "DIV", cls: "uiAnyRequest-out" }
			] };
		},
		_historyItem_template: function(item) {
			return { tag: "LI", cls: "booble", data: { item: item }, children: [
				{ tag: "SPAN", text: item.path },
				" ",
				{ tag: "EM", text: item.query },
				" ",
				{ tag: "SPAN", text: item.transform }
			] };
		}
	});
	
})( this.jQuery, this.app, this.i18n, this.Raphael );
