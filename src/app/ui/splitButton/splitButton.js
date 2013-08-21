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
			this.items = this.config.items.map( function( item ) {
				return {
					text: item.label,
					selected: item.selected,
					onclick: function( jEv ) {
						var el = $( jEv.target ).closest("LI");
						el.parent().children().removeClass("selected");
						el.addClass("selected");
						this.fire( "select", this, { value: item.value } );
						this.value = item.value;
					}.bind(this)
				};
			}, this );
			this.value = null;
			this.button = new ui.Button({
				label: this.config.label,
				onclick: function() {
					this.fire("click", this, { value: this.value } );
				}.bind(this)
			});
			this.menuButton = new ui.MenuButton({
				label: "\u00a0",
				menu: new (app.ui.MenuPanel.extend({
					_baseCls: "uiSplitButton-panel uiMenuPanel"
				}))({
					items: this.items
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
