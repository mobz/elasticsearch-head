(function( app ) {

	var ui = app.ns("ui");

	ui.MenuPanel = ui.AbstractPanel.extend({
		defaults: {
			items: [],		// (required) an array of menu items
			modal: false
		},
		_baseCls: "uiMenuPanel",
		init: function() {
			this._super();
			this.el = $(this._main_template());
		},
		open: function(jEv) {
			this._super(jEv);
			var cx = this; setTimeout(function() { $(document).bind("click", cx._close_handler); }, 50);
		},
		_getItems: function() {
			return this.config.items;
		},
		_close_handler: function(jEv) {
			this._super(jEv);
			$(document).unbind("click", this._close_handler);
		},
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: this._getItems().map(this._menuItem_template, this) };
		},
		_menuItem_template: function(item) {
			var dx = item.disabled ? { onclick: function() {} } : {};
			return { tag: "LI", cls: "uiMenuPanel-item" + (item.disabled ? " disabled" : "") + (item.selected ? " selected" : ""), children: [ $.extend({ tag: "DIV", cls: "uiMenuPanel-label" }, item, dx ) ] };
		},
		_getPosition: function(jEv) {
			var right = !! $(jEv.target).parents(".pull-right").length;
			var parent = $(jEv.target).closest("BUTTON");
			return parent.vOffset()
				.addY(parent.vSize().y)
				.addX( right ? parent.vSize().x - this.el.vOuterSize().x : 0 )
				.asOffset();
		}
	});

})( this.app );
