(function( $, app ) {

	var ui = app.ns("ui");

	ui.SplitButton = ui.AbstractWidget.extend({
		defaults: {
			items: [],
			label: ""
		},
		_baseCls: "uiSplitButton",
		init: function( parent ) {
			this._super( parent );
			this.value = null;
			this.button = new ui.Button({
				label: this.config.label,
				onclick: this._click_handler
			});
			this.menu = new ui.SelectMenuPanel({
				value: this.config.value,
				items: this._getItems(),
				onSelect: this._select_handler
			});
			this.menuButton = new ui.MenuButton({
				label: "\u00a0",
				menu: this.menu
			});
			this.el = $.joey(this._main_template());
		},
		remove: function() {
			this.menu.remove();
		},
		disable: function() {
			this.button.disable();
		},
		enable: function() {
			this.button.enable();
		},
		_click_handler: function() {
			this.fire("click", this, { value: this.value } );
		},
		_select_handler: function( panel, event ) {
			this.fire( "select", this, event );
		},
		_getItems: function() {
			return this.config.items;
		},
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: [
				this.button, this.menuButton
			] };
		}
	});

})( this.jQuery, this.app );
