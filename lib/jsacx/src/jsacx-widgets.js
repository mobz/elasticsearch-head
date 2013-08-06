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

/**
 * base abstract class for all modal panels,
 * provides open, close, modal and panel stacking
 */
acx.ui.AbstractPanel = app.ui.AbstractWidget.extend({
	defaults: {
		body: null,            // initial content of the body
		modal: true,           // create a modal panel - creates a div that blocks interaction with page
		height: 'auto',        // panel height
		width: 400,            // panel width (in pixels)
		open: false,           // show the panel when it is created
		parent: 'BODY',        // node that panel is attached to
		autoRemove: false      // remove the panel from the dom and destroy it when the widget is closed
	},
	shared: {  // shared data for all instances of acx.ui.Panel and decendants
		stack: [], // array of all open panels
		modal: $( { tag: "DIV", id: "uiModal", css: { opacity: 0.2, position: "absolute", top: "0px", left: "0px" } } )
	},
	init: function() {
		this._super();
	},
	open: function(jEv) {
		this.el
			.css( { visibility: "hidden" } )
			.appendTo( $(this.config.parent) )
			.css( this._getPosition(jEv) )
			.css( { zIndex: (this.shared.stack.length ? (+this.shared.stack[this.shared.stack.length - 1].el.css("zIndex") + 10) : 100) } )
			.css( { visibility: "visible", display: "block" } );
		this.shared.stack.remove(this);
		this.shared.stack.push(this);
		this._setModal();
		$(document).bind("keyup", this._close_handler);
		this.fire("open", { source: this, event: jEv } );
		return this;
	},
	close: function(jEv) {
		var index = this.shared.stack.indexOf(this);
		if(index !== -1) {
			this.shared.stack.splice(index, 1);
			this.el.css( { left: "-2999px" } ); // move the dialog to the left rather than hiding to prevent ie6 rendering artifacts
			this._setModal();
			this.fire("close", { source: this,  event: jEv } );
			if(this.config.autoRemove) {
				this.remove();
			}
		}
		return this;
	},
	// close the panel and remove it from the dom, destroying it (you can not reuse the panel after calling remove)
	remove: function() {
		this.close();
		this.fire("remove", { source: this });
		this.el.remove();
	},
	// starting at the top of the stack, find the first panel that wants a modal and put it just underneath, otherwise remove the modal
	_setModal: function() {
		function docSize() {
			var de = document.documentElement;
			return acx.browser.msie ? // jquery incorrectly uses offsetHeight/Width for the doc size in IE
				acx.vector(Math.max(de.clientWidth, de.scrollWidth), Math.max(de.clientHeight, de.scrollHeight)) : $(document).vSize();
		}
		for(var stackPtr = this.shared.stack.length - 1; stackPtr >= 0; stackPtr--) {
			if(this.shared.stack[stackPtr].config.modal) {
				this.shared.modal
					.appendTo( document.body )
					.css( { zIndex: this.shared.stack[stackPtr].el.css("zIndex") - 5 } )
					.css( docSize().asSize() );
				return;
			}
		}
		this.shared.modal.remove(); // no panels that want a modal were found
	},
	_getPosition: function() {
		return $(window).vSize()                        // get the current viewport size
			.sub(this.el.vSize())                         // subtract the size of the panel
			.mod(function(s) { return s / 2; })           // divide by 2 (to center it)
			.add($(document).vScroll())                   // add the current scroll offset
			.mod(function(s) { return Math.max(5, s); })  // make sure the panel is not off the edge of the window
			.asOffset();                                  // and return it as a {top, left} object
	},
	_close_handler: function(jEv) {
		if(jEv.type === "keyup" && jEv.keyCode !== 27) { return; } // press esc key to close
		$(document).unbind("keyup", this._close_handler);
		this.close(jEv);
	}
});

/**
 * An acx.ui.AbstractPanel that adds a title bar, close box and drag functionality
 */
acx.ui.DraggablePanel = acx.ui.AbstractPanel.extend({
	defaults: {
//		title: ""   // (required) text for the panel title
	},
	init: function() {
		this._super();
		this.body = $(this._body_template());
		this.title = $(this._title_template());
		this.el = $( this._main_template() );
		this.el.css( { width: this.config.width } );
		this.dd = new app.ux.DragDrop({
			pickupSelector: this.el.find(".uiPanel-titleBar"),
			dragObj: this.el
		});
		// open the panel if set in configuration
		this.config.open && this.open();
	},

	theme: "",

	setBody: function(body) {
			this.body.empty().append(body);
	},
	_body_template: function() { return { tag: "DIV", cls: "uiPanel-body", css: { height: this.config.height + (this.config.height === 'auto' ? "" : "px" ) }, child: this.config.body }; },
	_title_template: function() { return { tag: "SPAN", cls: "uiPanel-title", text: this.config.title }; },
	_main_template: function() { return (
		{ tag: "DIV", id: this.id(), cls: "uiPanel " + this.theme, children: [
			{ tag: "DIV", cls: "uiPanel-titleBar", children: [
				{ tag: "DIV", cls: "uiPanel-close", onclick: this._close_handler, text: "x" },
				this.title
			]},
			this.body
		] }
	); }
});

acx.ui.InfoPanel = acx.ui.DraggablePanel.extend({
	theme: "dark"
});

acx.ui.DialogPanel = acx.ui.DraggablePanel.extend({
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

acx.ui.MenuPanel = acx.ui.AbstractPanel.extend({
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