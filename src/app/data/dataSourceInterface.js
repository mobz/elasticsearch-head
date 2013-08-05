(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	/**
	 * An abstract interface for delivering async data to a data consumer (eg acx.ui.Table)
	 */
	data.DataSourceInterface = ux.Observable.extend({
		/*
		properties
			meta = { total: 0 },
			headers = [ { name: "" } ],
			data = [ { column: value, column: value } ],
			sort = { column: "name", dir: "desc" }
		events
			data: function( DataSourceInterface )
		 */
	});

})( this.app );