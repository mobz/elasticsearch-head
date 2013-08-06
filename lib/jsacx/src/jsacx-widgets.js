var acx = window.acx || {};

/**
 * acx.ut namespace for small (non-stateful) templates
 * @namespace
 */
acx.ut = {};

acx.ut.option_template = function(v) { return { tag: "OPTION", value: v, text: v }; };
acx.ut.require_template = function(f) { return f.require ? { tag: "SPAN", cls: "require", text: "*" } : null; };
/**
 * acx.ux namespace for interface enhancements
 * @namespace
 */
acx.ux = {};

/**
 * acx.ui namespace for widget components
 * @namespace
 */
acx.ui = {};


acx.ui.InfoPanel = app.ui.DraggablePanel.extend({
	theme: "dark"
});

acx.ui.DialogPanel = app.ui.DraggablePanel.extend({
	_commit_handler: function(jEv) {
		this.fire("commit", this, { jEv: jEv });
	},
	_main_template: function() {
		var t = this._super();
		t.children.push(this._actionsBar_template());
		return t;
	},
	_actionsBar_template: function() {
		return { tag: "DIV", cls: "ui-right", children: [
			new app.ui.Button({ label: "Cancel", onclick: this._close_handler }),
			new app.ui.Button({ label: "OK", onclick: this._commit_handler })
		]};
	}
});

acx.ui.MenuPanel = app.ui.AbstractPanel.extend({
	defaults: {
		items: [],		// (required) an array of menu items
		modal: false
	},
	baseClass: "uiMenuPanel",
	init: function() {
		this._super();
		this.el = $(this._main_template());
	},
	open: function(jEv) {
		this._super(jEv);
		var cx = this; setTimeout(function() { $(document).bind("click", cx._close_handler); }, 50);
	},
	_close_handler: function(jEv) {
		this._super(jEv);
		$(document).unbind("click", this._close_handler);
	},
	_main_template: function() {
		return { tag: "DIV", cls: this.baseClass, children: this.config.items.map(this._menuItem_template, this) };
	},
	_menuItem_template: function(item) {
		var dx = item.disabled ? { onclick: function() {} } : {};
		return { tag: "LI", cls: "uiMenuPanel-item" + (item.disabled ? " disabled" : "") + (item.selected ? " selected" : ""), child: acx.extend({ tag: "DIV", cls: "uiMenuPanel-label" }, item, dx ) };
	},
	_getPosition: function(jEv) {
		var parent = $(jEv.target).closest("BUTTON");
		return parent.vOffset()
			.addY(parent.vSize().y)
			.asOffset();
	}
});

/**
 * widget for showing tabular data
 * @constructor
 */
acx.ui.Table = app.ui.AbstractWidget.extend({
	defaults: {
		store: null, // (required) implements interface app.data.DataSourceInterface
		height: 0,
		width: 0
	},
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
		this.el = $(this._main_template());
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
	_scroll_handler: function(jEv) {
		this.el.find(".uiTable-headers").scrollLeft(this.body.scrollLeft());
	},
	_dataClick_handler: function(jEv) {
		var row = $(jEv.target).closest("TR");
		if(row.length) {
			this.fire("rowClick", this, { row: row } );
		}
	},
	_headerClick_handler: function(jEv) {
		var header = $(jEv.target).closest("TH.uiTable-header-cell");
		if(header.length) {
			this.fire("headerClick", this, { header: header, column: header.data("column"), dir: header.data("dir") });
		}
	},
	_main_template: function() {
		return { tag: "DIV", id: this.id(), css: { width: this.config.width + "px" }, cls: "uiTable", children: [
			{ tag: "DIV", cls: "uiTable-tools" },
			{ tag: "DIV", cls: "uiTable-headers",
				onClick: this._headerClick_handler
			},
			{ tag: "DIV", cls: "uiTable-body",
				onClick: this._dataClick_handler,
				onScroll: this._scroll_handler,
				css: { height: this.config.height + "px", width: this.config.width + "px" }
			}
		] };
	},
	_header_template: function(columns) {
		var ret = { tag: "TABLE", child: this._headerRow_template(columns) };
		ret.child.children.push(this._headerEndCap_template());
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
		return { tag: "TH", cls: "uiTable-headerEndCap", child: { tag: "DIV" } };
	},
	_body_template: function(data, columns) {
		return { tag: "TABLE", children: []
			.concat(this._headerRow_template(columns))
			.concat(data.map(function(row) {
				return { tag: "TR", data: { row: row }, cls: "uiTable-row", children: columns.map(function(column){
					return { tag: "TD", cls: "uiTable-cell", child: { tag: "DIV", text: (row[column] || "").toString() } };
				})};
			}))
		};
	}

});