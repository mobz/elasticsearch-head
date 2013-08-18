(function( $, app ) {

	var ui = app.ns("ui");

	ui.ClusterOverview = ui.Page.extend({
		defaults: {
			cluster: null // (reqired) an instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this._resetTimer = null;
			this._redrawValue = -1;
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
					} else {
						this.redraw( "reset" );
					}
				}.bind( this ),
				onclick: function( btn, event ) {
					this.redraw("reset");
				}.bind(this)
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
				var cluster = { nodes: nodes };
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
				cluster.nodes.forEach(function(node) {
					node.stats = nodeStats.nodes[node.name];
					node.cluster = clusterNodes.nodes[node.name];
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
				indices.unshift({ name: null });
				this.tablEl.empty().append(this._cluster_template(cluster, indices));
				this._refreshButton.enable();
				this.fire("drawn", this );
			}
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
		_newAliasAction_handler: function(index) {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("AliasForm.AliasName"), name: "alias", require: true })
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("AliasForm.NewAliasForIndexName", index.name),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function(panel, args) {
					if(fields.validate()) {
						var data = fields.getData();
						var command = {
							"actions" : [
								{ "add" : { "index" : index.name, "alias" : data["alias"] } }
							]
						};
						this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
							dialog.close();
							alert(JSON.stringify(d));
							this.redraw("reset");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_deleteIndexAction_handler: function(index) {
			if( prompt( i18n.text("AliasForm.DeleteAliasMessage", i18n.text("Command.DELETE"), index.name ) ) === i18n.text("Command.DELETE") ) {
				this.cluster["delete"](index.name, null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this) );
			}
		},
		_postIndexAction_handler: function(action, index, redraw) {
			this.cluster.post(index.name + "/" + action, null, function(r) {
				alert(JSON.stringify(r));
				redraw && this.redraw("reset");
			}.bind(this));
		},
		_testAnalyser_handler: function(index) {
			this.cluster.get(index.name + "/_analyze?text=" + prompt( i18n.text("IndexCommand.TextToAnalyze") ), function(r) {
				alert(JSON.stringify(r, true, "  "));
			});
		},
		_showdownNode_handler: function(node) {
			if(prompt( i18n.text("IndexCommand.ShutdownMessage", i18n.text("Command.SHUTDOWN"), node.cluster.name ) ) === i18n.text("Command.SHUTDOWN") ) {
				this.cluster.post( "_cluster/nodes/" + node.name + "/_shutdown", null, function(r) {
					alert(JSON.stringify(r));
					this.redraw("reset");
				}.bind(this));
			}
		},
		_replica_template: function(replica) {
			var r = replica.replica;
			return { tag: "DIV",
				cls: "uiClusterOverview-replica" + (r.primary ? " primary" : "") + ( " state-" + r.state ),
				text: r.shard.toString(),
				onclick: function() { new ui.JsonPanel({
					json: replica.status || replica.replica,
					title: r.index + "/" + r.node + " [" + r.shard + "]" });
				}
			};
		},
		_routing_template: function(routing) {
			var cell = { tag: "TD", cls: "uiClusterOverview-routing" + (routing.open ? "" : " close"), children: [] };
			for(var i = 0; i < routing.replicas.length; i++) {
				if(i % routing.max_number_of_shards === 0 && i > 0) {
					cell.children.push({ tag: "BR" });
				}
				if( i in (routing.replicas)) {
					cell.children.push(this._replica_template(routing.replicas[i]));
				} else {
					cell.children.push( { tag: "DIV", cls: "uiClusterOverview-nullReplica" } );
				}
			}
			return cell;
		},
		_node_template: function(node) {
			return { tag: "TR", cls: "uiClusterOverview-node" + (node.master_node ? " master": ""), children: [
				{ tag: "TH", children: node.name === "Unassigned" ? [
					{ tag: "DIV", cls: "uiClusterOverview-title", text: node.name }
				] : [
					{ tag: "DIV", children: [
						{ tag: "SPAN", cls: "uiClusterOverview-title", text: node.cluster.name },
						" ",
						{ tag: "SPAN", text: node.name }
					]},
					{ tag: "DIV", text: node.cluster.http_address },
					{ tag: "DIV", cls: "uiClusterOverview-controls", children: [
						new ui.MenuButton({
							label: i18n.text("NodeInfoMenu.Title"),
							menu: new ui.MenuPanel({
								items: [
									{ text: i18n.text("NodeInfoMenu.ClusterNodeInfo"), onclick: function() { new ui.JsonPanel({ json: node.cluster, title: node.name });} },
									{ text: i18n.text("NodeInfoMenu.NodeStats"), onclick: function() { new ui.JsonPanel({ json: node.stats, title: node.name });} }
								]
							})
						}),
						new ui.MenuButton({
							label: i18n.text("NodeActionsMenu.Title"),
							menu: new ui.MenuPanel({
								items: [
									{ text: i18n.text("NodeActionsMenu.Shutdown"), onclick: function() { this._showdownNode_handler(node); }.bind(this) }
								]
							})
						})
					] }
				] }
			].concat(node.routings.map(this._routing_template, this))};
		},
		_indexHeader_template: function(index) {
			var closed = index.state === "close";
			var line1 = closed ? "index: close" : ( "size: " + (index.status && index.status.index ? index.status.index.primary_size + " (" + index.status.index.size + ")" : "unknown" ) ); 
			var line2 = closed ? "\u00A0" : ( "docs: " + (index.status && index.status.docs ? index.status.docs.num_docs + " (" + index.status.docs.max_doc + ")" : "unknown" ) );
			return index.name ? { tag: "TH", cls: (closed ? "close" : ""), children: [
				{ tag: "DIV", cls: "uiClusterOverview-title", text: index.name },
				{ tag: "DIV", text: line1 },
				{ tag: "DIV", text: line2 },
				{ tag: "DIV", cls: "uiClusterOverview-controls", children: [
					new ui.MenuButton({
						label: i18n.text("IndexInfoMenu.Title"),
						menu: new ui.MenuPanel({
							items: [
								{ text: i18n.text("IndexInfoMenu.Status"), onclick: function() { new ui.JsonPanel({ json: index.status, title: index.name }); } },
								{ text: i18n.text("IndexInfoMenu.Metadata"), onclick: function() { new ui.JsonPanel({ json: index.metadata, title: index.name }); } }
							]
						})
					}),
					new ui.MenuButton({
						label: i18n.text("IndexActionsMenu.Title"),
						menu: new ui.MenuPanel({
							items: [
								{ text: i18n.text("IndexActionsMenu.NewAlias"), onclick: function() { this._newAliasAction_handler(index); }.bind(this) },
								{ text: i18n.text("IndexActionsMenu.Refresh"), onclick: function() { this._postIndexAction_handler("_refresh", index, false); }.bind(this) },
								{ text: i18n.text("IndexActionsMenu.Flush"), onclick: function() { this._postIndexAction_handler("_flush", index, false); }.bind(this) },
								{ text: i18n.text("IndexActionsMenu.Snapshot"), disabled: closed, onclick: function() { this._postIndexAction_handler("_gateway/snapshot", index, false); }.bind(this) },
								{ text: i18n.text("IndexActionsMenu.Analyser"), onclick: function() { this._testAnalyser_handler(index); }.bind(this) },
								{ text: closed ? i18n.text("IndexActionsMenu.Open") : i18n.text("IndexActionsMenu.Close"), onclick: function() { this._postIndexAction_handler(closed ? "_open" : "_close", index, true); }.bind(this) },
								{ text: i18n.text("IndexActionsMenu.Delete"), onclick: function() { this._deleteIndexAction_handler(index); }.bind(this) }
							]
						})
					})
				] }
			]} : { tag: "TH" };
		},
		_alias_template: function(alias, row) {
			return { tag: "TR", children: [ { tag: "TD"	} ].concat(alias.indices.map(function(index, i) {
				if (index) {
					return {
						tag: "TD",
						css: { background: "#" + "9ce9c7fc9".substr((row+6)%7,3) },
						cls: "uiClusterOverview-hasAlias" + ( alias.min === i ? " min" : "" ) + ( alias.max === i ? " max" : "" ),
						text: alias.name,
						children: [
							{	tag: 'SPAN',
								text: i18n.text("General.CloseGlyph"),
								cls: 'uiClusterOverview-hasAlias-remove',
								onclick: function() {
									var command = {
										"actions" : [
											{ "remove" : { "index" : index.name, "alias" : alias.name } }
										]
									};
									this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
										alert(JSON.stringify(d));
										this.redraw("reset");
									}.bind(this) );
								}.bind(this)
							}
						]
					};
				}
				else {
					return { tag: "TD" };
				}
			},
			this)) };
		},
		_cluster_template: function(cluster, indices) {
			function nodeNameCmp(first, second) {
				if (!(first.cluster && second.cluster)) {
					return 0;
				}
				var a = first.cluster.name;
				var b = second.cluster.name;
				if (a.toString() < b.toString()) {
					return -1;
				}
				if (a.toString() > b.toString()) {
					return 1;
				}
				return 0;
			}
			return { tag: "TABLE", cls: "uiClusterOverview-cluster", children: [
				{ tag: "THEAD", child: { tag: "TR", children: indices.map(this._indexHeader_template, this) } },
				cluster.aliases.length && { tag: "TBODY", children: cluster.aliases.map(this._alias_template, this) },
				{ tag: "TBODY", children: cluster.nodes.sort(nodeNameCmp).map(this._node_template, this) }
			] };
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiClusterOverview", children: [
				new ui.Toolbar({
					label: i18n.text("Overview.PageTitle"),
					left: [
						new ui.Button({
							label: i18n.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						})
					],
					right: [
						this._compactToggle,
						this._refreshButton
					]
				}),
				{ tag: "DIV", cls: "uiClusterOverview-table" }
			] };
		}
	});

})( this.jQuery, this.app );