(function( acx, raphael ) {

	window.es = {
		ui: {}
	};


	es.ui.StructuredQuery = app.ui.Page.extend({
		init: function() {
			this.q = new es.StructuredQuery( this.config );
			this.el = this.q.el;
		}
	});

	es.StructuredQuery = ui.AbstractQuery.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function(parent) {
			this._super();
			this.selector = new es.IndexSelector({
				onIndexChanged: this._indexChanged_handler,
				base_uri: this.config.base_uri
			});
			this.el = $(this._main_template());
			this.out = this.el.find("DIV.es-out");
			this.attach( parent );
		},
		
		_indexChanged_handler: function(index) {
			this.filter && this.filter.remove();
			this.filter = new es.FilterBrowser({
				cluster: this.config.cluster,
				base_uri: this.config.base_uri,
				index: index,
				onStaringSearch: function() { this.el.find("DIV.es-out").text( acx.text("General.Searching") ); this.el.find("DIV.es-searchSource").hide(); }.bind(this),
				onSearchSource: this._searchSource_handler,
				onJsonResults: this._jsonResults_handler,
				onTableResults: this._tableResults_handler
			});
			this.el.find(".es-structuredQuery-body").append(this.filter);
		},
		
		_jsonResults_handler: function(results) {
			this.el.find("DIV.es-out").empty().append( new app.ui.JsonPretty({ obj: results }));
		},
		
		_tableResults_handler: function(results, metadata) {
			// hack up a QueryDataSourceInterface so that StructuredQuery keeps working without using an es.Query object
			var qdi = new app.data.QueryDataSourceInterface({ metadata: metadata, query: new app.data.Query() });
			var tab = new app.ui.Table( {
				store: qdi,
				height: 400,
				width: this.out.innerWidth()
			} ).attach(this.out.empty());
			qdi._results_handler(qdi.config.query, results);
		},
		
		_showRawJSON : function() {
			if($("#rawJsonText").length === 0) {
				var hiddenButton = $("#showRawJSON");
				var jsonText = $({tag: "P", type: "p", id: "rawJsonText"});
				jsonText.text(hiddenButton[0].value);
				hiddenButton.parent().append(jsonText);
			}
		},
		
		_searchSource_handler: function(src) {
			var searchSourceDiv = this.el.find("DIV.es-searchSource");
			searchSourceDiv.empty().append(new app.ui.JsonPretty({ obj: src }));
			if(typeof JSON !== "undefined") {
				var showRawJSON = $({ tag: "BUTTON", type: "button", text: acx.text("StructuredQuery.ShowRawJson"), id: "showRawJSON", value: JSON.stringify(src), onclick: this._showRawJSON });
				searchSourceDiv.append(showRawJSON);
			}
			searchSourceDiv.show();
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

	es.FilterBrowser = ui.AbstractQuery.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			index: "" // (required) name of the index to query
		},

		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.filtersEl = this.el.find(".es-filterBrowser-filters");
			this.attach( parent );
			new app.data.MetaDataFactory({ cluster: this.config.cluster, onReady: function(metadata, eventData) {
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
			var search = new app.data.BoolQuery();
			this.fire("staringSearch");
			this.filtersEl.find(".es-filterBrowser-row").each(function(i, row) {
				row = $(row);
				var bool = row.find(".es-bool").val();
				var field = row.find(".es-field").val();
				var op = row.find(".es-op").val();
				var value = {};
				if(field === "match_all") {
					op = "match_all";
				} else if(op === "range") {
					var lowqual = row.find(".es-lowqual").val(),
						highqual = row.find(".es-highqual").val();
					if(lowqual.length) {
						value[row.find(".es-lowop").val()] = lowqual;
					}
					if(highqual.length) {
						value[row.find(".es-highop").val()] = highqual;
					}
				} else if(op === "fuzzy") {
					var qual = row.find(".es-qual").val(),
						fuzzyqual = row.find(".es-fuzzyqual").val();
					if(qual.length) {
						value["value"] = qual;
					}
					if(fuzzyqual.length) {
						value[row.find(".es-fuzzyop").val()] = fuzzyqual;
					}
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
				ops = ["term", "wildcard", "prefix", "fuzzy", "range", "query_string", "text"];
			} else if(spec.type === 'long' || spec.type === 'integer' || spec.type === 'float' ||
					spec.type === 'byte' || spec.type === 'short' || spec.type === 'double') {
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
			if(opv === 'term' || opv === 'wildcard' || opv === 'prefix' || opv === "query_string" || opv === 'text') {
				op.after({ tag: "INPUT", cls: "es-qual", type: "text" });
			} else if(opv === 'range') {
				op.after(this._range_template());
			} else if(opv === 'fuzzy') {
				op.after(this._fuzzy_template());
			}
		},
		
		_main_template: function() {
			return { tag: "DIV", children: [
				{ tag: "DIV", cls: "es-filterBrowser-filters" },
				{ tag: "BUTTON", type: "button", text: acx.text("General.Search"), onclick: this._search_handler },
				{ tag: "LABEL", children:
					acx.i18n.formatComplex("FilterBrowser.OutputType", { tag: "SELECT", cls: "es-filterBrowser-outputFormat", children: [ acx.text("Output.Table"), acx.text("Output.JSON")].map(acx.ut.option_template) } )
				},
				{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", cls: "es-filterBrowser-showSrc" }, acx.text("Output.ShowSource") ] }
			]};
		},
		
		_filter_template: function() {
			return { tag: "DIV", cls: "es-filterBrowser-row", children: [
				{ tag: "SELECT", cls: "es-bool", children: ["must", "must_not", "should"].map(acx.ut.option_template) },
				{ tag: "SELECT", cls: "es-field", onchange: this._changeQueryField_handler, children: this.filters.map(function(f) {
					return { tag: "OPTION", data: { spec: f }, value: f.path.join("."), text: f.path.join(".") };
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
				{ tag: "INPUT", type: "text", cls: "es-highqual" }
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
	
	es.IndexSelector = ui.AbstractQuery.extend({
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
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
			return { tag: "DIV", cls: "es-indexSelector", children: acx.i18n.formatComplex( "IndexSelector.SearchIndexForDocs", { tag: "SPAN", cls: "es-indexSelector-select" } ) };
		},

		_indexChanged_handler: function() {
			this.fire("indexChanged", this.el.find("SELECT").val());
		},

		_select_template: function(options) {
			return { tag: "SELECT", children: options, onChange: this._indexChanged_handler };
		},
		
		_option_template: function(name, index) {
			return  { tag: "OPTION", value: name, text: acx.text("IndexSelector.NameWithDocs", name, index.docs.num_docs ) };
		}
	});
	
})( window.acx, window.Raphael );

