(function( app ) {

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
	1) a path is stored as an array, the dpath is  <index> . <type> . path.join("."),
			which can be considered the canonical reference for a mapping
	2) confusingly, es uses the term index for both the collection of indexed data, and the individually indexed fields
			so the term index_name is the same as field_name in this sense.

	*/

	var data = app.ns("data");
	var ux = app.ns("ux");

	var coretype_map = {
		"string" : "string",
		"byte" : "number",
		"short" : "number",
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
				var field_name = mapping.index_name || path.join( "." );
				var field = paths[ dpath ] = fields[ field_name ] || $.extend({
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
