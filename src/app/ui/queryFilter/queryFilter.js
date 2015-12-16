(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.QueryFilter = ui.AbstractWidget.extend({
		defaults: {
			metadata: null,   // (required) instanceof app.data.MetaData
			query: null       // (required) instanceof app.data.Query that the filters will act apon
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
		getSpec: function(fieldName) {
			return this.metadata.fields[fieldName];
		},
		_selectAlias_handler: function(jEv) {
			var indices = (jEv.target.selectedIndex === 0) ? [] : this.metadata.getIndices($(jEv.target).val());
			$(".uiQueryFilter-index").each(function(i, el) {
				var jEl = $(el);
				if(indices.contains(jEl.text()) !== jEl.hasClass("selected")) {
					jEl.click();
				}
			});
			this.requestUpdate(jEv);
		},
		_selectIndex_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".uiQueryFilter-index");
			jEl.toggleClass("selected");
			var selected = jEl.hasClass("selected");
			this.query.setIndex(jEl.text(), selected);
			if(selected) {
				var types = this.metadata.getTypes(this.query.indices);
				this.el.find("DIV.uiQueryFilter-type.selected").each(function(n, el) {
					if(! types.contains($(el).text())) {
						$(el).click();
					}
				});
			}
			this.requestUpdate(jEv);
		},
		_selectType_handler: function(jEv) {
			var jEl = $(jEv.target).closest(".uiQueryFilter-type");
			jEl.toggleClass("selected");
			var type = jEl.text(), selected = jEl.hasClass("selected");
			this.query.setType(type, selected);
			if(selected) {
				var indices = this.metadata.types[type].indices;
				// es throws a 500 if searching an index for a type it does not contain - so we prevent that
				this.el.find("DIV.uiQueryFilter-index.selected").each(function(n, el) {
					if(! indices.contains($(el).text())) {
						$(el).click();
					}
				});
				// es throws a 500 if you specify types from different indices with _all
				jEl.siblings(".uiQueryFilter-type.selected").forEach(function(el) {
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
				var spec = this.getSpec(field_name);
				if(spec.core_type === "string") {
					section.body.append(this._textFilter_template(spec));
				} else if(spec.core_type === "date") {
					section.body.append(this._dateFilter_template(spec));
					section.body.append(new ui.DateHistogram({ printEl: section.body.find("INPUT"), cluster: this.cluster, query: this.query, spec: spec }));
				} else if(spec.core_type === "number") {
					section.body.append(this._numericFilter_template(spec));
				} else if(spec.core_type === 'boolean') {
					section.body.append(this._booleanFilter_template(spec));
				} else if (spec.core_type === 'multi_field') {
					section.body.append(this._multiFieldFilter_template(section, spec));
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
					// Figure out the actual field name - needed for multi_field, because
					// querying for "field.field" will not work. Simply "field" must be used
					// if nothing is aliased.
					var fieldNameParts = spec.field_name.split('.');
					var part = fieldNameParts.length - 1;
					var name = fieldNameParts[part];
					while (part >= 1) {
						if (fieldNameParts[part] !== fieldNameParts[part - 1]) {
							name = fieldNameParts[part - 1] + "." + name;
						}
						part--;
					}
					return term && this.query.addClause(term, name, "wildcard", "must");
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
			if(!range || (lastRange && lastRange.start === range.start && lastRange.end === range.end)) {
				return;
			}
			uqid && this.query.removeClause(uqid);
			if((range.start && range.end) === null) {
				uqid = null;
			} else {
				var value = {};
				if( range.start ) {
					value["gte"] = range.start;
				}
				if( range.end ) {
					value["lte"] = range.end;
				}
				uqid = this.query.addClause( value, spec.field_name, "range", "must");
			}
			jEl.data("lastRange", range);
			jEl.siblings(".uiQueryFilter-rangeHintFrom")
				.text(i18n.text("QueryFilter.DateRangeHint.from", range.start && new Date(range.start).toUTCString()));
			jEl.siblings(".uiQueryFilter-rangeHintTo")
				.text(i18n.text("QueryFilter.DateRangeHint.to", range.end && new Date(range.end).toUTCString()));
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
			if(!range || (lastRange && lastRange.lte === range.lte && lastRange.gte === range.gte)) {
				return;
			}
			jEl.data("lastRange", range);
			uqid && this.query.removeClause(uqid);
			uqid = this.query.addClause( range, spec.field_name, "range", "must");
			jEl.data("uqid", uqid);
			this.requestUpdate(jEv);
		},
		_booleanFilterChange_handler: function( jEv ) {
			var jEl = $(jEv.target).closest("SELECT");
			var val = jEl.val();
			var spec = jEl.data("spec");
			var uqid = jEl.data("uqid") || null;
			uqid && this.query.removeClause(uqid);
			if(val === "true" || val === "false") {
				jEl.data("uqid", this.query.addClause(val, spec.field_name, "term", "must") );
			}
			this.requestUpdate(jEv);
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiQueryFilter", children: [
				this._aliasSelector_template(),
				this._indexSelector_template(),
				this._typesSelector_template(),
				this._filters_template()
			] };
		},
		_aliasSelector_template: function() {
			var aliases = Object.keys(this.metadata.aliases).sort();
			aliases.unshift( i18n.text("QueryFilter.AllIndices") );
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-aliases", children: [
				{ tag: "SELECT", onChange: this._selectAlias_handler, children: aliases.map(ut.option_template) }
			] };
		},
		_indexSelector_template: function() {
			var indices = Object.keys( this.metadata.indices ).sort();
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-indices", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Indices") },
				{ tag: "DIV", onClick: this._selectIndex_handler, children: indices.map( function( name ) {
					return { tag: "DIV", cls: "uiQueryFilter-booble uiQueryFilter-index", text: name };
				})}
			] };
		},
		_typesSelector_template: function() {
			var types = Object.keys( this.metadata.types ).sort();
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-types", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Types") },
				{ tag: "DIV", onClick: this._selectType_handler, children: types.map( function( name ) {
					return { tag: "DIV", cls: "uiQueryFilter-booble uiQueryFilter-type", text: name };
				})}
			] };
		},
		_filters_template: function() {
			var _metadataFields = this.metadata.fields;
			var fields = Object.keys( _metadataFields ).sort()
				.filter(function(d) { return (_metadataFields[d].core_type !== undefined); });
			return { tag: "DIV", cls: "uiQueryFilter-section uiQueryFilter-filters", children: [
				{ tag: "HEADER", text: i18n.text("QueryFilter-Header-Fields") },
				{ tag: "DIV", children: fields.map( function(name ) {
					return new app.ui.SidebarSection({
						title: name,
						help: this.helpTypeMap[this.metadata.fields[ name ].type],
						onShow: this._openFilter_handler
					});
				}, this ) }
			] };
		},
		_textFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._textFilterChange_handler };
		},
		_dateFilter_template: function(spec) {
			return { tag: "DIV", children: [
				{ tag: "INPUT", data: { spec: spec }, onKeyup: this._dateFilterChange_handler },
				{ tag: "PRE", cls: "uiQueryFilter-rangeHintFrom", text: i18n.text("QueryFilter.DateRangeHint.from", "")},
				{ tag: "PRE", cls: "uiQueryFilter-rangeHintTo", text: i18n.text("QueryFilter.DateRangeHint.to", "") }
			]};
		},
		_numericFilter_template: function(spec) {
			return { tag: "INPUT", data: { spec: spec }, onKeyup: this._numericFilterChange_handler };
		},
		_booleanFilter_template: function(spec) {
			return { tag: "SELECT", data: { spec: spec }, onChange: this._booleanFilterChange_handler,
				children: [ i18n.text("QueryFilter.AnyValue"), "true", "false" ].map( function( val ) {
					return { tag: "OPTION", value: val, text: val };
				})
			};
		},
		_multiFieldFilter_template: function(section, spec) {
			return {
				tag : "DIV", cls : "uiQueryFilter-subMultiFields", children : acx.eachMap(spec.fields, function(name, data) {
					if (name === spec.field_name) {
						section.config.title = spec.field_name + "." + name;
						return this._openFilter_handler(section);
					}
					return new app.ui.SidebarSection({
						title : data.field_name, help : this.helpTypeMap[data.type], onShow : this._openFilter_handler
					});
				}, this)
			};
		}	
	});

})( this.jQuery, this.app, this.i18n );
