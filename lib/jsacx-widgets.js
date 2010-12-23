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

    el: null,       // this is the jquery wrapped dom element(s) that is the actual widget

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

