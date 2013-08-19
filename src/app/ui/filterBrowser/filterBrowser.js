(function( $, app ) {

	var ui = app.ns("ui");
	var data = app.ns("data");
	var ut = app.ns("ut");

	ui.FilterBrowser = ui.AbstractQuery.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			index: "" // (required) name of the index to query
		},

		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.filtersEl = this.el.find(".uiFilterBrowser-filters");
			this.attach( parent );
			new data.MetaDataFactory({ cluster: this.config.cluster, onReady: function(metadata, eventData) {
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
			$(jEv.target).closest("DIV.uiFilterBrowser-row").remove();
			if(this.filtersEl.children().length === 0) {
				this._addFilterRow_handler();
			}
		},
		
		_search_handler: function() {
			var search = new data.BoolQuery();
			this.fire("staringSearch");
			this.filtersEl.find(".uiFilterBrowser-row").each(function(i, row) {
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
			if(this.el.find(".uiFilterBrowser-showSrc").attr("checked")) {
				this.fire("searchSource", search.search);
			}
			this._request_handler({
				path: this.config.index + "/_search",
				data: search.getData(),
				success: this._results_handler
			});
		},
		
		_results_handler: function(data) {
			if(this.el.find(".uiFilterBrowser-outputFormat").val() === "Table") {
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
			select.after({ tag: "SELECT", cls: "es-op", onchange: this._changeQueryOp_handler, children: ops.map(ut.option_template) });
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
				{ tag: "DIV", cls: "uiFilterBrowser-filters" },
				{ tag: "BUTTON", type: "button", text: i18n.text("General.Search"), onclick: this._search_handler },
				{ tag: "LABEL", children:
					i18n.complex("FilterBrowser.OutputType", { tag: "SELECT", cls: "uiFilterBrowser-outputFormat", children: [ i18n.text("Output.Table"), i18n.text("Output.JSON")].map(ut.option_template) } )
				},
				{ tag: "LABEL", children: [ { tag: "INPUT", type: "checkbox", cls: "uiFilterBrowser-showSrc" }, i18n.text("Output.ShowSource") ] }
			]};
		},
		
		_filter_template: function() {
			return { tag: "DIV", cls: "uiFilterBrowser-row", children: [
				{ tag: "SELECT", cls: "es-bool", children: ["must", "must_not", "should"].map(ut.option_template) },
				{ tag: "SELECT", cls: "es-field", onchange: this._changeQueryField_handler, children: this.filters.map(function(f) {
					return { tag: "OPTION", data: { spec: f }, value: f.path.join("."), text: f.path.join(".") };
				})},
				{ tag: "BUTTON", type: "button", text: "+", onclick: this._addFilterRow_handler },
				{ tag: "BUTTON", type: "button", text: "-", onclick: this._removeFilterRow_handler }
			]};
		},
		
		_range_template: function() {
			return { tag: "SPAN", cls: "es-range", children: [
				{ tag: "SELECT", cls: "es-lowop", children: ["from", "gt", "gte"].map(ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-lowqual" },
				{ tag: "SELECT", cls: "es-highop", children: ["to", "lt", "lte"].map(ut.option_template) },
				{ tag: "INPUT", type: "text", cls: "es-highqual" }
			]};
		},

		_fuzzy_template: function() {
			return { tag: "SPAN", cls: "es-fuzzy", children: [
				{ tag: "INPUT", cls: "es-qual", type: "text" },
				{ tag: "SELECT", cls: "es-fuzzyop", children: ["max_expansions", "min_similarity"].map(ut.option_template) },
				{ tag: "INPUT", cls: "es-fuzzyqual", type: "text" }
			]};
		}
	});
	
})( this.jQuery, this.app );