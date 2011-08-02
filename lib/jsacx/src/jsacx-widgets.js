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
 * a class for generating custom events in widgets
 */
acx.ux.Observable = acx.Class.extend((function() {
	function getObs(type) {
		return ( this.observers[type] || ( this.observers[type] = [] ) );
	}
	return {
		init: function() {
			this.observers = {};
			for(var opt in this.config) { // automatically install observers that are defined in the configuration
				if(opt.indexOf('on') === 0) {
					this.on(opt.substring(2).replace(/^[A-Z]/, function(a) { return a.toLowerCase(); }), this.config[opt]);
				}
			}
		},
		on: function(type, fn, params, thisp) { // on: synonymous with addEvent, addObserver, subscribe
			getObs.call(this, type).push( { cb : fn, args : params || [] , cx : thisp || this } );
			return this; // make observable functions chainable
		},
		fire: function(type) { // fire: synonymous with fireEvent, observe, publish
			var params = Array.prototype.slice.call(arguments, 1);
			getObs.call(this, type).slice().forEach(function(ob) {
				ob.cb.apply(ob.cx, ob.args.concat(params));
			});
			return this; // make observable functions chainable
		},
		removeAllObservers: function() {
			this.observers = {};
		},
		removeObserver: function(type, fn) {
			var obs = getObs.call(this, type), index = obs.reduce(function(p, t, i) { return (t.cb === fn) ? i : p }, -1 );
			if(index !== -1) {
				obs.splice(index, 1);
			}
			return this; // make observable functions chainable
		},
		hasObserver: function(type) {
			return !!getObs.call(this, type).length;
		}
	};
})());

/**
 * Provides drag and drop functionality<br>
 * a DragDrop instance is created for each usage pattern and then used over and over again<br>
 * first a dragObj is defined - this is the jquery node that will be dragged around<br>
 * second, the event callbacks are defined - these allow you control the ui during dragging and run functions when successfully dropping<br>
 * thirdly drop targets are defined - this is a list of DOM nodes, the constructor works in one of two modes:
 * <li>without targets - objects can be picked up and dragged around, dragStart and dragStop events fire</li>
 * <li>with targets - as objects are dragged over targets dragOver, dragOut and DragDrop events fire
 * to start dragging call the DragDrop.pickup_handler() function, dragging stops when the mouse is released.
 * @constructor
 * The following options are supported
 * <dt>targetSelector</dt>
 *   <dd>an argument passed directly to jquery to create a list of targets, as such it can be a CSS style selector, or an array of DOM nodes<br>if target selector is null the DragDrop does Drag only and will not fire dragOver dragOut and dragDrop events</dd>
 * <dt>pickupSelector</dt>
 *   <dd>a jquery selector. The pickup_handler is automatically bound to matched elements (eg clicking on these elements starts the drag). if pickupSelector is null, the pickup_handler must be manually bound <code>$(el).bind("mousedown", dragdrop.pickup_handler)</code></dd>
 * <dt>dragObj</dt>
 *   <dd>the jQuery element to drag around when pickup is called. If not defined, dragObj must be set in onDragStart</dd>
 * <dt>draggingClass</dt>
 *   <dd>the class(es) added to items when they are being dragged</dd>
 * The following observables are supported
 * <dt>dragStart</dt>
 *   <dd>a callback when start to drag<br><code>function(jEv)</code></dd>
 * <dt>dragOver</dt>
 *   <dd>a callback when we drag into a target<br><code>function(jEl)</code></dd>
 * <dt>dragOut</dt>
 *   <dd>a callback when we drag out of a target, or when we drop over a target<br><code>function(jEl)</code></dd>
 * <dt>dragDrop</dt>
 *   <dd>a callback when we drop on a target<br><code>function(jEl)</code></dd>
 * <dt>dragStop</dt>
 *   <dd>a callback when we stop dragging<br><code>function(jEv)</code></dd>
 */
acx.ux.DragDrop = acx.ux.Observable.extend({
    defaults : {
        targetsSelector : null,
        pickupSelector:   null,
        dragObj :         null,
        draggingClass :   "dragging"
    },

    init: function(options) {
        this._super(); // call the class initialiser
    
        this.drag_handler = this.drag.bind(this);
        this.drop_handler = this.drop.bind(this);
        this.pickup_handler = this.pickup.bind(this);
        this.targets = [];
        this.dragObj = null;
        this.dragObjOffset = null;
        this.currentTarget = null;
        if(this.config.pickupSelector) {
            $(this.config.pickupSelector).bind("mousedown", this.pickup_handler);
        }
    },

    drag : function(jEv) {
        jEv.preventDefault();
        var mloc = acx.vector(jEv.pageX, jEv.pageY);
        this.dragObj.css(mloc.add(this.dragObjOffset).asOffset());
        if(this.targets.length === 0) {
            return;
        }
        if(this.currentTarget !== null && mloc.within(this.currentTarget[1], this.currentTarget[2])) {
            return;
        }
        if(this.currentTarget !== null) {
            this.fire('dragOut', this.currentTarget[0]);
            this.currentTarget = null;
        }
        for(var i = 0; i < this.targets.length; i++) {
            if(mloc.within(this.targets[i][1], this.targets[i][2])) {
                this.currentTarget = this.targets[i];
                break;
            }
        }
        if(this.currentTarget !== null) {
            this.fire('dragOver', this.currentTarget[0]);
        }
    },
    
    drop : function(jEv) {
        $(document).unbind("mousemove", this.drag_handler);
        $(document).unbind("mouseup", this.drop_handler);
        this.dragObj.removeClass(this.config.draggingClass);
        if(this.currentTarget !== null) {
            this.fire('dragOut', this.currentTarget[0]);
            this.fire('dragDrop', this.currentTarget[0]);
        }
        this.fire('dragStop', jEv);
        this.dragObj = null;
    },
    
    pickup : function(jEv, opts) {
        acx.extend(this.config, opts);
        this.fire('dragStart', jEv);
        this.dragObj = this.dragObj || this.config.dragObj;
        this.dragObjOffset = this.config.dragObjOffset || acx.vector(this.dragObj.offset()).sub(jEv.pageX, jEv.pageY);
        this.dragObj.addClass(this.config.draggingClass);
        if(!this.dragObj.get(0).parentNode || this.dragObj.get(0).parentNode.nodeType === 11) { // 11 = document fragment
            $(document.body).append(this.dragObj);
        }
        if(this.config.targetsSelector) {
            this.currentTarget = null;
            var targets = ( this.targets = [] );
            // create an array of elements optimised for rapid collision detection calculation
            $(this.config.targetsSelector).each(function(i, el) {
                var jEl = $(el);
                var tl = acx.vector(jEl.offset());
                var br = tl.add(jEl.width(), jEl.height());
                targets.push([jEl, tl, br]);
            });
        }
        $(document).bind("mousemove", this.drag_handler);
        $(document).bind("mouseup", this.drop_handler);
        this.drag_handler(jEv);
    }
});

/**
 * acx.ui namespace for widget components
 * @namespace
 */
acx.ui = {};

/**
 * base class for all widgets
 * provides: base element definition, automatic observable creation, bound function handlers
 * @constructor
 */
acx.ui.Widget = acx.ux.Observable.extend({
	defaults : {
		id: null     // the id of the widget
	},

	el: null,       // this is the jquery wrapped dom element(s) that is the root of the widget

	init: function() {
		this._super();
		for(var prop in this) {       // automatically bind all the event handlers
			if(prop.contains("_handler")) {
				this[prop] = this[prop].bind(this);
			}
		}
	},

	id: function(suffix) {
		return this.config.id ? (this.config.id + (suffix ? "-" + suffix : "")) : undefined;
	},

	appendTo: function(parent) {
		if(parent) {
			this.el.appendTo(parent);
		}
		return this;
	},

	remove: function() {
		this.el.remove();
		this.removeAllObservers();
		return this;
	}
});

acx.ui.Toolbar = acx.ui.Widget.extend({
	defaults: {
		label: "",
		left: [],
		right: []
	},
	init: function(parent) {
		this._super();
		this.el = $(this._main_template());
	},
	_main_template: function() {
		return { tag: "DIV", cls: "uiToolbar", children: [
			{ tag: "DIV", cls: "ui-left", children: [
				{ tag: "H2", text: this.config.label }
			].concat(this.config.left) },
			{ tag: "DIV", cls: "ui-right", children: this.config.right },
		]};
	}
});

/**
 * Button widget
 */
acx.ui.Button = acx.ui.Widget.extend({
	defaults : {
		label: "",                 // the label text
		disabled: false,           // create a disabled button
		autoDisable: false         // automatically disable the button when clicked
	},

	baseClass: "uiButton",

	init: function(parent) {
		this._super();
		this.el = $(this.button_template())
			.bind("click", this.click_handler);
		this.config.disabled && this.disable();
		this.appendTo(parent);
	},

	click_handler: function(jEv) {
		if(! this.disabled) {
			this.fire("click", jEv, this);
			this.config.autoDisable && this.disable();
		}
	},

	enable: function() {
		this.el.removeClass("disabled");
		this.disabled = false;
		return this;
	},

	disable: function(disable) {
		if(disable === false) {
				return this.enable();
		}
		this.el.addClass("disabled");
		this.disabled = true;
		return this;
	},

	button_template: function() { return (
		{ tag: 'BUTTON', type: 'button', id: this.id(), cls: this.baseClass, child:
			{ tag: 'DIV', cls: 'uiButton-content', child:
				{ tag: 'DIV', cls: 'uiButton-label', text: this.config.label }
			}
		}
	); }
});


/**
 * base abstract class for all modal panels,
 * provides open, close, modal and panel stacking
 */
acx.ui.AbstractPanel = acx.ui.Widget.extend({
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
			.mod(function(s) { return s / 2 })            // divide by 2 (to center it)
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
		this.dd = new acx.ux.DragDrop({
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
		t.children.push(this._actionsBar_template())
		return t;
	},
	_actionsBar_template: function() {
		return { tag: "DIV", cls: "ui-right", children: [
			new acx.ui.Button({ label: "Cancel", onclick: this._close_handler }),
			new acx.ui.Button({ label: "OK", onclick: this._commit_handler }) 
		]};
	}
});

acx.ui.MenuPanel = acx.ui.AbstractPanel.extend({
	defaults: {
		items: [],		// (required) an array of menu items
		modal: false
	},
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
		return { tag: "DIV", cls: "uiMenuPanel", children: this.config.items.map(this._menuItem_template, this) };
	},
	_menuItem_template: function(item) {
		var dx = item.disabled ? { onclick: function() {} } : {};
		return { tag: "LI", cls: "uiMenuPanel-item" + (item.disabled ? " disabled" : ""), child: acx.extend({ tag: "DIV", cls: "uiMenuPanel-label" }, item, dx ) };
	},
	_getPosition: function(jEv) {
		var parent = $(jEv.target).closest("BUTTON");
		return parent.vOffset()
			.addY(parent.vSize().y)
			.asOffset();
	}
});

acx.ui.MenuButton = acx.ui.Button.extend({
	defaults: {
		menu: null
	},
	baseClass: "uiButton uiMenuButton",
	init: function(parent) {
		this._super(parent);
		this.menu = this.config.menu;
		this.on("click", this.openMenu_handler);
		this.menu.on("open", function() { this.el.addClass("active"); }.bind(this));
		this.menu.on("close", function() { this.el.removeClass("active"); }.bind(this));
	},
	openMenu_handler: function(jEv) {
		this.menu && this.menu.open(jEv);
	}
});

/**
 * widget for showing tabular data
 * @constructor
 */
acx.ui.Table = acx.ui.Widget.extend({
	defaults: {
		store: null, // (required) implements interface acx.data.DataSourceInterface
		height: 0,
		width: 0
	},
	init: function(parent) {
		this._super();
		this.initElements(parent);
		this.config.store.on("data", this._data_handler);
	},
	appendTo: function(parent) {
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
		this.appendTo(parent);
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
		var ret = { tag: "TABLE", child: this._headerRow_template(columns) }
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