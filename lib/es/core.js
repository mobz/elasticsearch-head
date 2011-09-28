(function() {
	var es = window.es = {};

	/*
	notes on elasticsearch terminology used in this project

 indices[index] contains one or more
 types[type] contains one or more
 documents contain one or more
 paths[path]
 each path contains one element of data
 each path maps to one field

 eg PUT, "/twitter/tweet/1"
		{
			user: "mobz",
			date: "2011-01-01",
			message: "You know, for browsing elasticsearch",
			name: {
				first: "Ben",
				last: "Birch"
			}
		}

   creates
   	1 index: twitter
   	            this is the collection of index data
   	1 type: tweet
   	            this is the type of document (kind of like a table in sql)
   	1 document: /twitter/tweet/1
   	            this is an actual document in the index ( kind of like a row in sql)
   	5 paths: [ ["user"], ["date"], ["message"], ["name","first"], ["name","last"] ]
   	            since documents can be heirarchical this maps a path from a document root to a piece of data
   	5 fields: [ "user", "date", "message", "first", "last" ]
   	            this is an indexed 'column' of data. fields are not heirarchical

   	the relationship between a path and a field is called a mapping. mappings also contain a wealth of information about how es indexes the field

   notes
    1) a path is stored as an array, the dpath is  <index> . <type> . path.join("."), which can be considered the canonical reference for a mapping
    2) confusingly, es uses the term index for both the collection of indexed data, and the individually indexed fields
         so the term index_name is the same as field_name in this sense.

	 */

	es.storage = (function() {
		var storage = {};
		return {
			get: function(k) { try { return JSON.parse(localStorage[k] || storage[k]); } catch(e) { return null } },
			set: function(k, v) { v = JSON.stringify(v); localStorage[k] = v; storage[k] = v; }
		};
	})();

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

	es.Cluster = acx.Class.extend({
		defaults: {
			base_uri: "http://localhost:9200/"
		},
		request: function(params) {
			return $.ajax(acx.extend({
				url: this.config.base_uri + params.path,
				dataType: "json",
				error: function(xhr, type, message) {
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			},  params));
		},
		"get": function(path, success) { return this.request( { type: "GET", path: path, success: success } ); },
		"post": function(path, data, success) { return this.request( { type: "POST", path: path, data: data, success: success } ); },
		"put": function(path, data, success) { return this.request( { type: "PUT", path: path, data: data, success: success } ); },
		"delete": function(path, data, success) { return this.request( { type: "DELETE", path: path, data: data, success: success } ); }
	});

	// parses metatdata from a cluster, into a bunch of useful data structures
	es.MetaData = acx.ux.Observable.extend({
		defaults: {
			state: null // (required) response from a /_cluster/state request
		},
		init: function() {
			this._super();
			this.refresh(this.config.state);
		},
		getIndices: function(alias) {
			return alias ? this.aliases[alias] : this.indicesList;
		},
		// returns an array of strings containing all types that are in all of the indices passed in, or all types
		getTypes: function(indices) {
			var indices = indices || [], types = [];
			this.typesList.forEach(function(type) {
				for(var i = 0; i < indices.length; i++) {
					if(! this.indices[indices[i]].types.contains(type))
						return;
				}
				types.push(type);
			}, this);
			return types;
		},
		refresh: function(state) {
			// currently metadata expects all like named fields to have the same type, even when from different types and indices
			var aliases = this.aliases = {};
			var indices = this.indices = {};
			var types = this.types = {};
			var fields = this.fields = {};
			var paths = this.paths = {};

			function createField(mapping, index, type, path, name) {
				var dpath = [index, type ].concat(path).join(".");
				var field_name = mapping.index_name || name;
				var field = paths[dpath] = fields[field_name] = fields[field_name] || acx.extend({
					field_name: field_name, core_type: coretype_map[mapping.type], dpaths: []
				}, default_property_map[coretype_map[mapping.type]], mapping);
				field.dpaths.push(dpath);
				return field;
			}
			function getFields(properties, type, index, listeners) {
				(function(prop, path) {
					for(var n in prop) {
						if("properties" in prop[n]) {
							arguments.callee(prop[n].properties, path.concat(n));
						} else {
							var field = createField(prop[n], index, type, path.concat(n), n);
							listeners.forEach(function(obj) { obj[field.field_name] = field; });
						}
					}
				})(properties, []);
			}
			for(var index in state.metadata.indices) {
				indices[index] = { types: [], fields: {}, paths: {} };
				indices[index].aliases = state.metadata.indices[index].aliases;
				indices[index].aliases.forEach(function(alias) {
					( aliases[alias] || (aliases[alias] = [ ])).push(index);
				});
				var mapping = state.metadata.indices[index].mappings;
				for(var type in mapping) {
					indices[index].types.push(type);
					types[type] = { indices: [ index ], fields: {} };
					getFields(mapping[type].properties, type, index, [ fields, types[type].fields, indices[index].fields ]);
				}
			}
			this.aliasesList = Object.keys(aliases);
			this.indicesList = Object.keys(indices);
			this.typesList = Object.keys(types);
			this.fieldsList = Object.keys(fields);
		}
	});

	es.MetaDataFactory = acx.ux.Observable.extend({
		defaults: {
			cluster: null // (required) an es.Cluster
		},
		init: function() {
			this._super();
			this.config.cluster.get("_cluster/state", function(data) {
				this.metaData = new es.MetaData({state: data});
				this.fire("ready", this.metaData,  { originalData: data }); // TODO originalData needed for legacy es.FilterBrowser
			}.bind(this));
		}
	});

	es.Query = acx.ux.Observable.extend({
		defaults: {
			cluster: null,  // (required) instanceof es.Cluster
			size: 50		    // size of pages to return
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.refuid = 0;
			this.refmap = {};
			this.indices = [];
			this.types = [];
			this.search = {
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				facets: {},
				version: true
			};
			this.defaultClause = this.addClause();
			this.history = [ this.getState() ];
		},
		clone: function() {
			var q = new es.Query( { cluster: this.cluster } );
			q.restoreState(this.getState());
			for(var uqid in q.refmap) {
				q.removeClause(uqid);
			}
			return q;
		},
		getState: function() {
			return acx.extend(true, {}, { search: this.search, indices: this.indices, types: this.types });
		},
		restoreState: function(state) {
			state = acx.extend(true, {}, state || this.history[this.history.length - 1]);
			this.indices = state.indices;
			this.types = state.types;
			this.search = state.search;
		},
		getData: function() {
			return JSON.stringify(this.search);
		},
		query: function() {
			var state = this.getState();
			this.cluster.post(
					(this.indices.join(",") || "_all") + "/" + ( this.types.length ? this.types.join(",") + "/" : "") + "_search",
					this.getData(),
					function(results) {
						if(results === null) {
							alert("Query Failed. Undoing last changes");
							this.restoreState();
							return;
						}
						this.history.push(state);
						this.fire("results", this, results);
					}.bind(this));
		},
		setPage: function(page) {
			this.search.from = this.config.size * (page - 1);
		},
		setSort: function(index, desc) {
			var sortd = {}; sortd[index] = { reverse: !!desc };
			this.search.sort.unshift( sortd );
			for(var i = 1; i < this.search.sort.length; i++) {
				if(Object.keys(this.search.sort[i])[0] === index) {
					this.search.sort.splice(i, 1);
					break;
				}
			}
		},
		setIndex: function(index, add) {
			if(add) {
				if(! this.indices.contains(index)) this.indices.push(index);
			} else {
				this.indices.remove(index);
			}
			this.fire("setIndex", this, { index: index, add: !!add });
		},
		setType: function(type, add) {
			if(add) {
				if(! this.types.contains(type)) this.types.push(type);
			} else {
				this.types.remove(type);
			}
			this.fire("setType", this, { type: type, add: !!add });
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
			bool.remove(ref.clause);
			if(this.search.query.bool.must.length + this.search.query.bool.should.length === 0) {
				this.defaultClause = this.addClause();
			}
		},
		addFacet: function(facet) {
			var facetId = "f-" + this.refuid++;
			this.search.facets[facetId] = facet;
			this.refmap[facetId] = { facetId: facetId, facet: facet };
			return facetId;
		},
		removeFacet: function(facetId) {
			delete this.search.facets[facetId];
			delete this.refmap[facetId];
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
		}
	});

	es.AbstractDataSourceInterface = acx.data.DataSourceInterface.extend({
		_getSummary: function(res) {
			this.summary = acx.text("TableResults.Summary", res._shards.successful, res._shards.total, res.hits.total, (res.took / 1000).toFixed(3));
		},
		_getMeta: function(res) {
			this.meta = { total: res.hits.total, shards: res._shards, tool: res.took };
		}
	});

	es.ResultDataSourceInterface = es.AbstractDataSourceInterface.extend({
		results: function(res) {
			this._getSummary(res);
			this._getMeta(res);
			this._getData(res);
			this.sort = {};
			this.fire("data", this);
		},
		_getData: function(res) {
			var columns = this.columns = [];
			this.data = res.hits.hits.map(function(hit) {
				var row = (function(path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(path.concat(prop), spec[prop][0], row)
							}
						} else {
							var dpath = path.concat(prop).join(".");
							if(! columns.contains(dpath)) {
								columns.push(dpath);
							}
							row[dpath] = (spec[prop] || "null").toString();
						}
					}
					return row;
				})([ hit._type ], hit, {});
				row._source = hit;
				return row;
			}, this);
		}
	});

	es.QueryDataSourceInterface = es.AbstractDataSourceInterface.extend({
		defaults: {
			metadata: null, // (required) instanceof es.MetaData, the cluster metadata
			query: null     // (required) instanceof es.Query the data source
		},
		init: function() {
			this._super();
			this.config.query.on("results", this._results_handler.bind(this));
		},
		_results_handler: function(query, res) {
			this._getSummary(res);
			this._getMeta(res);
			var sort = query.search.sort[0] || { "_score": { reverse: false }};
			var sortField = Object.keys(sort)[0];
			this.sort = { column: sortField, dir: (sort[sortField].reverse ? "asc" : "desc") };
			this._getData(res, this.config.metadata);
			this.fire("data", this);
		},
		_getData: function(res, metadata) {
			var metaColumns = ["_index", "_type", "_id", "_score"];
			var columns = this.columns = [].concat(metaColumns);
			this.data = res.hits.hits.map(function(hit) {
				var row = (function(path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(path.concat(prop), spec[prop][0], row)
							}
						} else{
							var dpath = path.concat(prop).join(".");
							if(metadata.paths[dpath]) {
								var field_name = metadata.paths[dpath].field_name;
								if(! columns.contains(field_name)) {
									columns.push(field_name);
								}
								row[field_name] = (spec[prop] || "null").toString();
							} else {
								// TODO: field not in metadata index
							}
						}
					}
					return row;
				})([ hit._index, hit._type ], hit._source, {});
				metaColumns.forEach(function(n) { row[n] = hit[n]; });
				row._source = hit;
				return row;
			}, this);
		}
	});

})();














