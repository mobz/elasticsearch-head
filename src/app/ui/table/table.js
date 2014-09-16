( function( $, app ) {

	var ui = app.ns("ui");

	ui.Table = ui.AbstractWidget.extend({
		defaults: {
			store: null, // (required) implements interface app.data.DataSourceInterface
			height: 0,
			width: 0
		},
		_baseCls: "uiTable",
		init: function(parent) {
			this._super();
			this.initElements(parent);
			this.config.store.on("data", this._data_handler);
		},
		attach: function(parent) {
			if(parent) {
				this._super(parent);
				this._reflow();
			}
		},
		initElements: function(parent) {
			this.el = $.joey(this._main_template());
			this.body = this.el.find(".uiTable-body");
			this.headers = this.el.find(".uiTable-headers");
			this.tools = this.el.find(".uiTable-tools");
			this.attach( parent );
		},
		_data_handler: function(store) {
			this.tools.text(store.summary);
			this.headers.empty().append(this._header_template(store.columns));
			this.body.empty().append(this._body_template(store.data, store.columns));
			this._reflow();
		},
		_reflow: function() {
			var firstCol = this.body.find("TR:first TH.uiTable-header-cell > DIV"),
					headers = this.headers.find("TR:first TH.uiTable-header-cell > DIV");
			for(var i = 0; i < headers.length; i++) {
				$(headers[i]).width( $(firstCol[i]).width() );
			}
			this._scroll_handler();
		},
		_scroll_handler: function(ev) {
			this.el.find(".uiTable-headers").scrollLeft(this.body.scrollLeft());
		},
		_dataClick_handler: function(ev) {
			var row = $(ev.target).closest("TR");
			if(row.length) {
				this.fire("rowClick", this, { row: row } );
			}
		},
		_headerClick_handler: function(ev) {
			var header = $(ev.target).closest("TH.uiTable-header-cell");
			if(header.length) {
				this.fire("headerClick", this, { header: header, column: header.data("column"), dir: header.data("dir") });
			}
		},
		_main_template: function() {
			return { tag: "DIV", id: this.id(), css: { width: this.config.width + "px" }, cls: this._baseCls, children: [
				{ tag: "DIV", cls: "uiTable-tools" },
				{ tag: "DIV", cls: "uiTable-headers", onclick: this._headerClick_handler },
				{ tag: "DIV", cls: "uiTable-body",
					onclick: this._dataClick_handler,
					onscroll: this._scroll_handler,
					css: { height: this.config.height + "px", width: this.config.width + "px" }
				}
			] };
		},
		_header_template: function(columns) {
			var ret = { tag: "TABLE", children: [ this._headerRow_template(columns) ] };
			ret.children[0].children.push(this._headerEndCap_template());
			return ret;
		},
		_headerRow_template: function(columns) {
			return { tag: "TR", cls: "uiTable-header-row", children: columns.map(function(column) {
				var dir = ((this.config.store.sort.column === column) && this.config.store.sort.dir) || "none";
				return { tag: "TH", data: { column: column, dir: dir }, cls: "uiTable-header-cell" + ((dir !== "none") ? " uiTable-sort" : ""), children: [
					{ tag: "DIV", children: [
						{ tag: "DIV", cls: "uiTable-headercell-menu", text: dir === "asc" ? "\u25b2" : "\u25bc" },
						{ tag: "DIV", cls: "uiTable-headercell-text", text: column }
					]}
				]};
			}, this)};
		},
		_headerEndCap_template: function() {
			return { tag: "TH", cls: "uiTable-headerEndCap", children: [ { tag: "DIV" } ] };
		},
		_body_template: function(data, columns) {
			return { tag: "TABLE", children: []
				.concat(this._headerRow_template(columns))
				.concat(data.map(function(row) {
					return { tag: "TR", data: { row: row }, cls: "uiTable-row", children: columns.map(function(column){
						return { tag: "TD", cls: "uiTable-cell", children: [ { tag: "DIV", text: (row[column] || "").toString() } ] };
					})};
				}))
			};
		}

	});

})( this.jQuery, this.app );
