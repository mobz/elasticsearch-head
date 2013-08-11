(function( $, app ) {

	var ui = app.ns("ui");

	ui.SidebarSection = ui.AbstractWidget.extend({
		defaults: {
			title: "",
			help: null,
			body: null,
			open: false
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.body = this.el.children(".sidebarSection-body");
			this.config.open && ( this.el.addClass("shown") && this.body.css("display", "block") );
		},
		_showSection_handler: function(jEv) {
			var shown = $(jEv.target).closest(".sidebarSection")
				.toggleClass("shown")
					.children(".sidebarSection-body").slideToggle(200, function() { this.fire("animComplete", this); }.bind(this))
				.end()
				.hasClass("shown");
			this.fire(shown ? "show" : "hide", this);
		},
		_showHelp_handler: function(jEv) {
			new app.ui.HelpPanel({ref: this.config.help});
			jEv.stopPropagation();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "sidebarSection", children: [
				(this.config.title && { tag: "DIV", cls: "sidebarSection-head", onclick: this._showSection_handler, children: [
					this.config.title,
					( this.config.help && { tag: "SPAN", cls: "sidebarSection-help pull-right", onclick: this._showHelp_handler, text: acx.text("General.HelpGlyph") } )
				] }),
				{ tag: "DIV", cls: "sidebarSection-body", child: this.config.body }
			] }
		); }
	});

})( this.jQuery, this.app );