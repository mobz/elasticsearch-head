(function( $, app, i18n ) {

	var ui = app.ns("ui");

	// ( master ) master = true, data = true 
	// ( coordinator ) master = true, data = false
	// ( worker ) master = false, data = true;
	// ( client ) master = false, data = false;
	// http enabled ?

	function nodeSort_name(a, b) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		return a.cluster.name.toString().localeCompare( b.cluster.name.toString() );
	}

	function nodeSort_addr( a, b ) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		return a.cluster.transport_address.toString().localeCompare( b.cluster.transport_address.toString() );
	}

	function nodeSort_type( a, b ) {
		if (!(a.cluster && b.cluster)) {
			return 0;
		}
		if( a.master_node ) {
			return -1;
		} else if( b.master_node ) {
			return 1;
		} else if( a.data_node && !b.data_node ) {
			return -1;
		} else if( b.data_node && !a.data_node ) {
			return 1;
		} else {
			return a.cluster.name.toString().localeCompare( b.cluster.name.toString() );
		}
	}

	function nodeFilter_none( a ) {
		return true;
	}

	function nodeFilter_clients( a ) {
		return (a.master_node || a.data_node );
	}


	ui.ClusterOverview = ui.Page.extend({
		defaults: {
			cluster: null // (reqired) an instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this._resetTimer = null;
			this._redrawValue = -1;
			this._nodeSort = nodeSort_name;
			this._refreshButton = new ui.SplitButton({
				label: i18n.text("General.RefreshResults"),
				items: [
					{ label: i18n.text("General.ManualRefresh"), value: -1, selected: true },
					{ label: i18n.text("General.RefreshQuickly"), value: 100 },
					{ label: i18n.text("General.Refresh5seconds"), value: 5000 },
					{ label: i18n.text("General.Refresh1minute"), value: 60000 }
				],
				onselect: function( btn, event ) {
					this._redrawValue = event.value;
					if( event.value < 0 ) {
						window.clearTimeout( this._resetTimer );
					}
					this.redraw( "reset" );
				}.bind( this ),
				onclick: function( btn, event ) {
					this.redraw("reset");
				}.bind(this)
			});
			this._nodeSortMenu = new ui.MenuButton({
				label: "Sort Cluster",
				menu: new ui.MenuPanel({
					items: [
						{ text: "By Name", onclick: this._nodeSort_handler.bind(this, nodeSort_name ) },
						{ text: "By Address", onclick: this._nodeSort_handler.bind(this, nodeSort_addr ) },
						{ text: "By Type", onclick: this._nodeSort_handler.bind(this, nodeSort_type ) }
					]
				})
			});

			this.el = $(this._main_template());
			this.tablEl = this.el.find(".uiClusterOverview-table");
			this.cluster = this.config.cluster;
			this.redraw("reset");
			this.on( "drawn", function( self ) {
				if( self._redrawValue >= 0 ) {
					self._resetTimer = setTimeout( function() {
						self.redraw( "reset" );
					}, self._redrawValue );
				}
			} );
		},
		redraw: function(command) {
			if(command === "reset") {
				window.clearTimeout( this._resetTimer );
				this._refreshButton.disable();
				this.clusterState = null;
				this.status = null;
				this.nodeStats = null;
				this.clusterNodes = null;
				this.cluster.get("_cluster/state", this._clusterState_handler);
				this.cluster.get("_status", this._status_handler);
				this.cluster.get("_cluster/nodes", this._clusterNodes_handler);
				this.cluster.get("_cluster/nodes/stats?all=true", this._clusterNodeStats_handler);
			} else if(this.status && this.clusterState && this.nodeStats && this.clusterNodes) {
				var clusterState = this.clusterState;
				var status = this.status;
				var nodeStats = this.nodeStats;
				var clusterNodes = this.clusterNodes;
				var nodes = [];
				var indices = [];
				var cluster = {};
				var nodeIndices = {};
				var indexIndices = {}, indexIndicesIndex = 0;
				function newNode(n) {
					return {
						name: n,
						routings: [],
						master_node: clusterState.master_node === n
					};
				}
				function newIndex(i) {
					return {
						name: i,
						replicas: []
					};
				}
				function getIndexForNode(n) {
					return nodeIndices[n] = (n in nodeIndices) ? nodeIndices[n] : nodes.push(newNode(n)) - 1;
				}
				function getIndexForIndex(routings, i) {
					var index = indexIndices[i] = (i in indexIndices) ?
							(routings[indexIndices[i]] = routings[indexIndices[i]] || newIndex(i)) && indexIndices[i]
							: ( ( routings[indexIndicesIndex] = newIndex(i) )  && indexIndicesIndex++ );
					indices[index] = i;
					return index;
				}
				$.each(clusterNodes.nodes, function(name, node) {
					getIndexForNode(name);
				});

				var indexNames = [];
				$.each(clusterState.routing_table.indices, function(name, index){
					indexNames.push(name);
				});
				indexNames.sort().forEach(function(name) {
					var index = clusterState.routing_table.indices[name];
					$.each(index.shards, function(name, shard) {
						shard.forEach(function(replica){
							var node = replica.node;
							if(node === null) { node = "Unassigned"; }
							var index = replica.index;
							var shard = replica.shard;
							var routings = nodes[getIndexForNode(node)].routings;
							var indexIndex = getIndexForIndex(routings, index);
							var replicas = routings[indexIndex].replicas;
							if(node === "Unassigned" || !status.indices[index].shards[shard]) {
								replicas.push({ replica: replica });
							} else {
								replicas[shard] = {
									replica: replica,
									status: status.indices[index].shards[shard].filter(function(replica) {
										return replica.routing.node === node;
									})[0]
								};
							}
						});
					});
				});
				indices = indices.map(function(index){
					return {
						name: index,
						state: "open",
						metadata: clusterState.metadata.indices[index],
						status: status.indices[index]
					};
				}, this);
				$.each(clusterState.metadata.indices, function(name, index) {
					if(index.state === "close") {
						indices.push({
							name: name,
							state: "close",
							metadata: index,
							status: null
						});
					}
				});
				nodes.forEach(function(node) {
					node.stats = nodeStats.nodes[node.name];
					var cluster = clusterNodes.nodes[node.name];
					node.cluster = cluster;
					node.data_node = !( cluster && cluster.attributes && cluster.attributes.data === "false" );
					for(var i = 0; i < indices.length; i++) {
						node.routings[i] = node.routings[i] || { name: indices[i].name, replicas: [] };
						node.routings[i].max_number_of_shards = indices[i].metadata.settings["index.number_of_shards"];
						node.routings[i].open = indices[i].state === "open";
					}
				});
				var aliasesIndex = {};
				var aliases = [];
				var indexClone = indices.map(function() { return false; });
				$.each(clusterState.metadata.indices, function(name, index) {
					index.aliases.forEach(function(alias) {
						var aliasIndex = aliasesIndex[alias] = (alias in aliasesIndex) ? aliasesIndex[alias] : aliases.push( { name: alias, max: -1, min: 999, indices: [].concat(indexClone) }) - 1;
						var indexIndex = indexIndices[name];
						var aliasRow = aliases[aliasIndex];
						aliasRow.min = Math.min(aliasRow.min, indexIndex);
						aliasRow.max = Math.max(aliasRow.max, indexIndex);
						aliasRow.indices[indexIndex] = indices[indexIndex];
					});
				});
				cluster.aliases = aliases;
				cluster.nodes = nodes
					.filter( nodeFilter_none )
					.sort( this._nodeSort );
				indices.unshift({ name: null });
				this._drawNodesView( cluster, indices );
				this._refreshButton.enable();
				this.fire("drawn", this );
			}
		},
		_drawNodesView: function( cluster, indices ) {
			this._nodesView && this._nodesView.remove();
			this._nodesView = new ui.NodesView({
				onRedraw: function() {
					this.redraw("reset");
				}.bind(this),
				interactive: ( this._redrawValue === -1 ),
				cluster: this.cluster,
				data: {
					cluster: cluster,
					indices: indices
				}
			});
			this._nodesView.attach( this.tablEl );
		},
		_nodeSort_handler: function( sortFn ) {
			this._nodeSort = sortFn;
			this.redraw("reset");
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
		_newIndex_handler: function() {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("ClusterOverView.IndexName"), name: "_name", require: true }),
					new ui.TextField({
						label: i18n.text("ClusterOverview.NumShards"),
						name: "number_of_shards",
						value: "5",
						require: function( val ) { return parseInt( val, 10 ) >= 1; }
					}),
					new ui.TextField({
						label: i18n.text("ClusterOverview.NumReplicas"),
						name: "number_of_replicas",
						value: "1",
						require: function( val ) { return parseInt( val, 10 ) >= 0; }
					})
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("ClusterOverview.NewIndex"),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var name = data["_name"];
						delete data["_name"];
						this.config.cluster.put( name, JSON.stringify({ settings: { index: data } }), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiClusterOverview", children: [
				new ui.Toolbar({
					label: i18n.text("Overview.PageTitle"),
					left: [
						new ui.Button({
							label: i18n.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						}),
						this._nodeSortMenu
					],
					right: [
						this._refreshButton
					]
				}),
				{ tag: "DIV", cls: "uiClusterOverview-table" }
			] };
		}
	});

})( this.jQuery, this.app, this.i18n );
