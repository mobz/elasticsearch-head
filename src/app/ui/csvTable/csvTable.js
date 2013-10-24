( function( $, app ) {

	var ui = app.ns("ui");

	var CELL_SEPARATOR = "\t";
	var CELL_QUOTE = "";
	var LINE_SEPARATOR = "\r\n";

	ui.CSVTable = ui.AbstractWidget.extend({
		defaults: {
			results: null
		},
		_baseCls: "uiCSVTable",
		init: function( parent ) {
			this._super();
			var results = this.config.results.hits.hits;
			var columns = this._parseResults( results );
			console.log( columns );
			this.el = $( this._main_template( columns, results ) );
			this.attach( parent );
		},
		_parseResults: function( results ) {
			var path,
				columnPaths = {};
			(function parse( path, obj ) {
				if( obj instanceof Array ) {
					for( var i = 0; i < obj.length; i++ ) {
						parse( path, obj[i] );
					}
				} else if( typeof obj === "object" ) {
					for( var prop in obj ) {
						parse( path + "." + prop, obj[ prop ] );
					}
				} else {
					columnPaths[ path ] = 1;
				}
			})( "root", results );
			var columns = [];
			for( var column in columnPaths ) {
				columns.push( column.split(".").slice(1) );
			}
			return columns;
		},
		_main_template: function( columns, results ) {
			return { tag: "PRE", cls: this._baseCls, id: this.id(),
				text: this._header_template( columns ) + LINE_SEPARATOR + this._results_template( columns, results )
			};
		},
		_header_template: function( columns ) {
			return columns.map( function( column ) {
				return column.join(".");
			}).join( CELL_SEPARATOR );
		},
		_results_template: function( columns, results ) {
			return results.map( function( result ) {
				return columns.map( function( column ) {
					var l = 0,
						ptr = result;
					while( l !== column.length && ptr != null ) {
						ptr = ptr[ column[ l++ ] ];
					}
					return ( ptr == null ) ? "" : ( CELL_QUOTE + ptr.toString() + CELL_QUOTE );
				}).join( CELL_SEPARATOR );
			}).join( LINE_SEPARATOR );
		}

	});

})( this.jQuery, this.app );
