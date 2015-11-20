(function( app, i18n, joey ) {

	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.NodesView = ui.AbstractWidget.extend({
		defaults: {
			interactive: true,
			aliasRenderer: "list",
			scaleReplicas: 1,
			cluster: null,
			data: null
		},
		init: function() {
			this._super();
			this.interactive = this.config.interactive;
			this.cluster = this.config.cluster;
			this._aliasRenderFunction = {
				"none": this._aliasRender_template_none,
				"list": this._aliasRender_template_list,
				"full": this._aliasRender_template_full
			}[ this.config.aliasRenderer ];
			this._styleSheetEl = joey({ tag: "STYLE", text: ".uiNodesView-nullReplica, .uiNodesView-replica { zoom: " + this.config.scaleReplicas + " }" });
			this.el = $( this._main_template( this.config.data.cluster, this.config.data.indices ) );
		},

		_newAliasAction_handler: function( index ) {
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
							this.fire("redraw");
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_postIndexAction_handler: function(action, index, redraw) {
			this.cluster.post(index.name + "/" + action, null, function(r) {
				alert(JSON.stringify(r));
				redraw && this.fire("redraw");
			}.bind(this));
		},
		_optimizeIndex_handler: function(index) {
			var fields = new app.ux.FieldCollection({
				fields: [
					new ui.TextField({ label: i18n.text("OptimizeForm.MaxSegments"), name: "max_num_segments", value: "1", require: true }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.ExpungeDeletes"), name: "only_expunge_deletes", value: false }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.FlushAfter"), name: "flush", value: true }),
					new ui.CheckField({ label: i18n.text("OptimizeForm.WaitForMerge"), name: "wait_for_merge", value: false })
				]
			});
			var dialog = new ui.DialogPanel({
				title: i18n.text("OptimizeForm.OptimizeIndex", index.name),
				body: new ui.PanelForm({ fields: fields }),
				onCommit: function( panel, args ) {
					if(fields.validate()) {
						this.cluster.post(index.name + "/_optimize", fields.getData(), function(r) {
							alert(JSON.stringify(r));
						});
						dialog.close();
					}
				}.bind(this)
			}).open();
		},
		_testAnalyser_handler: function(index) {
			this.cluster.get(index.name + "/_analyze?text=" + prompt( i18n.text("IndexCommand.TextToAnalyze") ), function(r) {
				alert(JSON.stringify(r, true, "  "));
			});
		},
		_deleteIndexAction_handler: function(index) {
			if( prompt( i18n.text("AliasForm.DeleteAliasMessage", i18n.text("Command.DELETE"), index.name ) ) === i18n.text("Command.DELETE") ) {
				this.cluster["delete"](index.name, null, function(r) {
					alert(JSON.stringify(r));
					this.fire("redraw");
				}.bind(this) );
			}
		},
		_shutdownNode_handler: function(node) {
			if(prompt( i18n.text("IndexCommand.ShutdownMessage", i18n.text("Command.SHUTDOWN"), node.cluster.name ) ) === i18n.text("Command.SHUTDOWN") ) {
				this.cluster.post( "_cluster/nodes/" + node.name + "/_shutdown", null, function(r) {
					alert(JSON.stringify(r));
					this.fire("redraw");
				}.bind(this));
			}
		},
		_deleteAliasAction_handler: function( index, alias ) {
			if( confirm( i18n.text("Command.DeleteAliasMessage" ) ) ) {
				var command = {
					"actions" : [
						{ "remove" : { "index" : index.name, "alias" : alias.name } }
					]
				};
				this.config.cluster.post('_aliases', JSON.stringify(command), function(d) {
					alert(JSON.stringify(d));
					this.fire("redraw");
				}.bind(this) );
			}
		},

		_replica_template: function(replica) {
			var r = replica.replica;
			return { tag: "DIV",
				cls: "uiNodesView-replica" + (r.primary ? " primary" : "") + ( " state-" + r.state ),
				text: r.shard.toString(),
				onclick: function() { new ui.JsonPanel({
					json: replica.status || r,
					title: r.index + "/" + r.node + " [" + r.shard + "]" });
				}
			};
		},
		_routing_template: function(routing) {
			var cell = { tag: "TD", cls: "uiNodesView-routing" + (routing.open ? "" : " close"), children: [] };
			for(var i = 0; i < routing.replicas.length; i++) {
				if(i % routing.max_number_of_shards === 0 && i > 0) {
					cell.children.push({ tag: "BR" });
				}
				if( routing.replicas[i] ) {
					cell.children.push(this._replica_template(routing.replicas[i]));
				} else {
					cell.children.push( { tag: "DIV", cls: "uiNodesView-nullReplica" } );
				}
			}
			return cell;
		},
		_nodeControls_template: function( node ) { return (
			{ tag: "DIV", cls: "uiNodesView-controls", children: [
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
							{ text: i18n.text("NodeActionsMenu.Shutdown"), onclick: function() { this._shutdownNode_handler(node); }.bind(this) }
						]
					})
				})
			] }
		); },
		_nodeIcon_template: function( node ) {
			var icon, alt;
			if( node.name === "Unassigned" ) {
				icon = "fa-exclamation-triangle";
				alt = i18n.text( "NodeType.Unassigned" );
			} else if( node.cluster.settings && "tribe" in node.cluster.settings) {
				icon = "fa-sitemap";
				alt = i18n.text("NodeType.Tribe" );
			} else {
				icon = "fa-" + (node.master_node ? "star" : "circle") + (node.data_node ? "" : "-o" );
				alt = i18n.text( node.master_node ? ( node.data_node ? "NodeType.Master" : "NodeType.Coord" ) : ( node.data_node ? "NodeType.Worker" : "NodeType.Client" ) );
			}
			return { tag: "TD", title: alt, cls: "uiNodesView-icon", children: [
				{ tag: "SPAN", cls: "fa fa-2x " + icon }
			] };
		},
		_node_template: function(node) {
			return { tag: "TR", cls: "uiNodesView-node" + (node.master_node ? " master": ""), children: [
				this._nodeIcon_template( node ),
				{ tag: "TH", children: node.name === "Unassigned" ? [
					{ tag: "H3", text: node.name }
				] : [
					{ tag: "H3", text: node.cluster.name },
					{ tag: "DIV", text: node.cluster.hostname },
					this.interactive ? this._nodeControls_template( node ) : null
				] }
			].concat(node.routings.map(this._routing_template, this))};
		},
		_indexHeaderControls_template: function( index ) { return (
			{ tag: "DIV", cls: "uiNodesView-controls", children: [
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
							{ text: i18n.text("IndexActionsMenu.Optimize"), onclick: function () { this._optimizeIndex_handler(index); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Snapshot"), disabled: closed, onclick: function() { this._postIndexAction_handler("_gateway/snapshot", index, false); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Analyser"), onclick: function() { this._testAnalyser_handler(index); }.bind(this) },
							{ text: (index.state === "close") ? i18n.text("IndexActionsMenu.Open") : i18n.text("IndexActionsMenu.Close"), onclick: function() { this._postIndexAction_handler((index.state === "close") ? "_open" : "_close", index, true); }.bind(this) },
							{ text: i18n.text("IndexActionsMenu.Delete"), onclick: function() { this._deleteIndexAction_handler(index); }.bind(this) }
						]
					})
				})
			] }
		); },
		_indexHeader_template: function( index ) {
			var closed = index.state === "close";
			var line1 = closed ? "index: close" : ( "size: " + (index.status && index.status.primaries && index.status.total ? ut.byteSize_template( index.status.primaries.store.size_in_bytes ) + " (" + ut.byteSize_template( index.status.total.store.size_in_bytes ) + ")" : "unknown" ) );
			var line2 = closed ? "\u00A0" : ( "docs: " + (index.status && index.status.primaries && index.status.primaries.docs && index.status.total && index.status.total.docs ? index.status.primaries.docs.count.toLocaleString() + " (" + (index.status.total.docs.count + index.status.total.docs.deleted).toLocaleString() + ")" : "unknown" ) );
			return index.name ? { tag: "TH", cls: (closed ? "close" : ""), children: [
				{ tag: "H3", text: index.name },
				{ tag: "DIV", text: line1 },
				{ tag: "DIV", text: line2 },
				this.interactive ? this._indexHeaderControls_template( index ) : null
			] } : [ { tag: "TD" }, { tag: "TH" } ];
		},
		_aliasRender_template_none: function( cluster, indices ) {
			return null;
		},
		_aliasRender_template_list: function( cluster, indices ) {
			return cluster.aliases.length && { tag: "TBODY", children: [
				{ tag: "TR", children: [
					{ tag: "TD" }
				].concat( indices.map( function( index ) {
					return { tag: "TD", children: index.metadata && index.metadata.aliases.map( function( alias ) {
						return { tag: "LI", text: alias };
					} ) };
				})) }
			] };
		},
		_aliasRender_template_full: function( cluster, indices ) {
			return cluster.aliases.length && { tag: "TBODY", children: cluster.aliases.map( function(alias, row) {
				return { tag: "TR", children: [ { tag: "TD" },{ tag: "TD" } ].concat(alias.indices.map(function(index, i) {
					if (index) {
						return {
							tag: "TD",
							css: { background: "#" + "9ce9c7fc9".substr((row+6)%7,3) },
							cls: "uiNodesView-hasAlias" + ( alias.min === i ? " min" : "" ) + ( alias.max === i ? " max" : "" ),
							text: alias.name,
							children: this.interactive ? [
								{	tag: 'SPAN',
									text: i18n.text("General.CloseGlyph"),
									cls: 'uiNodesView-hasAlias-remove',
									onclick: this._deleteAliasAction_handler.bind( this, index, alias )
								}
							]: null
						};
					}	else {
						return { tag: "TD" };
					}
				}, this ) ) };
			}, this )	};
		},
		_main_template: function(cluster, indices) {
			return { tag: "TABLE", cls: "table uiNodesView", children: [
				this._styleSheetEl,
				{ tag: "THEAD", children: [ { tag: "TR", children: indices.map(this._indexHeader_template, this) } ] },
				this._aliasRenderFunction( cluster, indices ),
				{ tag: "TBODY", children: cluster.nodes.map(this._node_template, this) }
			] };
		}

	});

})( this.app, this.i18n, this.joey );
