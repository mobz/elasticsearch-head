(function() {
	var es = window.es;

	es.ui = {};

	es.ui.QueryFilter = acx.ui.Widget.extend({
		defaults: {
			metadata: null,   // (required) instanceof es.MetaData
			query: null       // (required) instanceof es.Query that the filters will act apon
		},
		init: function() {
			this._super();
			this.metadata = this.config.metadata;
			this.query = this.config.query;
			this.el = $(this._main_template());
		},
		requestUpdate: function(jEv) {
			if(jEv && jEv.originalEvent) { // we only want to update on real user interaction not generated events
				this.query.setPage(1);
				this.query.query();
			}
		},
		_selectAlias_handler: function(jEv) {
			var indices = (jEv.target.selectedIndex === 0) ? [] : this.metadata.getIndices($(jEv.target).val());
			$(".queryFilter-index").each(function(i, el) {
				var jEl = $(el);
				if(indices.contains(jEl.text()) !== jEl.hasClass("selected")) {
					jEl.click();
				}
			});
			this.requestUpdate(jEv);
		},
		_selectIndex_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".queryFilter-index");
			jEl.toggleClass("selected");
			this.query.setIndex(jEl.text(), jEl.hasClass("selected"));
			var types = this.metadata.getTypes(this.query.indices);
			this.el.find("DIV.queryFilter-type.selected").each(function(n, el) {
				if(! types.contains($(el).text())) {
					$(el).click();
				}
			});
			this.requestUpdate(jEv);
		},
		_selectType_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".queryFilter-type");
			jEl.toggleClass("selected");
			console.log("_selectType_handler", jEl);
			this.query.setType(jEl.text(), jEl.hasClass("selected"));
			this.requestUpdate(jEv);
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "queryFilter", children: [
				this._aliasSelector_template(),
				this._indexSelector_template(),
				this._typesSelector_template(),
				this._filters_template()
			] };
		},
		_aliasSelector_template: function() {
			var aliases = acx.eachMap(this.metadata.aliases, function(alias) { return alias; } );
			aliases.unshift("All Indices");
			return { tag: "DIV", cls: "section queryFilter-aliases", child:
 				{ tag: "SELECT", onChange: this._selectAlias_handler, children: aliases.map(acx.ut.option_template) }
			}
		},
		_indexSelector_template: function() {
			return { tag: "DIV", cls: "section queryFilter-indices", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Indices") },
				{ tag: "DIV", onClick: this._selectIndex_handler, children: acx.eachMap(this.metadata.indices, function(name, data) {
					return { tag: "DIV", cls: "booble queryFilter-index", text: name };
				})}
			] };
		},
		_typesSelector_template: function() {
			return { tag: "DIV", cls: "section queryFilter-types", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Types") },
				{ tag: "DIV", onClick: this._selectType_handler, children: acx.eachMap(this.metadata.types, function(name, data) {
					return { tag: "DIV", cls: "booble queryFilter-type", text: name };
				})}
			] };
		},
		_filters_template: function() {
			return { tag: "DIV", cls: "section queryFilter-filters", children: [
				{ tag: "HEADER", text: acx.text("QueryFilter-Header-Fields") },
				{ tag: "DIV", children: acx.eachMap(this.metadata.fields, function(name, data) {
					return { tag: "DIV", cls: "queryFilter-filterName", children: [
						{ tag: "SPAN", text: name }
					] };
				} ) }
			] };
		}

	});

	es.ui.Browser = acx.ui.Widget.extend({
		defaults: {
			cluster: null  // (required) instanceof es.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.query = new es.Query( { cluster: this.cluster } );
			this.el = $(this._main_template());
			new es.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new es.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.queryFilter = new es.ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.appendTo(this.el.find("> .browser-filter") );
					this.resultTable = new acx.ui.Table( {
						onRowClick: this._showPreview_handler,
						onHeaderClick: this._changeSort_handler,
						store: this.store,
						height: 400,
						width: this.el.find("> .browser-table").innerWidth()
					} );
					this.resultTable.appendTo( this.el.find("> .browser-table") );
					this.updateResults();
				}.bind(this)
			})
		},
		updateResults: function() {
			this.query.query();
		},
		_showPreview_handler: function(obj, data) {
			data.row.addClass("selected");
			new acx.ui.DraggablePanel({
				title: acx.text("Browser.ResultSourcePanelTitle"),
				body: new es.JsonPretty({ obj: data.row.data("row")._source }),
				open: true,
				autoRemove: true,
				onClose: function() { data.row.removeClass("selected"); }
			});
		},
		_changeSort_handler: function(table, wEv) {
			this.query.setSort(wEv.column, wEv.dir === "desc");
			this.query.setPage(1);
			this.query.query();
		},
		_main_template: function() {
			return { tag: "DIV", cls: "browser", children: [
				{ tag: "DIV", cls: "browser-filter" },
				{ tag: "DIV", cls: "browser-table" }
			] };
		}
	});

	es.ui.AnyRequest = acx.ui.Widget.extend({
		defaults: {
			cluster: null,       // (required) instanceof es.Cluster
			path: "_search",     // default uri to send a request to
			query: { query: { match_all: { }}},
			transform: "  return root;" // default transformer function (does nothing)
		},
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.base_uriEl = this.el.find("INPUT[name=base_uri]");
			this.pathEl = this.el.find("INPUT[name=path]");
			this.typeEl = this.el.find("SELECT[name=method]");
			this.dataEl = this.el.find("TEXTAREA[name=body]");
			this.prettyEl = this.el.find("INPUT[name=pretty]");
			this.transformEl = this.el.find("TEXTAREA[name=transform]");
			this.graphEl = this.el.find("INPUT[name=graph]");
			this.hideJsonEl = this.el.find("INPUT[name=hideJson]");
			this.cronEl = this.el.find("SELECT[name=cron]");
			this.outEl = this.el.find("DIV.anyRequest-out");
			this.errEl = this.el.find("DIV.anyRequest-jsonErr");
			this.appendTo(parent);
		},

		_request_handler: function(jEv) {
			if(! this._validateJson_handler()) return;
			if(jEv && jEv.originalEvent) { // if the user click request
				if(this.timer) {
					window.clearTimeout(this.timer); // stop any cron jobs
				}
				delete this.prevData; // remove data from previous cron runs
				this.outEl.text(acx.text("AnyRequest.Requesting"));
			}
			this.config.cluster.request({
				url: this.base_uriEl.val() + this.pathEl.val(),
				type: this.typeEl.val(),
				data: this.dataEl.val().trim(),
				success: this._responseWriter_handler
			});
		},
		_responseWriter_handler: function(data) {
			this.outEl.empty();
			try {
				data = (new Function("root", "prev", this.transformEl.val()))(data, this.prevData)
			} catch(e) {
				this.errEl.text(e.message);
				return;
			}
			if(this.graphEl.attr("checked")) {
				var w = this.outEl.width();
				Raphael(this.outEl[0], w - 10, 300)
					.g.barchart(10, 10, w - 20, 280, [data]);
			}
			if(this.cronEl.val() > 0) {
				this.timer = window.setTimeout(function(){
					this._request_handler();
				}.bind(this), this.cronEl.val());
			}
			if(! this.hideJsonEl.attr("checked")) {
				this.outEl.append(new es.JsonPretty({ obj: data }));
			}
			this.prevData = data;
		},
		_validateJson_handler: function(jEv) {
			try {
				var j = JSON.parse(this.dataEl.val().trim());
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
		_showSection_handler: function(jEv) {
			$(jEv.target).closest(".sidebar-section").children(".sidebar-subbody").slideToggle();
		},
		_transformerHelp_handler: function(jEv) {
			this.outEl.html(acx.text("AnyRequest.TransformerHelp")); // todo don't use outEl, throw up a popup
			jEv.stopPropagation();
		},
		_graphHelp_handler: function(jEv) {
			this.outEl.html(acx.text("AnyRequest.GraphHelp")); // todo don't use outEl, throw up a popup
			jEv.stopPropagation();
		},
		_main_template: function() {
			return { tag: "DIV", cls: "anyRequest", children: [
				{ tag: "DIV", cls: "anyRequest-request", children: [
				  { tag: "DIV", cls: "sidebar-section", children: [
						{ tag: "INPUT", type: "text", name: "base_uri", value: this.config.cluster.config.base_uri },
						{ tag: "BR" },
						{ tag: "INPUT", type: "text", name: "path", value: this.config.path },
						{ tag: "SELECT", name: "method", children: ["POST", "GET", "PUT", "DELETE"].map(acx.ut.option_template) },
						{ tag: "TEXTAREA", name: "body", rows: 20, text: JSON.stringify(this.config.query) },
	  				{ tag: "BUTTON", css: { cssFloat: "right" }, type: "button", child: { tag: "B", text: acx.text("AnyRequest.Request") }, onclick: this._request_handler },
						{ tag: "BUTTON", type: "button", text: acx.text("AnyRequest.ValidateJSON"), onclick: this._validateJson_handler },
						{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "pretty" }, acx.text("AnyRequest.Pretty") ] },
						{ tag: "DIV", cls: "anyRequest-jsonErr" },
					]},
					{ tag: "DIV", cls: "sidebar-section", children: [
						{ tag: "DIV", cls: "sidebar-subhead", onclick: this._showSection_handler, children: [
							acx.text("AnyRequest.Transformer"),
							{ tag: "BUTTON", type: "button", cls: "es-right", onclick: this._transformerHelp_handler, text: "?" }
						] },
						{ tag: "DIV", cls: "sidebar-subbody", children: [
						  { tag: "CODE", text: "function(root, prev) {" },
							{ tag: "BR" },
							{ tag: "TEXTAREA", name: "transform", rows: 5, text: this.config.transform },
							{ tag: "BR" },
							{ tag: "CODE", text: "}" }
						] }
					] },
					{ tag: "DIV", cls: "sidebar-section", children: [
						{ tag: "DIV", cls: "sidebar-subhead", onclick: this._showSection_handler, children: [
							acx.text("AnyRequest.RepeatRequest")
						] },
						{ tag: "DIV", cls: "sidebar-subbody", children: [
							acx.text("AnyRequest.RepeatRequestSelect"), " ",
							{ tag: "SELECT", name: "cron", children: [
								{ value: 0, text: "do not repeat" },
								{ value: 1000, text: "second" },
								{ value: 1000 * 2, text: "2 seconds" },
								{ value: 1000 * 5, text: "5 seconds" },
								{ value: 1000 * 20, text: "20 seconds" },
								{ value: 1000 * 60, text: "minute" },
								{ value: 1000 * 60 * 10, text: "10 minutes" },
								{ value: 1000 * 60 * 60, text: "hour" }
							].map(function(op) { return acx.extend({ tag: "OPTION"}, op); }) }
						] }
					]},
					{ tag: "DIV", cls: "sidebar-section", children: [
						{ tag: "DIV", cls: "sidebar-subhead", onclick: this._showSection_handler, children: [
							acx.text("AnyRequest.GraphResult"),
							{ tag: "BUTTON", type: "button", cls: "es-right", onclick: this._graphHelp_handler, text: "?" }
						] },
						{ tag: "DIV", cls: "sidebar-subbody", children: [
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "graph" }, acx.text("AnyRequest.Enabled") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "hideJson" }, acx.text("AnyRequest.HideJson") ] }
						] }
					]}
				] },
				{ tag: "DIV", cls: "anyRequest-out" }
			] };
		}
	});
	
	es.ui.SimpleGetQuery = acx.ui.Widget.extend({
		defaults: {
//		cluster: null,	// (required) instance of es.Cluster
//		path: "",		 		// (required) path to request
			visualiser: null// (optional a widget class that will be crated and fed the result of the get query)
		},
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.config.cluster.get(this.config.path, this._update_handler);
		},
		
		_update_handler: function(data) {
			this.config.visualiser &&
				this.el.find("> .simpleGetQuery-vis").empty().append(new this.config.visualiser({ cluster: this.cluster, data: data }));
			this.el.find("> .simpleGetQuery-out").empty().append(new es.JsonPretty({ obj: data }));
		},

		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "simpleGetQuery", children: [
				{ tag: "DIV", cls: "simpleGetQuery-vis" },
				{ tag: "DIV", cls: "simpleGetQuery-out" }
			] };
		}
	});
	
	es.ui.visualiser = {};
	
	es.ui.AbstractVisualiser = acx.ui.Widget.extend({
		defaults: {
//		cluster: null,	(required)
//		data: null			(required)	
		}
	});
	
	es.ui.NodeVisualiser = es.ui.AbstractVisualiser.extend({
		init: function() {
			this._super();
			this.el = $(this._main_template());
		},
		_main_template: function() {
			var data = this.config.data, base = window.location.href.split("?")[0] + "?base_uri=";
			return { tag: "DIV", cls: "nodeVisualiser", children: [
				{ tag: "DIV", cls: "nodeVisualiser-name", text: data.cluster_name },
				{ tag: "DIV", cls: "nodeVisualiser-nodes", child: { tag: "TABLE", cellspacing: 10, child: { tag: "TBODY", child: { tag: "TR", children: acx.eachMap(data.nodes, function(id, data) {
					var addr = "http://" + data.http_address.match(/([\d.:]+)/)[0] + "/";
					return { tag: "TD", onClick: function() {
						new acx.ui.DraggablePanel({ title: id, modal: false, autoRemove: true, open: true, body: new es.JsonPretty({ obj: data }) });
					}, children: [
						{ tag: "DIV", text: "id: " + id },
						{ tag: "DIV", text: "name: " + data.name },
						{ tag: "DIV", child: { tag: "A", href: base + addr, text: addr, target: "_new" } }
					]}
				})}}}}
			]};
		}
	});
	
	var coretype_map = {
		"string" : "string",
		"long" : "number",
		"integer" : "number",
		"float" : "number",
		"double" : "number",
		"ip" : "number",
		"date" : "date",
		"boolean" : "boolean",
		"binary" : "binary"
	};
	var default_property_map = {
		"string" : { "store" : "no", "index" : "analysed" },
		"number" : { "store" : "no", "precision_steps" : 4 },
		"date" : { "store" : "no", "format" : "dateOptionalTime", "index": "yes", "precision_steps": 4 },
		"boolean" : { "store" : "no", "index": "yes" },
		"binary" : { }
	};

	es.JsonPretty = acx.ui.Widget.extend({
		defaults: {
			obj: null
		},
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.appendTo(parent);
			this.el.click(this._click_handler);
		},
		
		_click_handler: function(jEv) {
			var t = $(jEv.target).closest(".jsonPretty-name").closest("LI");
			if(t.length === 0 || t.parents(".jsonPretty-minimised").length > 0) { return; }
			t.toggleClass("jsonPretty-minimised");
			jEv.stopPropagation();
		},
		
		_main_template: function() {
			try {
					return { tag: "DIV", cls: "jsonPretty", children: this.pretty.parse(this.config.obj) };
			}	catch (error) {
					throw "JsonPretty error: " + error.message;
			}
		},
		
		pretty: { // from https://github.com/RyanAmos/Pretty-JSON/blob/master/pretty_json.js
			"expando" : function(value) {
				return (value && (/array|object/i).test(value.constructor.name)) ? "expando" : "";
			},
			"parse": function (member) {
				return this[(member == undefined) ? 'null' : member.constructor.name.toLowerCase()](member);
			},
			"null": function (value) {
				return this['value']('null', 'null');
			},
			"array": function (value) {
				var results = value.map(function(v) {
					return { tag: "LI", cls: this.expando(v), child: this['parse'](v) };
				}, this);
				return [ "[ ", ((results.length > 0) ? { tag: "UL", cls: "jsonPretty-array", children: results } : null), "]" ];
			},
			"object": function (value) {
				var results = [];
				for (member in value) {
					results.push({ tag: "LI", cls: this.expando(value[member]), children:  [ this['value']('name', member), ': ', this['parse'](value[member]) ] });
				}
				return [ "{ ", ((results.length > 0) ? { tag: "UL", cls: "jsonPretty-object", children: results } : null ),  "}" ];
			},
			"number": function (value) {
				return this['value']('number', value.toString());
			},
			"string": function (value) {
				return this['value']('string', value.toString());
			},
			"boolean": function (value) {
				return this['value']('boolean', value.toString());
			},
			"value": function (type, value) {
				if (/^(http|https):\/\/[^\s]+$/.test(value)) {
					return this['value'](type, { tag: "A", href: value, target: "_blank", text: value } );
				}
				return { tag: "SPAN", cls: "jsonPretty-" + type, text: value };
			}
		}
	});

	es.BoolQuery = acx.ux.Observable.extend({
		defaults: {
			size: 50		// size of pages to return
		},
		init: function() {
			this._super();
			this.refuid = 0;
			this.refmap = {};
			this.search = {
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				facets: {}
			};
			this.defaultClause = this.addClause();
		},
		setPage: function(page) {
			this.search.from = this.config.size * (page - 1) + 1;
		},
		addClause: function(value, field, op, bool) {
			bool = bool || "should";
			op = op || "match_all";
			field = field || "_all";
			var clause = this._setClause(value, field, op, bool);
			var uqid = "q-" + this.refuid++;
			this.refmap[uqid] = { clause: clause, value: value, field: field, op: op, bool: bool };
			if(this.search.query.bool.must.length + this.search.query.bool.should.length > 1) {
				this.removeClause(this.defaultClause);
			}
			this.fire("queryChanged", this, { uqid: uqid, search: this.search} );
			return uqid; // returns reference to inner query object to allow fast updating
		},
		removeClause: function(uqid) {
			var ref = this.refmap[uqid],
				bool = this.search.query.bool[ref.bool];
			bool.splice(bool.indexOf(ref.clause), 1);
		},
		_setClause: function(value, field, op, bool) {
			var clause = {}, query = {};
			if(op === "match_all") {
			} else if(op === "query_string") {
				query["default_field"] = field;
				query["query"] = value;
			} else {
				query[field] = value;
			}
			clause[op] = query;
			this.search.query.bool[bool].push(clause);
			return clause;
		},
		getData: function() {
			return JSON.stringify(this.search);
		}
	});

	es.ElasticSearchHead = acx.ui.Widget.extend({
		defaults: {
			base_uri: "http://localhost:9200/"   // the default ElasticSearch host
		},
		init: function(parent) {
			this._super();
			this.base_uri = localStorage["base_uri"] || this.config.base_uri;
			this.cluster = new es.Cluster({ base_uri: this.base_uri });
			this._initElements(parent);
		},
		
		open: function(widget, jEv) {
			var t = $(jEv.target).closest("DIV.es-header-menu-item").addClass("active").siblings().removeClass("active");
			this.el.find("#"+this.id("body")).empty().append(widget);
		},
		
		_openAnyRequest_handler: function(jEv) { this.open(new es.ui.AnyRequest({ cluster: this.cluster }), jEv);  },
		_openStructuredQuery_handler: function(jEv) { this.open(new es.StructuredQuery({ cluster: this.cluster, base_uri: this.base_uri }), jEv);  },
		_openBrowser_handler: function(jEv) { this.open(new es.ui.Browser({ cluster: this.cluster }), jEv);  },
		_openClusterHealth_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "_cluster/health" }), jEv); },
		_openClusterState_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "_cluster/state" }), jEv); },
		_openClusterNodes_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "_cluster/nodes", visualiser: es.ui.NodeVisualiser }), jEv); },
		_openClusterNodesStats_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "_cluster/nodes/stats" }), jEv); },
		_openStatus_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "_status" }), jEv); },
		_openInfo_handler: function(jEv) { this.open(new es.ui.SimpleGetQuery({ cluster: this.cluster, path: "" }), jEv); },
		
		_initElements: function(parent) {
			this.el = $(this._main_template());
			this.appendTo(parent);
		},

		_main_template: function() {
			return { tag: "DIV", cls: "es", children: [
				{ tag: "DIV", id: this.id("header"), cls: "es-header", children: [
					{ tag: "DIV", cls: "es-header-top", children: [
						new es.ClusterConnect({ base_uri: this.base_uri, onStatus: this._status_handler, onReconnect: this._reconnect_handler }),
						{ tag: "H1", text: "ElasticSearch" }
					]},
					{ tag: "DIV", cls: "es-header-menu", children: [
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: "Browser", onclick: this._openBrowser_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: "Structured Query", onclick: this._openStructuredQuery_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: "Any Request", onclick: this._openAnyRequest_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Cluster Health", onclick: this._openClusterHealth_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Cluster State", onclick: this._openClusterState_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Cluster Nodes", onclick: this._openClusterNodes_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Nodes Stats", onclick: this._openClusterNodesStats_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Status", onclick: this._openStatus_handler },
						{ tag: "DIV", cls: "es-header-menu-item es-right", text: "Info", onclick: this._openInfo_handler }
					]}
				]},
				{ tag: "DIV", id: this.id("body") }
			]};
		},
		
		_status_handler: function(status) {
			this.el.find(".es-header-menu-item:last").click();
		},
		_reconnect_handler: function(base_uri) {
			localStorage["base_uri"] = base_uri;
		}
	});
	
	es.AbstractQuery = acx.ui.Widget.extend({
		defaults: {
			base_uri: "http://localhost:9200/"   // the default ElasticSearch host
		},

		_request_handler: function(params) {
			$.ajax(acx.extend({
				url: this.config.base_uri + params.path,
				type: "POST",
				dataType: "json",
				error: function(xhr, type, message) {
					this.success({ "XHR Error": type, "message": message });
				}
			}, params));
		}
	});
	
	es.ClusterConnect = es.AbstractQuery.extend({
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.appendTo(parent);
			this.nameEl = this.el.find(".es-header-clusterName");
			this.statEl = this.el.find(".es-header-clusterStatus");
			this.statEl.text("cluster health: not connected").css("background", "red");
			this._request_handler({ type: "GET", path: "", success: this._node_handler });
			this._request_handler({	type: "GET", path: "_cluster/health", success: this._health_handler });
		},
		
		_node_handler: function(data) {
			this.nameEl.text(data.name);
		},
		
		_health_handler: function(data) {
			this.statEl.text("cluster health: " + data.status + " (" + data.number_of_nodes + ", " + data.active_primary_shards + ")").css("background", data.status);
			if(data.status === 'green' || data.status === 'yellow') {
				this.fire("status", data.status);
			}
		},
		
		_reconnect_handler: function() {
			var base_uri = this.el.find(".es-header-uri").val();
			this.fire("reconnect", base_uri);
			$("body").empty().append(new es.ElasticSearchHead("body", { id: "es", base_uri: base_uri }));
		},
		
		_main_template: function() {
			return { tag: "SPAN", cls: "es-cluster", children: [
				{ tag: "INPUT", type: "text", cls: "es-header-uri", id: this.id("baseUri"), value: this.config.base_uri },
				{ tag: "BUTTON", type: "button", text: "Connect", onclick: this._reconnect_handler },
				{ tag: "SPAN", cls: "es-header-clusterName" },
				{ tag: "SPAN", cls: "es-header-clusterStatus" }
			]};
		}
	});

	es.StructuredQuery = es.AbstractQuery.extend({
		defaults: {
			cluster: null  // (required) instanceof es.Cluster
		},
		init: function(parent) {
			this._super();
			this.selector = new es.IndexSelector({
				onIndexChanged: this._indexChanged_handler,
				base_uri: this.config.base_uri
			});
			this.el = $(this._main_template());
			this.out = this.el.find("DIV.es-out");
			this.appendTo(parent);
		},
		
		_indexChanged_handler: function(index) {
			this.filter && this.filter.remove();
			this.filter = new es.FilterBrowser({
				cluster: this.config.cluster,
				base_uri: this.config.base_uri,
				index: index,
				onStaringSearch: function() { this.el.find("DIV.es-out").text("Searching..."); this.el.find("DIV.es-searchSource").hide(); }.bind(this),
				onSearchSource: this._searchSource_handler,
				onJsonResults: this._jsonResults_handler,
				onTableResults: this._tableResults_handler
			});
			this.el.find(".es-structuredQuery-body").append(this.filter);
		},
		
		_jsonResults_handler: function(results) {
			this.el.find("DIV.es-out").empty().append(new es.JsonPretty({ obj: results }));
		},
		
		_tableResults_handler: function(results, metadata) {
			// hack up a QueryDataSourceInterface so that StructuredQuery keeps working without using an es.Query object
			var qdi = new es.QueryDataSourceInterface( { metadata: metadata, query: new es.Query });
			var tab = new acx.ui.Table( {
				store: qdi,
				height: 400,
				width: this.out.innerWidth()
			} ).appendTo(this.out.empty());
			qdi._results_handler(qdi.config.query, results);
		},
		
		_searchSource_handler: function(src) {
			this.el.find("DIV.es-searchSource").empty().append(new es.JsonPretty({ obj: src })).show();
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				this.selector,
				{ tag: "DIV", cls: "es-structuredQuery-body" },
				{ tag: "DIV", cls: "es-searchSource", css: { display: "none" } },
				{ tag: "DIV", cls: "es-out" }
			]};
		}
	});
	
	es.FilterBrowser = es.AbstractQuery.extend({
		defaults: {
			cluster: null,  // (required) instanceof es.Cluster
			index: "" // (required) name of the index to query
		},

		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.filtersEl = this.el.find(".es-filterBrowser-filters");
			this.appendTo(parent);
			new es.MetaDataFactory({ cluster: this.config.cluster, onReady: function(metadata, eventData) {
				this.metadata = metadata;
				this._createFilters_handler(eventData.originalData.metadata.indices);
			}.bind(this) });
		},

		_createFilters_handler: function(data) {
			var filters = this.filters = [ { path: ["match_all"], type: "match_all", meta: {} }, { path: ["_all"], type: "_all", meta: {}} ];
			function scan_properties(path, obj) {
				if(obj.properties) {
					for(var prop in obj.properties) {
						scan_properties(path.concat(prop), obj.properties[prop]);
					}
				} else {
					filters.push( { path: path, type: obj.type, meta: obj } );
				}
			}
			for(var type in data[this.config.index].mappings) {
				scan_properties([type], data[this.config.index].mappings[type]);
			}
			this._addFilterRow_handler();
		},
		
		_addFilterRow_handler: function() {
			this.filtersEl.append(this._filter_template());
		},
		
		_removeFilterRow_handler: function(jEv) {
			$(jEv.target).closest("DIV.es-filterBrowser-row").remove();
			if(this.filtersEl.children().length === 0) {
				this._addFilterRow_handler();
			}
		},
		
		_search_handler: function() {
			var search = new es.BoolQuery();
			this.fire("staringSearch");
			this.filtersEl.find(".es-filterBrowser-row").each(function(i, row) {
				var row = $(row);
				var bool = row.find(".es-bool").val();
				var field = row.find(".es-field").val();
				var op = row.find(".es-op").val();
				var value = {};
				if(field === "match_all") {
					op = "match_all";
				} else if(op === "range") {
					var lowqual = row.find(".es-lowqual").val(),
						highqual = row.find(".es-highqual").val();
					if(lowqual.length) value[row.find(".es-lowop").val()] = lowqual;
					if(highqual.length) value[row.find(".es-highop").val()] = highqual;
				} else {
					value = row.find(".es-qual").val();
				}
				search.addClause(value, field, op, bool);
			});
			if(this.el.find(".es-filterBrowser-showSrc").attr("checked")) {
				this.fire("searchSource", search.search);
			}
			this._request_handler({
				path: this.config.index + "/_search",
				data: search.getData(),
				success: this._results_handler
			});
		},
		
		_results_handler: function(data) {
			if(this.el.find(".es-filterBrowser-outputFormat").val() === "Table") {
				this.fire("tableResults", data, this.metadata);
			} else {
				this.fire("jsonResults", data);
			}
		},
		
		_changeQueryField_handler: function(jEv) {
			var select = $(jEv.target);
			var spec = select.children(":selected").data("spec");
			select.siblings().remove(".es-op,.es-qual,.es-range");
			var ops = [];
			if(spec.type === 'match_all') {
			} else if(spec.type === '_all') {
				ops = ["query_string"];
			} else if(spec.type === 'string') {
				ops = ["term", "wildcard", "prefix", "fuzzy", "range", "query_string"];
			} else if(spec.type === 'number') {
				ops = ["range"];
			} else if(spec.type === 'date') {
				ops = ["range"];
			}
			select.after({ tag: "SELECT", cls: "es-op", onchange: this._changeQueryOp_handler, children: ops.map(acx.ut.option_template) });
			select.next().change();
		},
		
		_changeQueryOp_handler: function(jEv) {
			var op = $(jEv.target), opv = op.val();
			op.siblings().remove(".es-qual,.es-range");
			if(opv === 'term' || opv === 'wildcard' || opv === 'prefix' || opv === 'fuzzy' || opv === "query_string") {
				op.after({ tag: "INPUT", cls: "es-qual", type: "text" })
			} else if(opv === 'range') {
				op.after(this._range_template());
			}
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				{ tag: "DIV", cls: "es-filterBrowser-filters" },
				{ tag: "BUTTON", type: "button", text: "Search", onclick: this._search_handler },
				{ tag: "LABEL", children: [
					"Output Results: ",
					{ tag: "SELECT", cls: "es-filterBrowser-outputFormat", children: ["Table", "JSON"].map(acx.ut.option_template) }
				]},
				{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", cls: "es-filterBrowser-showSrc" }, "Show query source" ] }
			]}
		},
		
		_filter_template: function() {
			return { tag: "DIV", cls: "es-filterBrowser-row", children: [
				{ tag: "SELECT", cls: "es-bool", children: ["must", "must_not", "should"].map(acx.ut.option_template) },
				{ tag: "SELECT", cls: "es-field", onchange: this._changeQueryField_handler, children: this.filters.map(function(f) {
					return { tag: "OPTION", data: { spec: f }, value: f.path[f.path.length-1], text: f.path.join(".") };
				})},
				{ tag: "BUTTON", type: "button", text: "+", onclick: this._addFilterRow_handler },
				{ tag: "BUTTON", type: "button", text: "-", onclick: this._removeFilterRow_handler }
			]};
		},
		
		_range_template: function() {
			return { tag: "SPAN", cls: "es-range", children: [
				{ tag: "SELECT", cls: "es-lowop", children: ["from", "gt", "gte"].map(acx.ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-lowqual" },
				{ tag: "SELECT", cls: "es-highop", children: ["to", "lt", "lte"].map(acx.ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-highqual" },
			]};
		}
	});
	
	es.IndexSelector = es.AbstractQuery.extend({
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.appendTo(parent);
			this.update();
		},
		update: function() {
			this._request_handler({
				type: "GET",
				path: "_status",
				success: this._update_handler
			});
		},
		
		_update_handler: function(data) {
			var options = [];
			for(var name in data.indices) { options.push(this._option_template(name, data.indices[name])); }
			this.el.find(".es-indexSelector-select").empty().append(this._select_template(options));
			this._indexChanged_handler();
		},
		
		_main_template: function() {
			return { tag: "DIV", cls: "es-indexSelector", children: [ 
				"Search ",
				{ tag: "SPAN", cls: "es-indexSelector-select" },
				" for documents where:"
			] };
		},

		_indexChanged_handler: function() {
			this.fire("indexChanged", this.el.find("SELECT").val());
		},

		_select_template: function(options) {
			return { tag: "SELECT", children: options, onChange: this._indexChanged_handler };
		},
		
		_option_template: function(name, index) {
			return  { tag: "OPTION", value: name, text: name + " (" + index.docs.num_docs + " docs)" };
		}
	});
	
})();













