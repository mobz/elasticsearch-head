acx.data = {};

/**
 * An abstract interface for delivering data to a data consumer (eg acx.ui.Table)
 */                               
acx.data.DataSourceInterface = acx.Class.extend({
	// returns total number of items available
	getCount: function() { return 0; },
	// returns an array of columns specifications
	getColumns: function() { return [{ name: "", type: "" }]; },
	// return an array of objects containing data
	getData: function(spec) { return [{}]; }
});