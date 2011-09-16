(function() {
	var es = window.es;

	es.ui = {};

	es.ui.HelpPanel = acx.ui.InfoPanel.extend({
		defaults: {
			ref: "",
			open: true,
			autoRemove: true,
			modal: false,
			width: 500,
			height: 450,
			title: "Help"
		},
		init: function() {
			this._super();
			this.body.append(acx.text(this.config.ref));
		}
	});

	es.ui.JsonPanel = acx.ui.InfoPanel.extend({
		defaults: {
			json: null, // (required)
			modal: false,
			open: true,
			autoRemove: true,
			height: 500,
			width: 600
		},
		_body_template: function() {
			body = this._super();
			body.child = new es.JsonPretty({ obj: this.config.json });
			return body;
		}
	});

	es.ui.SidebarSection = acx.ui.Widget.extend({
		defaults: {
			title: "",
			help: null,
			body: null,
			open: false
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.body = this.el.children(".sidebarSection-body");
			this.config.open && ( this.el.addClass("shown") && this.body.css("display", "block") );
		},
		_showSection_handler: function(jEv) {
			var shown = $(jEv.target).closest(".sidebarSection")
				.toggleClass("shown")
					.children(".sidebarSection-body").slideToggle(200, function() { this.fire("animComplete", this); }.bind(this))
				.end()
				.hasClass("shown");
			this.fire(shown ? "show" : "hide", this);
		},
		_showHelp_handler: function(jEv) {
			new es.ui.HelpPanel({ref: this.config.help});
			jEv.stopPropagation();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "sidebarSection", children: [
				(this.config.title && { tag: "DIV", cls: "sidebarSection-head", onclick: this._showSection_handler, children: [
					this.config.title,
					( this.config.help && { tag: "SPAN", cls: "sidebarSection-help textLink es-right", onclick: this._showHelp_handler, text: "?" } )
				] }),
				{ tag: "DIV", cls: "sidebarSection-body", child: this.config.body }
			] }
		); }
	});

	es.ui.Table = acx.ui.Table.extend({
		defaults: {
			width: 500,
			height: 400
		},
		init: function() {
			this._super();
			this.on("rowClick", this._showPreview_handler);
			this.selectedRow = null;
			$(document).bind("keydown", this._nav_handler);
		},
		remove: function() {
			$(document).unbind("keydown", this._nav_handler);
			this._super();
		},
		appendTo: function(parent) {
			if(parent) {
				var height = parent.height() || ( $(document).height() - parent.offset().top - 41 ); // 41 = height in px of .uiTable-tools + uiTable-header
				var width = parent.width();
				this.el.width( width );
				this.body.width( width ).height( height );
			}
			this._super(parent);
		},
		showPreview: function(row) {
			row.addClass("selected");
			this.preview = new es.ui.JsonPanel({
				title: acx.text("Browser.ResultSourcePanelTitle"),
				json: row.data("row")._source,
				onClose: function() { row.removeClass("selected"); }
			});
		},
		_nav_handler: function(jEv) {
			if(jEv.keyCode !== 40 && jEv.keyCode !== 38) return;
			this.selectedRow && this.preview.remove();
			if(jEv.keyCode === 40) { // up arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.next("TR") : this.body.find("TR:first");
			} else if(jEv.keyCode === 38) { // down arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.prev("TR") : this.body.find("TR:last");
			}
			this.selectedRow && this.showPreview(this.selectedRow);
		},
		_showPreview_handler: function(obj, data) {
			this.showPreview(this.selectedRow = data.row);
		}
	});

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
		helpTypeMap: {
			"date" : "QueryFilter.DateRangeHelp"
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
			var selected = jEl.hasClass("selected");
			this.query.setIndex(jEl.text(), selected);
			if(selected) {
				var types = this.metadata.getTypes(this.query.indices);
				this.el.find("DIV.queryFilter-type.selected").each(function(n, el) {
					if(! types.contains($(el).text())) {
						$(el).click();
					}
				});
			}
			this.requestUpdate(jEv);
		},
		_selectType_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".queryFilter-type");
			jEl.toggleClass("selected");
			var type = jEl.text(), selected = jEl.hasClass("selected");
			this.query.setType(type, selected);
			if(selected) {
				var indices = this.metadata.types[type].indices;
				// es throws a 500 if searching an index for a type it does not contain - so we prevent that
				this.el.find("DIV.queryFilter-index.selected").each(function(n, el) {
					if(! indices.contains($(el).text())) {
						$(el).click();
					}
				});
				// es throws a 500 if you specify types from different indicies with _all
				jEl.siblings(".queryFilter-type.selected").forEach(function(el) {
					if(this.metadata.types[$(el).text()].indices.intersection(indices).length === 0) {
						$(el).click();
					}
				}, this);
			}
			this.requestUpdate(jEv);
		},
		_openFilter_handler: function(section) {
			var field_name = section.config.title;
			if(! section.loaded) {
				var spec = this.metadata.fields[field_name];
				if(spec.core_type === "string") {
					section.body.append(this._textFilter_template(spec));
				} else if(spec.core_type === "date") {
					section.body.append(this._dateFilter_template(spec));
					section.body.append(new es.ui.DateHistogram({ printEl: section.body.find("INPUT"), cluster: this.cluster, query: this.query, spec: spec }));
				} else if(spec.core_type === "number") {
					section.body.append(this._numericFilter_template(spec));
				}
				section.loaded = true;
			}
			section.on("animComplete", function(section) { section.body.find("INPUT").focus(); });
		},
		_textFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqids = jEl.data("uqids") || [];
			uqids.forEach(function(uqid) {
				uqid && this.query.removeClause(uqid);
			}, this);
			if(val.length) {
				if(jEl[0] === document.activeElement && jEl[0].selectionStart === jEl[0].selectionEnd) {
					val = val.replace(new RegExp("(.{"+jEl[0].selectionStart+"})"), "$&*");
				}
				uqids = val.split(/\s+/).map(function(term) {
					return term && this.query.addClause(term, spec.field_name, "wildcard", "must");
				}, this);
			}
			jEl.data("uqids", uqids);
			this.requestUpdate(jEv);
		},
		_dateFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			var range = window.dateRangeParser.parse(val);
			var lastRange = jEl.data("lastRange");
			if(!range || (lastRange && lastRange.start === range.start && lastRange.end === range.end))
				return;
			uqid && this.query.removeClause(uqid);
			if((range.start && range.end) === null) {
				uqid = null;
			} else {
				var value = {};	if(range.start) value.gte = range.start; if(range.end) value.lte = range.end;
				uqid = this.query.addClause( value, spec.field_name, "range", "must");
			}
			jEl.data("lastRange", range);
			jEl.siblings(".queryFilter-rangeHintFrom")
						.text(acx.text("QueryFilter.DateRangeHint.from", range.start && new Date(range.start).toUTCString()));
			jEl.siblings(".queryFilter-rangeHintTo")
						.text(acx.text("QueryFilter.DateRangeHint.to", range.end && new Date(range.end).toUTCString()));
			jEl.data("uqid", uqid);
			this.requestUpdate(jEv);
		},
		_numericFilterChange_handler: function(jEv) {
			var jEl = $(jEv.target).closest("INPUT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			var lastRange = jEl.data("lastRange");
			var range = (function(val) {
				var ops = val.split(/->|<>|</).map( function(v) { return parseInt(v.trim(), 10); });
				if(/<>/.test(val)) {
					return { gte: (ops[0] - ops[1]), lte: (ops[0] + ops[1]) };
				} else if(/->|</.test(val)) {
					return { gte: ops[0], lte: ops[1] };
				} else {
					return { gte: ops[0], lte: ops[0] };
				}
			})(val || "");
			if(!range || (lastRange && lastRange.lte === range.lte && lastRange.gte === range.gte))
				return;
			jEl.data("lastRange", range);
			uqid && this.query.removeClause(uqid);
			uqid = this.query.addClause( range, spec.field_name, "range", "must");
			jEl.data("uqid", uqid);
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
					return new es.ui.SidebarSection({
						title: name,
						help: this.helpTypeMap[data.type],
						onShow: this._openFilter_handler
					})
				}, this ) }
			] };
		},
		_textFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._textFilterChange_handler };
		},
		_dateFilter_template: function(spec) {
			return { tag: "DIV", children: [
				{ tag: "INPUT", data: { spec: spec }, onKeyup: this._dateFilterChange_handler },
				{ tag: "PRE", cls: "hint queryFilter-rangeHintFrom", text: acx.text("QueryFilter.DateRangeHint.from", "")},
				{ tag: "PRE", cls: "hint queryFilter-rangeHintTo", text: acx.text("QueryFilter.DateRangeHint.to", "") }
			]};
		},
		_numericFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._numericFilterChange_handler };
		}
	});

	es.ui.Page = acx.ui.Widget.extend({
		show: function() {
			this.el.show();
		},
		hide: function() {
			this.el.hide();
		}
	});

	es.ui.Browser = es.ui.Page.extend({
		defaults: {
			cluster: null  // (required) instanceof es.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.query = new es.Query( { cluster: this.cluster } );
			this._refreshButton = new acx.ui.Button({
  			label: "Refresh",
				onclick: function( btn ) {
					this.query.query();
				}.bind(this)
			});
			this.el = $(this._main_template());
			new es.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new es.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.queryFilter = new es.ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.appendTo(this.el.find("> .browser-filter") );
					this.resultTable = new es.ui.Table( {
						onHeaderClick: this._changeSort_handler,
						store: this.store
					} );
					this.resultTable.appendTo( this.el.find("> .browser-table") );
					this.updateResults();
				}.bind(this)
			})
		},
		updateResults: function() {
			this.query.query();
		},
		_changeSort_handler: function(table, wEv) {
			this.query.setSort(wEv.column, wEv.dir === "desc");
			this.query.setPage(1);
			this.query.query();
		},
		_main_template: function() {
			return { tag: "DIV", cls: "browser", children: [
				new acx.ui.Toolbar({
					label: "Browser",
					left: [ ],
					right: [ this._refreshButton ]
				}),
				{ tag: "DIV", cls: "browser-filter" },
				{ tag: "DIV", cls: "browser-table" }
			] };
		}
	});

	es.ui.AnyRequest = es.ui.Page.extend({
		defaults: {
			cluster: null,       // (required) instanceof es.Cluster
			path: "_search",     // default uri to send a request to
			query: { query: { match_all: { }}},
			transform: "  return root;" // default transformer function (does nothing)
		},
		init: function(parent) {
			this._super();
			this.history = es.storage.get("anyRequestHistory") || [ { type: "POST", path: this.config.path, query : JSON.stringify(this.config.query), transform: this.config.transform } ];
			this.el = $(this._main_template());
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
			this.outEl = this.el.find("DIV.anyRequest-out");
			this.errEl = this.el.find("DIV.anyRequest-jsonErr");
			this.appendTo(parent);
			this.setHistoryItem(this.history[this.history.length - 1]);
		},
		setHistoryItem: function(item) {
			this.pathEl.val(item.path);
			this.typeEl.val(item.type);
			this.dataEl.val(item.query);
			this.transformEl.val(item.transform);
		},
		_request_handler: function(jEv) {
			if(! this._validateJson_handler()) return;
			if(jEv && jEv.originalEvent) { // if the user click request
				if(this.timer) {
					window.clearTimeout(this.timer); // stop any cron jobs
				}
				delete this.prevData; // remove data from previous cron runs
				this.outEl.text(acx.text("AnyRequest.Requesting"));
				var path = this.pathEl.val(),
						type = this.typeEl.val(),
						query = JSON.stringify(JSON.parse(this.dataEl.val())),
						transform = this.transformEl.val();
				for(var i = 0; i < this.history.length; i++) {
					if(this.history[i].path === path
							&& this.history[i].type === type
							&& this.history[i].query === query
							&& this.history[i].transform === transform) {
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
				es.storage.set("anyRequestHistory", this.history);
				this.el.find("UL.anyRequest-history")
					.empty()
					.append($( { tag: "UL", children: this.history.map(this._historyItem_template, this) }).children())
					.children().find(":last-child").each(function(i, j) { j.scrollIntoView(false); }).end()
					.scrollLeft(0);
			}
			this.config.cluster.request({
				url: this.base_uriEl.val() + path,
				type: type,
				data: query,
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
			if(this.asGraphEl.attr("checked")) {
				var w = this.outEl.width();
				Raphael(this.outEl[0], w - 10, 300)
					.g.barchart(10, 10, w - 20, 280, [data]);
			}
			if(this.asTableEl.attr("checked")) {
				try {
					var store = new es.ResultDataSourceInterface();
					this.outEl.append(new es.ui.Table({
						width: this.outEl.width() - 23,
						store: store
					} ) );
					store.results(data);
				} catch(e) {
					this.errEl.text("Results Table Failed: " + e.message);
				}
			}
			if(this.asJsonEl.attr("checked")) {
				this.outEl.append(new es.JsonPretty({ obj: data }));
			}
			if(this.cronEl.val() > 0) {
				this.timer = window.setTimeout(function(){
					this._request_handler();
				}.bind(this), this.cronEl.val());
			}
			this.prevData = data;
		},
		_validateJson_handler: function(jEv) {
			/* if the textarea is empty, we replace its value by an empty JSON object : "{}" and the request goes on as usual */
			var jsonData = this.dataEl.val().trim();
			if (jsonData == "") {
				jsonData = "{}";
				this.dataEl.val( jsonData );
			}

			try {				
				var j = JSON.parse(jsonData);
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
			$(jEv.target).closest(".sidebar-section").children(".sidebar-subbody").slideToggle(200);
		},
		_historyClick_handler: function(jEv) {
			var item = $(jEv.target).closest("LI").data("item");
			this.setHistoryItem(item);
		},
		_main_template: function() {
			return { tag: "DIV", cls: "anyRequest", children: [
				{ tag: "DIV", cls: "anyRequest-request", children: [
					new es.ui.SidebarSection({
						open: false,
						title: acx.text("AnyRequest.History"),
						body: { tag: "UL", onclick: this._historyClick_handler, cls: "anyRequest-history", children: this.history.map(this._historyItem_template, this)	}
					}),
					new es.ui.SidebarSection({
						open: true,
						title: acx.text("AnyRequest.Query"),
						body: { tag: "DIV", children: [
							{ tag: "INPUT", type: "text", name: "base_uri", value: this.config.cluster.config.base_uri },
							{ tag: "BR" },
							{ tag: "INPUT", type: "text", name: "path", value: this.config.path },
							{ tag: "SELECT", name: "method", children: ["POST", "GET", "PUT", "DELETE"].map(acx.ut.option_template) },
							{ tag: "TEXTAREA", name: "body", rows: 20, text: JSON.stringify(this.config.query) },
		  				{ tag: "BUTTON", css: { cssFloat: "right" }, type: "button", child: { tag: "B", text: acx.text("AnyRequest.Request") }, onclick: this._request_handler },
							{ tag: "BUTTON", type: "button", text: acx.text("AnyRequest.ValidateJSON"), onclick: this._validateJson_handler },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "pretty" }, acx.text("AnyRequest.Pretty") ] },
							{ tag: "DIV", cls: "anyRequest-jsonErr" }
						]}
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.Transformer"),
						help: "AnyRequest.TransformerHelp",
						body: { tag: "DIV", children: [
						  { tag: "CODE", text: "function(root, prev) {" },
							{ tag: "BR" },
							{ tag: "TEXTAREA", name: "transform", rows: 5, text: this.config.transform },
							{ tag: "BR" },
							{ tag: "CODE", text: "}" }
						] }
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.RepeatRequest"),
						body: { tag: "DIV", children: [
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
					}),
					new es.ui.SidebarSection({
						title: acx.text("AnyRequest.DisplayOptions"),
						help: "AnyRequest.DisplayOptionsHelp",
						body: { tag: "DIV", children: [
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", checked: true, name: "asJson" }, acx.text("AnyRequest.AsJson") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asGraph" }, acx.text("AnyRequest.AsGraph") ] },
							{ tag: "BR" },
							{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", name: "asTable" }, acx.text("AnyRequest.AsTable") ] }
						] }
					})
				] },
				{ tag: "DIV", cls: "anyRequest-out" }
			] };
		},
		_historyItem_template: function(item) {
			return { tag: "LI", cls: "booble", data: { item: item }, children: [
				{ tag: "SPAN", text: item.path },
				" ",
				{ tag: "EM", text: item.query },
				" ",
				{ tag: "SPAN", text: item.transform }
			] }
		}
	});
	
	es.ui.SimpleGetQuery = acx.ui.Widget.extend({
		defaults: {
//		cluster: null,	// (required) instance of es.Cluster
//		path: "",		 		// (required) path to request
		},
		
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.config.cluster.get(this.config.path, this._update_handler);
		},
		
		_update_handler: function(data) {
			this.el.find("> .simpleGetQuery-out").empty().append(new es.JsonPretty({ obj: data }));
		},

		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "simpleGetQuery", children: [
				{ tag: "DIV", cls: "simpleGetQuery-out" }
			] };
		}
	});

	es.ui.ClusterOverview = es.ui.Page.extend({
		defaults: {
			cluster: null // (reqired) an instanceof es.Cluster
		},
		init: function() {
			this._super();
			this._refreshButton = new acx.ui.Button({
  			label: "Refresh",
				onclick: function( btn ) {
					this.redraw("reset");
				}.bind(this)
			});

			this.el = $(this._main_template());
			this.tablEl = this.el.find(".clusterOverview-table");
			this.cluster = this.config.cluster;
			this.redraw("reset");
		},
		redraw: function(command) {
			if(command === "reset") {
				this._refreshButton.disable();
				this.clusterState = null;
				this.status = null;
				this.nodeStats = null;
				this.clusterNodes = null;
				this.cluster.get("_cluster/state", this._clusterState_handler);
				this.cluster.get("_status", this._status_handler);
				this.cluster.get("_cluster/nodes", this._clusterNodes_handler);
				this.cluster.get("_cluster/nodes/stats", this._clusterNodeStats_handler);
			} else if(this.status && this.clusterState && this.nodeStats && this.clusterNodes) {
				var clusterState = this.clusterState;
				var status = this.status;
				var nodeStats = this.nodeStats;
				var clusterNodes = this.clusterNodes;
				var nodes = [];
				var indices = [];
				var cluster = { nodes: nodes };
				var nodeIndices = {};
				var indexIndices = {}, indexIndicesIndex = 0;
				function newNode(n) {
					return {
						name: n,
						routings: [],
						master_node: clusterState.master_node === n
					};
				}
				function newIndex(i) {
					return {
						name: i,
						replicas: []
					};
				}
				function getIndexForNode(n) {
					return nodeIndices[n] = (n in nodeIndices) ? nodeIndices[n] : nodes.push(newNode(n)) - 1;
				}
				function getIndexForIndex(routings, i) {
					var index = indexIndices[i] = (i in indexIndices) ?
							(routings[indexIndices[i]] = routings[indexIndices[i]] || newIndex(i)) && indexIndices[i]
							: ( ( routings[indexIndicesIndex] = newIndex(i) )  && indexIndicesIndex++ );
					indices[index] = i;
					return index;
				}
				acx.each(clusterNodes.nodes, function(name, node) {
					getIndexForNode(name);
				});
				acx.each(clusterState.routing_table.indices, function(name, index){
					acx.each(index.shards, function(name, shard) {
						shard.forEach(function(replica){
							var node = replica.node;
							if(node === null) { node = "Unassigned" }
							var index = replica.index;
							var shard = replica.shard;
							var routings = nodes[getIndexForNode(node)].routings;
							var indexIndex = getIndexForIndex(routings, index);
							var replicas = routings[indexIndex].replicas;
							if(node === "Unassigned") {
								replicas.push({ replica: replica });
							} else {
								replicas[shard] = {
									replica: replica,
									status: status.indices[index].shards[shard].filter(function(replica) {
										return replica.routing.node === node;
									})[0]
								};
							}
						});
					});
				});
				var indices = indices.map(function(index){
					return {
						name: index,
						state: "open",
						metadata: clusterState.metadata.indices[index],
						status: status.indices[index]
					}
				}, this);
				acx.each(clusterState.metadata.indices, function(name, index) {
					if(index.state === "close") {
						indices.push({
							name: name,
							state: "close",
							metadata: index,
							status: null
						})
					}
				});
				cluster.nodes.forEach(function(node) {
					node.stats = nodeStats.nodes[node.name];
					node.cluster = clusterNodes.nodes[node.name];
					for(var i = 0; i < indices.length; i++) {
						node.routings[i] = node.routings[i] || { name: indices[i].name, replicas: [] };
						node.routings[i].max_number_of_shards = indices[i].metadata.settings["index.number_of_shards"];
						node.routings[i].open = indices[i].state === "open";
					}
				});
				var aliasesIndex = {};
				var aliases = [];
				var indexClone = indices.map(function() { return false; });
				acx.each(clusterState.metadata.indices, function(name, index) {
					index.aliases.forEach(function(alias) {
						var aliasIndex = aliasesIndex[alias] = (alias in aliasesIndex) ? aliasesIndex[alias] : aliases.push( { name: alias, max: -1, min: 999, indices: [].concat(indexClone) }) - 1;
						var indexIndex = indexIndices[name];
						var aliasRow = aliases[aliasIndex];
						aliasRow.min = Math.min(aliasRow.min, indexIndex);
						aliasRow.max = Math.max(aliasRow.max, indexIndex);
						aliasRow.indices[indexIndex] = indices[indexIndex];
					});
				});
				cluster.aliases = aliases;
				indices.unshift({ name: null });
				this.tablEl.empty().append(this._cluster_template(cluster, indices));
				this._refreshButton.enable();
			}
		},
		_clusterState_handler: function(state) {
			this.clusterState = state;
			this.redraw("clusterState");
		},
		_status_handler: function(status) {
			this.status = status;
			this.redraw("status");
		},
		_clusterNodeStats_handler: function(stats) {
			this.nodeStats = stats;
			this.redraw("nodeStats");
		},
		_clusterNodes_handler: function(nodes) {
			this.clusterNodes = nodes;
			this.redraw("clusterNodes");
		},
		_newIndex_handler: function() {
			var fields = new acx.ux.FieldCollection({
				fields: [
					new acx.ui.TextField({ label: "Index Name", name: "_name", require: true }),
					new acx.ui.TextField({ label: "Number of Shards", name: "number_of_shards", value: "5", require: acx.val.isInt(1) }),
					new acx.ui.TextField({ label: "Number of Replicas", name: "number_of_replicas", value: "1", require: acx.val.isInt(0) })
				]
			});
			var dialog = new acx.ui.DialogPanel({
				title: "New Index",
				body: new acx.ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var name = data["_name"];
						delete data["_name"];
						this.config.cluster.put( name, JSON.stringify({ settings: { index: data } }), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_newAliasAction_handler: function(index) {
			var fields = new acx.ux.FieldCollection({
				fields: [
					new acx.ui.TextField({ label: "Alias Name", name: "alias", require: true })
				]
			});
			var dialog = new acx.ui.DialogPanel({
				title: "New Alias for " + index.name,
				body: new acx.ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var command = {
							"actions" : [
								{ "add" : { "index" : index.name, "alias" : data["alias"] } }
							]
						};
						this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_deleteIndexAction_handler: function(index) {
			if(prompt("type 'DELETE' to delete " + index.name + ". There is no undo") === "DELETE") {
				this.cluster["delete"](index.name, null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this) );
			}
		},
		_postIndexAction_handler: function(action, index, redraw) {
			this.cluster.post(index.name + "/" + action, null, function(r) {
				alert(JSON.stringify(r));
				redraw && this.redraw("reset");
			}.bind(this));
		},
		_testAnalyser_handler: function(index) {
			this.cluster.get(index.name + "/_analyze?text=" + prompt("Text to Analyse"), function(r) {
				alert(JSON.stringify(r, true, "  "));
			});
		},
		_showdownNode_handler: function(node) {
			if(prompt("type 'SHUTDOWN' to shutdown " + node.cluster.name + ". Node can NOT be restarted from this interface") === "SHUTDOWN") {
				this.cluster.post( "_cluster/nodes/" + node.name + "/_shutdown", null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this));
			}
		},
		_replica_template: function(replica) {
			var r = replica.replica;
			return { tag: "DIV",
				cls: "clusterOverview-replica" + (r.primary ? " primary" : "") + ( " state-" + r.state ),
				text: r.shard.toString(),
				onclick: function() { new es.ui.JsonPanel({
					json: replica.status || replica.replica,
					title: r.index + "/" + r.node + " [" + r.shard + "]" });
				}
			};
		},
		_routing_template: function(routing) {
			var cell = { tag: "TD", cls: "clusterOverview-routing" + (routing.open ? "" : " close"), children: [] };
			for(var i = 0; i < routing.replicas.length; i++) {
				if(i % routing.max_number_of_shards === 0 && i > 0) {
					cell.children.push({ tag: "BR" });
				}
				if( i in (routing.replicas))
					cell.children.push(this._replica_template(routing.replicas[i]));
				else
					cell.children.push( { tag: "DIV", cls: "clusterOverview-nullReplica" } );
			}
			return cell;
		},
		_node_template: function(node) {
			return { tag: "TR", cls: "clusterOverview-node" + (node.master_node ? " master": ""), children: [
				{ tag: "TH", children: node.name === "Unassigned" ? [
					{ tag: "DIV", cls: "clusterOverview-title", text: node.name }
				] : [
					{ tag: "DIV", children: [
						{ tag: "SPAN", cls: "clusterOverview-title", text: node.cluster.name },
						" ",
						{ tag: "SPAN", text: node.name }
					]},
					{ tag: "DIV", text: node.cluster.http_address },
					{ tag: "DIV", children: [
						new acx.ui.MenuButton({
							label: "Info",
							menu: new acx.ui.MenuPanel({
								items: [
									{ text: "Cluster Node Info", onclick: function() { new es.ui.JsonPanel({ json: node.cluster, title: node.name });} },
									{ text: "Node Stats", onclick: function() { new es.ui.JsonPanel({ json: node.stats, title: node.name });} }
								]
							})
						}),
						new acx.ui.MenuButton({
							label: "Actions",
							menu: new acx.ui.MenuPanel({
								items: [
									{ text: "Shutdown...", onclick: function() { this._showdownNode_handler(node); }.bind(this) }
								]
							})
						})
					] }
				] }
			].concat(node.routings.map(this._routing_template, this))};
		},
		_indexHeader_template: function(index) {
			var closed = index.state === "close";
			var line1 = closed ? "index: close" : ( "size: " + (index.status && index.status.index ? index.status.index.primary_size + " (" + index.status.index.size + ")" : "unknown" ) ); 
			var line2 = closed ? "\u00A0" : ( "docs: " + (index.status ? index.status.docs.num_docs + " (" + index.status.docs.max_doc + ")" : "unknown" ) );
			return index.name ? { tag: "TH", cls: (closed ? "close" : ""), children: [
				{ tag: "DIV", cls: "clusterOverview-title", text: index.name },
				{ tag: "DIV", text: line1 },
				{ tag: "DIV", text: line2 },
				{ tag: "DIV", children: [
					new acx.ui.MenuButton({
						label: "Info",
						menu: new acx.ui.MenuPanel({
							items: [
								{ text: "Index Status", onclick: function() { new es.ui.JsonPanel({ json: index.status, title: index.name }); } },
								{ text: "Index Metadata", onclick: function() { new es.ui.JsonPanel({ json: index.metadata, title: index.name }); } }
							]
						})
					}),
					new acx.ui.MenuButton({
						label: "Actions",
						menu: new acx.ui.MenuPanel({
							items: [
								{ text: "New Alias...", onclick: function() { this._newAliasAction_handler(index)}.bind(this) },
								{ text: "Refresh", onclick: function() { this._postIndexAction_handler("_refresh", index, false); }.bind(this) },
								{ text: "Flush", onclick: function() { this._postIndexAction_handler("_flush", index, false); }.bind(this) },
								{ text: "Gateway Snapshot", disabled: closed, onclick: function() { this._postIndexAction_handler("_gateway/snapshot", index, false); }.bind(this) },
								{ text: "Test Analyser", onclick: function() { this._testAnalyser_handler(index); }.bind(this) },
								{ text: closed ? "Open" : "Close", onclick: function() { this._postIndexAction_handler(closed ? "_open" : "_close", index, true); }.bind(this) },
								{ text: "Delete...", onclick: function() { this._deleteIndexAction_handler(index); }.bind(this) }
							]
						})
					})
				] }
			]} : { tag: "TH" };
		},
		_alias_template: function(alias, row) {
			return { tag: "TR", children: [ { tag: "TD"	} ].concat(alias.indices.map(function(index, i) {
				if (index) {
					return {
						tag: "TD",
						css: { background: "#" + "9ce9c7fc9".substr((row+6)%7,3) },
						cls: "clusterOverview-hasAlias" + ( alias.min == i ? " min" : "" ) + ( alias.max == i ? " max" : "" ),
						text: alias.name,
						children: [
							{	tag: 'SPAN',
								text: 'X',
								cls: 'clusterOverview-hasAlias-remove',
								onclick: function() {
									var command = {
										"actions" : [
											{ "remove" : { "index" : index.name, "alias" : alias.name } }
										]
									};
									this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
										alert(JSON.stringify(d));
										this.redraw("reset");
									}.bind(this) );
								}.bind(this)
							}
						]
					};
				}
				else {
					return { tag: "TD" };
				}
			},
			this)) };
		},
		_cluster_template: function(cluster, indices) {
			return { tag: "TABLE", cls: "clusterOverview-cluster", children: [
				{ tag: "THEAD", child: { tag: "TR", children: indices.map(this._indexHeader_template, this) } },
				cluster.aliases.length && { tag: "TBODY", children: cluster.aliases.map(this._alias_template, this) },
				{ tag: "TBODY", children: cluster.nodes.map(this._node_template, this) }
			] };
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "clusterOverview", children: [
				new acx.ui.Toolbar({
					label: acx.text("Overview.PageTitle"),
					left: [
						new acx.ui.Button({
							label: "New Index",
							onclick: this._newIndex_handler
						})
					],
					right: [
					  this._refreshButton
					]
				}),
				{ tag: "DIV", cls: "clusterOverview-table" }
			] };
		}
	});

	es.ui.DateHistogram = acx.ui.Widget.extend({
		defaults: {
			printEl: null, // (optional) if supplied, clicking on elements in the histogram changes the query
			cluster: null, // (required)
			query: null,   // (required) the current query
			spec: null     // (required) // date field spec
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.query = this.config.query.clone();
			// check if the index/types have changed and rebuild the histogram
			this.config.query.on("results", function(query) {
				if(this.queryChanged) {
					this.buildHistogram(query);
					this.queryChanged = false;
				}
			}.bind(this));
			this.config.query.on("setIndex", function(query, params) {
				this.query.setIndex(params.index, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.config.query.on("setType", function(query, params) {
				this.query.setType(params.type, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.query.search.size = 0;
			this.query.on("results", this._stat_handler);
			this.query.on("results", this._facet_handler);
			this.buildHistogram();
		},
		buildHistogram: function(query) {
			this.statFacet = this.query.addFacet({
				statistical: { field: this.config.spec.field_name },
				global: true
			});
			this.query.query();
			this.query.removeFacet(this.statFacet);
		},
		_stat_handler: function(query, results) {
			if(! results.facets[this.statFacet]) { return; }
			this.stats = results.facets[this.statFacet];
			// here we are calculating the approximate range  that will give us less than 121 columns
			var rangeNames = [ "year", "year", "month", "day", "hour", "minute" ];
			var rangeFactors = [100000, 12, 30, 24, 60, 60000 ];
			this.intervalRange = 1;
			var range = this.stats.max - this.stats.min;
			do {
				this.intervalName = rangeNames.pop();
				var factor = rangeFactors.pop();
				this.intervalRange *= factor
				range = range / factor;
			} while(range > 70);
			this.dateFacet = this.query.addFacet({
					date_histogram : {
						field: this.config.spec.field_name,
						interval: this.intervalName,
						global: true
					}
			});
			this.query.query();
			this.query.removeFacet(this.dateFacet);
		},
		_facet_handler: function(query, results) {
			if(! results.facets[this.dateFacet]) { return; }
			var buckets = [], range = this.intervalRange;
			var min = Math.floor(this.stats.min / range) * range;
			var prec = [ "year", "month", "day", "hour", "minute", "second" ].indexOf(this.intervalName);
			results.facets[this.dateFacet].entries.forEach(function(entry) {
				buckets[parseInt((entry.time - min) / range , 10)] = entry.count;
			}, this);
			for(var i = 0; i < buckets.length; i++) {
				buckets[i] = buckets[i] || 0;
			}
			this.el.removeClass("loading");
			var el = this.el.empty();
			var w = el.width(), h = el.height();
			var r = Raphael(el[0], w, h );
			var printEl = this.config.printEl;
			var query = this.config.query;
			r.g.barchart(0, 0, w, h, [buckets], { gutter: "0", vgutter: 0 }).hover(
				function() {
					this.flag = r.g.popup(this.bar.x, h - 5, this.value || "0").insertBefore(this);
				}, function() {
					this.flag.animate({opacity: 0}, 200, ">", function () {this.remove();});
				}
			).click(function() {
				if(printEl) {
					printEl.val(window.dateRangeParser.print(min + this.bar.index * range, prec));
					printEl.trigger("keyup");
					query.query();
				}
			});
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "dateHistogram loading", css: { height: "50px" }, children: [
				acx.text("General.LoadingFacets")
			] }
		); }
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
			base_uri: localStorage["base_uri"] || "http://localhost:9200/"   // the default ElasticSearch host
		},
		init: function(parent) {
			this._super();
			this.base_uri = this.config.base_uri;
			if (this.base_uri.charAt(this.base_uri.length-1) != "/") {
			    // XHR request fails if the URL is not ending with a "/"
			    this.base_uri += "/";
			}
			this.cluster = new es.Cluster({ base_uri: this.base_uri });
			this._initElements(parent);
			this.instances = {};
			this.quicks = {};
		},

		quick: function(title, path) {
			this.quicks[path] && this.quicks[path].remove();
			this.cluster.get(path, function(data) {
				this.quicks[path] = new es.ui.JsonPanel({ title: title, json: data });
			}.bind(this));
		},
		
		show: function(type, config, jEv) {
			if(! this.instances[type]) {
				var page = this.instances[type] = new es.ui[type](config);
				this.el.find("#"+this.id("body")).append( page );
			}
			$(jEv.target).closest("DIV.es-header-menu-item").addClass("active").siblings().removeClass("active");
			for(var p in this.instances) {
				this.instances[p][ p === type ? "show" : "hide" ]();
			}
		},

		_openAnyRequest_handler: function(jEv) { this.show("AnyRequest", { cluster: this.cluster }, jEv); },
		_openStructuredQuery_handler: function(jEv) { this.show("StructuredQuery", { cluster: this.cluster, base_uri: this.base_uri }, jEv); },
		_openBrowser_handler: function(jEv) { this.show("Browser", { cluster: this.cluster }, jEv);  },
		_openClusterHealth_handler: function(jEv) { this.quick( "Cluster Health", "_cluster/health" ); },
		_openClusterState_handler: function(jEv) { this.quick( "Cluster State", "_cluster/state" ); },
		_openClusterNodes_handler: function(jEv) { this.quick( "Cluster Nodes", "_cluster/nodes" ); },
		_openClusterNodesStats_handler: function(jEv) { this.quick( "Node Stats", "_cluster/nodes/stats" ); },
		_openStatus_handler: function(jEv) { this.quick( "Status", "_status" ); },
		_openInfo_handler: function(jEv) { this.quick( "Info", "" ); },
		_openClusterOverview_handler: function(jEv) { this.show("ClusterOverview", { cluster: this.cluster }, jEv); },

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
						{ tag: "DIV", cls: "es-header-menu-item es-left", text: "Overview", onclick: this._openClusterOverview_handler },
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
			this.el.find(".es-header-menu-item:first").click();
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
					alert($.parseJSON(xhr.responseText).error);
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
			if(data) {
				this.nameEl.text(data.name);
			}
		},
		
		_health_handler: function(data) {
			if(data) {
				this.statEl.text("cluster health: " + data.status + " (" + data.number_of_nodes + ", " + data.active_primary_shards + ")").css("background", data.status);
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

	es.ui.StructuredQuery = es.ui.Page.extend({
		init: function() {
			this.q = new es.StructuredQuery( this.config );
			this.el = this.q.el;
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
			var filters = [];
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

			filters.sort( function(a, b) {
				var x = a.path.join(".");
				var y = b.path.join(".");
				return (x < y) ? -1 : (x > y) ? 1 : 0;
			});

			this.filters = [
		 		{ path: ["match_all"], type: "match_all", meta: {} },
		 		{ path: ["_all"], type: "_all", meta: {}}
		 	].concat(filters);

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
				} else if(op === "fuzzy") {
					var qual = row.find(".es-qual").val(),
						fuzzyqual = row.find(".es-fuzzyqual").val();

					if(qual.length) value["value"] = qual;
					if(fuzzyqual.length) value[row.find(".es-fuzzyop").val()] = fuzzyqual;
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
			select.siblings().remove(".es-op,.es-qual,.es-range,.es-fuzzy");
			var ops = [];
			if(spec.type === 'match_all') {
			} else if(spec.type === '_all') {
				ops = ["query_string"];
			} else if(spec.type === 'string') {
				ops = ["term", "wildcard", "prefix", "fuzzy", "range", "query_string"];
			} else if(spec.type === 'long') {
				ops = ["term", "range", "fuzzy", "query_string"];
			} else if(spec.type === 'date') {
				ops = ["term", "range", "fuzzy", "query_string"];
			} else if(spec.type === 'ip') {
				ops = ["term", "range", "fuzzy", "query_string"];
			}
			select.after({ tag: "SELECT", cls: "es-op", onchange: this._changeQueryOp_handler, children: ops.map(acx.ut.option_template) });
			select.next().change();
		},
		
		_changeQueryOp_handler: function(jEv) {
			var op = $(jEv.target), opv = op.val();
			op.siblings().remove(".es-qual,.es-range,.es-fuzzy");
			if(opv === 'term' || opv === 'wildcard' || opv === 'prefix' || opv === "query_string") {
				op.after({ tag: "INPUT", cls: "es-qual", type: "text" })
			} else if(opv === 'range') {
				op.after(this._range_template());
			} else if(opv === 'fuzzy') {
				op.after(this._fuzzy_template());
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
		},

		_fuzzy_template: function() {
			return { tag: "SPAN", cls: "es-fuzzy", children: [
				{ tag: "INPUT", cls: "es-qual", type: "text" },
				{ tag: "SELECT", cls: "es-fuzzyop", children: ["max_expansions", "min_similarity"].map(acx.ut.option_template) },
				{ tag: "INPUT", cls: "es-fuzzyqual", type: "text" }
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

