(function( app ) {

	var data = app.ns("data");

	data.QueryDataSourceInterface = data.DataSourceInterface.extend({
		defaults: {
			metadata: null, // (required) instanceof app.data.MetaData, the cluster metadata
			query: null     // (required) instanceof app.data.Query the data source
		},
		init: function() {
			this._super();
			this.config.query.on("results", this._results_handler.bind(this) );
			this.config.query.on("resultsWithParents", this._load_parents.bind(this) );
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
		_load_parents: function(query, res) {
			query.loadParents(res, this.config.metadata);
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
						} else {
							var dpath = path.concat(prop).join(".");
							if(metadata.paths[dpath]) {
								var field_name = metadata.paths[dpath].field_name;
								if(! columns.contains(field_name)) {
									columns.push(field_name);
								}
								row[field_name] = (spec[prop] === null ? "null" : spec[prop] ).toString();
							} else {
								// TODO: field not in metadata index
							}
						}
					}
					return row;
				})([ hit._index, hit._type ], hit._source, {});
				metaColumns.forEach(function(n) { row[n] = hit[n]; });
				row._source = hit;
				if (typeof hit._parent!= "undefined") {
					(function(prefix, path, spec, row) {
					for(var prop in spec) {
						if(acx.isObject(spec[prop])) {
							arguments.callee(prefix, path.concat(prop), spec[prop], row);
						} else if(acx.isArray(spec[prop])) {
							if(spec[prop].length) {
								arguments.callee(prefix, path.concat(prop), spec[prop][0], row)
							}
						} else {
							var dpath = path.concat(prop).join(".");
							if(metadata.paths[dpath]) {
								var field_name = metadata.paths[dpath].field_name;
								var column_name = prefix+"."+field_name;
								if(! columns.contains(column_name)) {
									columns.push(column_name);
								}
								row[column_name] = (spec[prop] === null ? "null" : spec[prop] ).toString();
							} else {
								// TODO: field not in metadata index
							}
						}
					}
					})(hit._parent._type,[hit._parent._index, hit._parent._type], hit._parent._source, row);
				}
				return row;
			}, this);
		}
	});

})( this.app );
