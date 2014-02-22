(function( app ) {

	var ui = app.ns("ui");

	ui.SelectMenuPanel = ui.MenuPanel.extend({
		defaults: {
			items: [],		// (required) an array of menu items
			value: null
		},
		_baseCls: "uiSelectMenuPanel uiMenuPanel",
		init: function() {
			this.value = this.config.value;
			this._super();
		},
		_getItems: function() {
			return this.config.items.map( function( item ) {
				return {
					text: item.text,
					selected: this.value === item.value,
					onclick: function( jEv ) {
						var el = $( jEv.target ).closest("LI");
						el.parent().children().removeClass("selected");
						el.addClass("selected");
						this.fire( "select", this, { value: item.value } );
						this.value = item.value;
					}.bind(this)
				};
			}, this );

		}
	});

})( this.app );
