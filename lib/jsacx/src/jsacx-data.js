acx.data = {};

/**
 * An abstract interface for delivering async data to a data consumer (eg acx.ui.Table)
 */
acx.data.DataSourceInterface = acx.ux.Observable.extend({
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