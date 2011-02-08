(function() {
	var es = window.es = {};

	/*
	notes on elasticsearch terminology used in this project

 indices[index] contains one or more
 types[type] contains one or more
 documents contain one or more
 fields[path]
 each fields map to one index_name / name

 eg PUT, "/twitter/tweet/1" { user: "mobz", date: "2011-01-01", message: "You know, for browsing elasticsearch", name: { first: "Ben", last: "Birch" } }
   creates
   	1 index: twitter
   	1 type: tweet
   	1 document: /twitter/tweet/1
   	5 fields: [ ["user"], ["date"], ["message"], ["name","first"], ["name","last"] ] which map to
   	5 index_names: [ "user", "date", "message", "first", "last" ]

	 */

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
		query: function(method, params) {
			params = acx.extend({
				url: this.config.base_uri + params.path,
				dataType: "json",
				method: method,
				error: function(xhr, type, message) {
					if("console" in window) {
						console.log({ "XHR Error": type, "message": message });
					}
				}
			},  params);
			return $.ajax(params);
		},
		"get": function(path, success) { return this.query("GET", { path: path, success: success } ); },
		"post": function(path, data, success) { return this.query("POST", { path: path, data: data, success: success } ); },
		"put": function(path, data, success) { return this.query("PUT", { path: path, data: data, success: success } ); },
		"delete": function(path, data, success) { return this.query("DELETE", { path: path, data: data, success: success } ); }
	});

	// parses metatdata from a cluster
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
		// returns an array of strings containing all types that are in any of the indices passed in, or all types
		getTypes: function(indices) {
			if(indices) {
				return indices.reduce(function(ret, index) {
					this.types[index].forEach(function(val) {	if(! ret.contains(val)) ret.push(val); });
					return ret;
				}, [] );
			} else {
				return acx.eachMap(this.types, function(type) { return type; });
			}
		},
		refresh: function(state) {
			// will not handle multiple fields that reference the same index_name, or multiple indexes with the same types (at the moment)
			var aliases = this.aliases = {};
			var indices = this.indices = {};
			var types = this.types = {};
			var names = this.names = {};
			function createName(mapping, path, field_name) {
				return acx.extend({
					index_name: field_name, core_type: coretype_map[mapping.type], path: path, dpath: path.join(".")
				}, default_property_map[coretype_map[mapping.type]], mapping);
			}
			function getNames(properties) {
				var listeners = Array.prototype.slice.call(arguments, 1);
				(function(prop, path) {
					for(var n in prop) {
						if("properties" in prop[n]) {
							arguments.callee(prop[n].properties, path.concat(n));
						} else {
							var name = createName(prop[n], path.concat(n), n);
							listeners.forEach(function(obj) { obj[name.index_name] = name; });
						}
					}
				})(properties, []);
			}
			for(var index in state.metadata.indices) {
				indices[index] = { types: {}, names: {}, fields: {} };
				indices[index].aliases = state.metadata.indices[index].aliases;
				indices[index].aliases.forEach(function(alias) {
					aliases[alias] = aliases[alias] ? aliases[alias].push(index) : [ index ];
				});
				var mapping = state.metadata.indices[index].mappings;
				for(var type in mapping) {
					types[type] = { index: index, names: {} };
					getNames(mapping[type].properties, names, types[type].names, indices[index].names);
				}
			}
			this.aliasesList = Object.keys(aliases);
			this.indicesList = Object.keys(indices);
			this.typesList = Object.keys(types);
			this.namesList = Object.keys(names);
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
				this.fire("ready", this.metaData);
			}.bind(this));
		}
	});

})();














