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
				onclick: function() {
					this.fire("click", this, { value: this.value } );
				}.bind(this)
			});
			this.menuButton = new ui.MenuButton({
				label: "\u00a0",
				menu: new ui.SelectMenuPanel({
					value: this.config.value,
					items: this.config.items,
					onSelect: function( panel, event ) {
						this.fire( "select", this, event );
					}.bind(this)
				})
			});
			this.el = $(this._main_template());
		},
		disable: function() {
			this.button.disable();
		},
		enable: function() {
			this.button.enable();
		},
		_main_template: function() {
			return { tag: "DIV", cls: this._baseCls, children: [
				this.button, this.menuButton
			] };
		}
	});

})( this.jQuery, this.app );
