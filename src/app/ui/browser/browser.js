(function( $, app, i18n ){

	var ui = app.ns("ui");
	var data = app.ns("data");

	ui.Browser = ui.Page.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.query = new app.data.Query( { cluster: this.cluster } );
			this._refreshButton = new ui.Button({
				label: i18n.text("General.RefreshResults"),
				onclick: function( btn ) {
					this.query.query();
				}.bind(this)
			});
			this.el = $(this._main_template());
			new data.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new data.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.queryFilter = new ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.attach(this.el.find("> .uiBrowser-filter") );
					this.resultTable = new ui.ResultTable( {
						onHeaderClick: this._changeSort_handler,
						store: this.store
					} );
					this.resultTable.attach( this.el.find("> .uiBrowser-table") );
					this.updateResults();
				}.bind(this)
			});
		},
		updateResults: function() {
			this.query.query();
		},
		_changeSort_handler: function(table, wEv) {
			this.query.setSort(wEv.column, wEv.dir === "desc");
			this.query.setPage(1);
			this.query.query();
		},
		_main_template: function() {
			return { tag: "DIV", cls: "uiBrowser", children: [
				new ui.Toolbar({
					label: i18n.text("Browser.Title"),
					left: [ ],
					right: [ this._refreshButton ]
				}),
				{ tag: "DIV", cls: "uiBrowser-filter" },
				{ tag: "DIV", cls: "uiBrowser-table" }
			] };
		}
	});

})( this.jQuery, this.app, this.i18n );
