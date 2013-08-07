(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	var coretype_map = {
		"string" : "string",
		"long" : "number",
		"integer" : "number",
		"float" : "number",
		"double" : "number",
		"ip" : "number",
		"date" : "date",
		"boolean" : "boolean",
		"binary" : "binary",
		"multi_field" : "multi_field"
	};

	var default_property_map = {
		"string" : { "store" : "no", "index" : "analysed" },
		"number" : { "store" : "no", "precision_steps" : 4 },
		"date" : { "store" : "no", "format" : "dateOptionalTime", "index": "yes", "precision_steps": 4 },
		"boolean" : { "store" : "no", "index": "yes" },
		"binary" : { },
		"multi_field" : { }
	};

	// parses metatdata from a cluster, into a bunch of useful data structures
	data.MetaData = ux.Observable.extend({
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

			function createField( mapping, index, type, path, name ) {
				var dpath = [ index, type ].concat( path ).join( "." );
				var field_name = mapping.index_name || name;
				var field = paths[ dpath ] = fields[ field_name ] || acx.extend({
					field_name : field_name,
					core_type : coretype_map[ mapping.type ],
					dpaths : []
				}, default_property_map[ coretype_map[ mapping.type ] ], mapping );

				if (field.type === "multi_field" && typeof field.fields !== "undefined") {
					for (var subField in field.fields) {
						field.fields[ subField ] = createField( field.fields[ subField ], index, type, path.concat( subField ), name + "." + subField );
					}
				}
				if (fields.dpaths) {
					field.dpaths.push(dpath);
				}
				return field;
			}
			function getFields(properties, type, index, listeners) {
				(function procPath(prop, path) {
					for (var n in prop) {
						if ("properties" in prop[n]) {
							procPath( prop[ n ].properties, path.concat( n ) );
						} else {
							var field = createField(prop[n], index, type, path.concat(n), n);							
							listeners.forEach( function( listener ) {
								listener[ field.field_name ] = field;
							} );
						}
					}
				})(properties, []);
			}
			for (var index in state.metadata.indices) {
				indices[index] = {
					types : [], fields : {}, paths : {}, parents : {}
				};
				indices[index].aliases = state.metadata.indices[index].aliases;
				indices[index].aliases.forEach(function(alias) {
					(aliases[alias] || (aliases[alias] = [])).push(index);
				});
				var mapping = state.metadata.indices[index].mappings;
				for (var type in mapping) {
					indices[index].types.push(type);
					if ( type in types) {
						types[type].indices.push(index);
					} else {
						types[type] = {
							indices : [index], fields : {}
						};
					}
					getFields(mapping[type].properties, type, index, [fields, types[type].fields, indices[index].fields]);
					if ( typeof mapping[type]._parent !== "undefined") {
						indices[index].parents[type] = mapping[type]._parent.type;
					}
				}
			}

			this.aliasesList = Object.keys(aliases);
			this.indicesList = Object.keys(indices);
			this.typesList = Object.keys(types);
			this.fieldsList = Object.keys(fields);
		}
	});

})( this.app );	
