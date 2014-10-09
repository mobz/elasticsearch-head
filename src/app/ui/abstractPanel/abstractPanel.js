(function( $, app ) {

	var ui = app.ns("ui");

	ui.AbstractPanel = ui.AbstractWidget.extend({
		defaults: {
			body: null,            // initial content of the body
			modal: true,           // create a modal panel - creates a div that blocks interaction with page
			height: 'auto',        // panel height
			width: 400,            // panel width (in pixels)
			open: false,           // show the panel when it is created
			parent: 'BODY',        // node that panel is attached to
			autoRemove: false      // remove the panel from the dom and destroy it when the widget is closed
		},
		shared: {  // shared data for all instances of ui.Panel and decendants
			stack: [], // array of all open panels
			modal: $( { tag: "DIV", id: "uiModal", css: { opacity: 0.2, position: "absolute", top: "0px", left: "0px" } } )
		},
		init: function() {
			this._super();
		},
		open: function( ev ) {
			this.el
				.css( { visibility: "hidden" } )
				.appendTo( this.config.parent )
				.css( this._getPosition( ev ) )
				.css( { zIndex: (this.shared.stack.length ? (+this.shared.stack[this.shared.stack.length - 1].el.css("zIndex") + 10) : 100) } )
				.css( { visibility: "visible", display: "block" } );
			this.shared.stack.remove(this);
			this.shared.stack.push(this);
			this._setModal();
			$(document).bind("keyup", this._close_handler );
			this.fire("open", { source: this, event: ev } );
			return this;
		},
		close: function() {
			var index = this.shared.stack.indexOf(this);
			if(index !== -1) {
				this.shared.stack.splice(index, 1);
				this.el.css( { left: "-2999px" } ); // move the dialog to the left rather than hiding to prevent ie6 rendering artifacts
				this._setModal();
				this.fire("close", this );
				if(this.config.autoRemove) {
					this.remove();
				}
			}
			return this;
		},
		// close the panel and remove it from the dom, destroying it (you can not reuse the panel after calling remove)
		remove: function() {
			this.close();
			$(document).unbind("keyup", this._close_handler );
			this._super();
		},
		// starting at the top of the stack, find the first panel that wants a modal and put it just underneath, otherwise remove the modal
		_setModal: function() {
			for(var stackPtr = this.shared.stack.length - 1; stackPtr >= 0; stackPtr--) {
				if(this.shared.stack[stackPtr].config.modal) {
					this.shared.modal
						.appendTo( document.body )
						.css( { zIndex: this.shared.stack[stackPtr].el.css("zIndex") - 5 } )
						.css( $(document).vSize().asSize() );
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
		_close_handler: function( ev ) {
			if( ev.type === "keyup" && ev.keyCode !== 27) { return; } // press esc key to close
			$(document).unbind("keyup", this._close_handler);
			this.close( ev );
		}
	});

})( this.jQuery, this.app );
