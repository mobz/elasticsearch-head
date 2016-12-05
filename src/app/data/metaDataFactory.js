(function( app ) {

	var data = app.ns("data");
	var ux = app.ns("ux");

	data.MetaDataFactory = ux.Observable.extend({
		defaults: {
			cluster: null // (required) an app.services.Cluster
		},
		init: function() {
			this._super();
			var _cluster = this.config.cluster;
			this.config.cluster.get("_cluster/state", function(data) {
				this.metaData = new app.data.MetaData({state: data});
				this.fire("ready", this.metaData,  { originalData: data, "k": 1 }); // TODO originalData needed for legacy ui.FilterBrowser
			}.bind(this), function() {
				
				var _this = this;
				
				_cluster.get("_all", function( data ) {
					clusterState = {routing_table:{indices:{}}, metadata:{indices:{}}};
					
					for(var k in data) {
						clusterState["routing_table"]["indices"][k] = {"shards":{"1":[{
                            "state":"UNASSIGNED",
                            "primary":false,
                            "node":"unknown",
                            "relocating_node":null,
                            "shard":'?',
                            "index":k
                        }]}};
						

						clusterState["metadata"]["indices"][k] = {};
						clusterState["metadata"]["indices"][k]["mappings"] = data[k]["mappings"];
						clusterState["metadata"]["indices"][k]["aliases"] = $.makeArray(Object.keys(data[k]["aliases"]));
						clusterState["metadata"]["indices"][k]["settings"] = data[k]["settings"];
						clusterState["metadata"]["indices"][k]["fields"] = {};
					}
					
					_this.metaData = new app.data.MetaData({state: clusterState});
					_this.fire("ready", _this.metaData, {originalData: clusterState});
				});				

			}.bind(this));
		}
	});

})( this.app );
