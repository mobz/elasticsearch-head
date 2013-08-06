(function( $, app ) {

	var ui = app.ns("ui");

	ui.DraggablePanel = ui.AbstractPanel.extend({
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

})( this.jQuery, this.app );