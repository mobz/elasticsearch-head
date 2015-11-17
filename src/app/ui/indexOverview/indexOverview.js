(function( $, app, i18n ) {
	
	var ui = app.ns("ui");
	var ut = app.ns("ut");

	ui.IndexOverview = ui.Page.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this._clusterState = this.config.clusterState;
			this._clusterState.on("data", this._refresh_handler );
			this.el = $(this._main_template());
			this._refresh_handler();
		},
		remove: function() {
			this._clusterState.removeObserver( "data", this._refresh_handler );
		},
		_refresh_handler: function() {
			var state = this._clusterState;
			var view = {
				indices: acx.eachMap( state.status.indices, function( name, index ) {
					return {
						name: name,
						state: index
					};
				}).sort( function( a, b ) {
					return a.name < b.name ? -1 : 1;
				})
			};
			this._indexViewEl && this._indexViewEl.remove();
			this._indexViewEl = $( this._indexTable_template( view ) );
			this.el.find(".uiIndexOverview-table").append( this._indexViewEl );
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
							this._clusterState.refresh();
						}.bind(this) );
					}
				}.bind(this)
			}).open();
		},
		_indexTable_template: function( view ) { return (
			{ tag: "TABLE", cls: "table", children: [
				{ tag: "THEAD", children: [
					{ tag: "TR", children: [
						{ tag: "TH" },
						{ tag: "TH", children: [
							{ tag: "H3", text: "Size" }
						] },
						{ tag: "TH", children: [
							{ tag: "H3", text: "Docs" }
						] }
					] }
				] },
				{ tag: "TBODY", cls: "striped", children: view.indices.map( this._index_template, this ) }
			] }
		); },

		_index_template: function( index ) { return (
			{ tag: "TR", children: [
				{ tag: "TD", children: [
					{ tag: "H3", text: index.name }
				] },
				{ tag: "TD", text: ut.byteSize_template( index.state.primaries.store.size_in_bytes ) + "/" + ut.byteSize_template( index.state.total.store.size_in_bytes ) },
				{ tag: "TD", text: ut.count_template( index.state.primaries.docs.count ) }
			] }
		); },
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiIndexOverview", children: [
				new ui.Toolbar({
					label: i18n.text("IndexOverview.PageTitle"),
					left: [
						new ui.Button({
							label: i18n.text("ClusterOverview.NewIndex"),
							onclick: this._newIndex_handler
						}),
					]
				}),
				{ tag: "DIV", cls: "uiIndexOverview-table", children: this._indexViewEl }
			] };
		}

	});

})( this.jQuery, this.app, this.i18n );
