(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.Query = ux.Observable.extend({
		defaults: {
			cluster: null,  // (required) instanceof app.services.Cluster
			size: 50        // size of pages to return
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.refuid = 0;
			this.refmap = {};
			this.indices = [];
			this.types = [];
			this.search = {
				fields : [ "_parent", "_source" ],
				query: { bool: { must: [], must_not: [], should: [] } },
				from: 0,
				size: this.config.size,
				sort: [],
				//facets: {},
				version: true
			};
			this.defaultClause = this.addClause();
			this.history = [ this.getState() ];
		},
		clone: function() {
			var q = new data.Query({ cluster: this.cluster });
			q.restoreState(this.getState());
			for(var uqid in q.refmap) {
				q.removeClause(uqid);
			}
			return q;
		},
		getState: function() {
			return $.extend(true, {}, { search: this.search, indices: this.indices, types: this.types });
		},
		restoreState: function(state) {
			state = $.extend(true, {}, state || this.history[this.history.length - 1]);
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
							alert(i18n.text("Query.FailAndUndo"));
							this.restoreState();
							return;
						}
						this.history.push(state);

						this.fire("results", this, results);
					}.bind(this));
		},
		loadParents: function(res,metadata){
			//create data for mget
			var data = { docs :[] };
			var indexToTypeToParentIds = {};
			res.hits.hits.forEach(function(hit) {
			if (typeof hit.fields != "undefined"){
				if (typeof hit.fields._parent != "undefined"){
					var parentType = metadata.indices[hit._index].parents[hit._type];
					if (typeof indexToTypeToParentIds[hit._index] == "undefined"){
						indexToTypeToParentIds[hit._index] = new Object();
					}
					if (typeof indexToTypeToParentIds[hit._index][hit._type] == "undefined"){
						indexToTypeToParentIds[hit._index][hit._type] = new Object();
					}
					if (typeof indexToTypeToParentIds[hit._index][hit._type][hit.fields._parent] == "undefined"){
						indexToTypeToParentIds[hit._index][hit._type][hit.fields._parent] = null;
						data.docs.push({ _index:hit._index, _type:parentType, _id:hit.fields._parent});
					}
				}
			}
		});

		//load parents
		var state = this.getState();
			this.cluster.post("_mget",JSON.stringify(data),
				function(results) {
					if(results === null) {
						alert(i18n.text("Query.FailAndUndo"));
						this.restoreState();
						return;
					}
					this.history.push(state);
					var indexToTypeToParentIdToHit = new Object();
					results.docs.forEach(function(doc) {
						if (typeof indexToTypeToParentIdToHit[doc._index] == "undefined"){
						indexToTypeToParentIdToHit[doc._index] = new Object();
					}
					
					if (typeof indexToTypeToParentIdToHit[doc._index][doc._type] == "undefined"){
						indexToTypeToParentIdToHit[doc._index][doc._type] = new Object();
					}
					
					indexToTypeToParentIdToHit[doc._index][doc._type][doc._id] = doc;
					});
					
					res.hits.hits.forEach(function(hit) {
						if (typeof hit.fields != "undefined"){
							if (typeof hit.fields._parent != "undefined"){
								var parentType = metadata.indices[hit._index].parents[hit._type];
								hit._parent = indexToTypeToParentIdToHit[hit._index][parentType][hit.fields._parent];
							}
						}
					});

					this.fire("resultsWithParents", this, res);
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
		// addFacet: function(facet) {
		// 	var facetId = "f-" + this.refuid++;
		// 	this.search.facets[facetId] = facet;
		// 	this.refmap[facetId] = { facetId: facetId, facet: facet };
		// 	return facetId;
		// },
		// removeFacet: function(facetId) {
		// 	delete this.search.facets[facetId];
		// 	delete this.refmap[facetId];
		// },
		_setClause: function(value, field, op, bool) {
			var clause = {}, query = {};
			if(op === "match_all") {
			} else if(op === "query_string") {
				query["default_field"] = field;
				query["query"] = value;
			} else if(op === "missing") {
				op = "constant_score"
				var missing = {}, filter = {};
				missing["field"] = field;
				filter["missing"] = missing
				query["filter"] = filter;
			} else {
				query[field] = value;
			}
			clause[op] = query;
			this.search.query.bool[bool].push(clause);
			return clause;
		}
	});

})( this.app );
