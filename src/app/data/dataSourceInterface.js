(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

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
		_getSummary: function(res) {
			this.summary = i18n.text("TableResults.Summary", res._shards.successful, res._shards.total, res.hits.total, (res.took / 1000).toFixed(3));
		},
		_getMeta: function(res) {
			this.meta = { total: res.hits.total, shards: res._shards, tool: res.took };
		}
	});

})( this.app );