(function( app ) {

	var data = app.ns("data");

	data.ResultDataSourceInterface = data.DataSourceInterface.extend({
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

})( this.app );
