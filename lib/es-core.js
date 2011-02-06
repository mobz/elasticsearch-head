(function() {
	var es = window.es = {};

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
	
	es.query = function(params) {
		$.ajax(acx.extend({
			url: es.query.base.base_uri + params.path,
		}, es.query.base, params));
	};
	es.query.base = {
		base_uri: "http://localhost:9200/",
		dataType: "json",
		type: "POST",
		error: function(xhr, type, message) {
			if("console" in window) {
				console.log({ "XHR Error": type, "message": message });
			}
		}
	};
	// executes a query, generating a result and storing it, then executing any waiting callbacks
	es.queryQueue = (function() {
		uidp = 0, objref = [], uidmap = {},	queue = {};
		
		function getuid(obj, prop) {
			var i = objref.indexOf(obj);
			if(i === -1) {
				i = objref.push(obj) - 1;
				uidmap[i] = {};
			}
			return uidmap[i][prop] || (uidmap[i][prop] = uidp++);
		}
		
		return function(obj, prop, query_params, gen, cb) {
			if(obj[prop]) {
				cb(obj[prop]);
			} else {
				var uid = getuid(obj, prop);
				if(queue[uid]) {
					queue[uid].push(cb); 
				} else {
					queue[uid] = [ cb ];
					es.query(query_params, { success: function(data) {
						obj[prop] = gen(data);
						queue[uid].each(function(f) { f(obj[prop])});
					}});
				}
			}
		};
	})();
	
	// reads metatdata from the indices 
	es.MetaData = acx.ux.Observable.extend({
		init: function() {
			this._super();
			this.indices = null;
		},
		getIndicies: function(cb) {
			es.queryQueue(this, "indices", {
				path: "_cluster/state",
				type: "GET"
			}, function(state) {
				function createMapping(prop, n) {
					return acx.extend( { index_name: n, core_type: coretype_map[prop.type] }, default_property_map[coretype_map[prop.type]], prop );
				}
				function getMetaData(prop, tmeta, imeta) {
					for(var n in prop) {
						"properties" in prop[n] ? getMetaData(prop[n].properties, tmeta, imeta) : tmeta[n] = imeta[n] = createMapping(prop[n], n);
					}
				}
				var indices = {};
				for(var index in state.metadata.indices) {
					indices[index] = { scanned: false, types: {}, metadata: {} };
					for(var type in state.metadata.indices[index].mappings) {
						indices[index].types[type] = { selected: false, metadata: {} };
						getMetaData(state.metadata.indices[index].mappings[type].properties, indices[index].types[type].metadata, indices[index].metadata);
					}
				}
				return indices;
			}.bind(this), cb);
		}
	});
	
})();














