(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.MetaDataFactory = ux.Observable.extend({
		defaults: {
			cluster: null // (required) an app.services.Cluster
		},
		init: function() {
			this._super();
			this.config.cluster.get("_cluster/state", function(data) {
				this.metaData = new app.data.MetaData({state: data});
				this.fire("ready", this.metaData,  { originalData: data }); // TODO originalData needed for legacy ui.FilterBrowser
			}.bind(this));
		}
	});

})( this.app );
