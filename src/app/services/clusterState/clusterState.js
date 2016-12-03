	(function( app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	services.ClusterState = ux.Observable.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.clusterState = null;
			this.status = null;
			this.nodeStats = null;
			this.clusterNodes = null;
		},
		refresh: function() {
			var self = this, clusterState, status, nodeStats, clusterNodes, clusterHealth;
			function updateModel() {
				if( clusterState && status && nodeStats && clusterNodes && clusterHealth ) {
					this.clusterState = clusterState;
					this.status = status;
					this.nodeStats = nodeStats;
					this.clusterNodes = clusterNodes;
					this.clusterHealth = clusterHealth;
					this.fire( "data", this );
				}
			}
			var _cluster = this.cluster;
			_cluster.get("_cluster/state", function( data ) {
				clusterState = data;
				updateModel.call( self );
			},function() {
				
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
					}
					
					updateModel.call( self );
				});
				
			});
			this.cluster.get("_stats", function( data ) {
				status = data;
				updateModel.call( self );
			});
			this.cluster.get("_nodes/stats", function( data ) {
				nodeStats = data;
				updateModel.call( self );
			});
			this.cluster.get("_nodes", function( data ) {
				clusterNodes = data;
				updateModel.call( self );
			});
			this.cluster.get("_cluster/health", function( data ) {
				clusterHealth = data;
				updateModel.call( self );
			});
		},
		_clusterState_handler: function(state) {
			this.clusterState = state;
			this.redraw("clusterState");
		},
		_status_handler: function(status) {
			this.status = status;
			this.redraw("status");
		},
		_clusterNodeStats_handler: function(stats) {
			this.nodeStats = stats;
			this.redraw("nodeStats");
		},
		_clusterNodes_handler: function(nodes) {
			this.clusterNodes = nodes;
			this.redraw("clusterNodes");
		},
		_clusterHealth_handler: function(health) {
			this.clusterHealth = health;
			this.redraw("status");
		}
	});

})( this.app );
