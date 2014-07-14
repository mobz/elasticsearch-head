(function( $, joey, app ) {

	var ui = app.ns("ui");

	ui.Button = ui.AbstractWidget.extend({
		defaults : {
			label: "",                 // the label text
			disabled: false,           // create a disabled button
			autoDisable: false         // automatically disable the button when clicked
		},

		_baseCls: "uiButton",

		init: function(parent) {
			this._super();
			this.el = $.joey(this.button_template())
				.bind("click", this.click_handler);
			this.config.disabled && this.disable();
			this.attach( parent );
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
			{ tag: 'BUTTON', type: 'button', id: this.id(), cls: this._baseCls, children: [
				{ tag: 'DIV', cls: 'uiButton-content', children: [
					{ tag: 'DIV', cls: 'uiButton-label', text: this.config.label }
				] }
			] }
		); }
	});

})( this.jQuery, this.joey, this.app );
