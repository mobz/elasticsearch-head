( function( $, app, joey ) {

	var ui = app.ns("ui");

	var CELL_SEPARATOR = ",";
	var CELL_QUOTE = '"';
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
			this._downloadButton = new ui.Button({
				label: "Generate Download Link",
				onclick: this._downloadLinkGenerator_handler
			});
			this._downloadLink = $.joey( { tag: "A", text: "download", });
			this._downloadLink.hide();
			this._csvText = this._csv_template( columns, results );
			this.el = $.joey( this._main_template() );
			this.attach( parent );
		},
		_downloadLinkGenerator_handler: function() {
			this._downloadLink.attr("href", "data:text/csv;chatset=utf-8," + window.encodeURIComponent( this._csvText ) );
			this._downloadLink.show();
		},
		_parseResults: function( results ) {
			var columnPaths = {};
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
					columnPaths[ path ] = true;
				}
			})( "root", results );
			var columns = [];
			for( var column in columnPaths ) {
				columns.push( column.split(".").slice(1) );
			}
			return columns;
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: this._baseCls, id: this.id(), children: [
				this._downloadButton,
				this._downloadLink,
				{ tag: "PRE", text: this._csvText }
			] }
		); },
		_csv_template: function( columns, results ) {
			return this._header_template( columns ) + LINE_SEPARATOR + this._results_template( columns, results );
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
					return ( ptr == null ) ? "" : ( CELL_QUOTE + ptr.toString().replace(/"/g, '""') + CELL_QUOTE );
				}).join( CELL_SEPARATOR );
			}).join( LINE_SEPARATOR );
		}
	});

})( this.jQuery, this.app, this.joey );
