(function( $, app ) {

	var ui = app.ns("ui");

	ui.MenuButton = app.ui.Button.extend({
		defaults: {
			menu: null
		},
		_baseCls: "uiButton uiMenuButton",
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

})( this.jQuery, this.app );
