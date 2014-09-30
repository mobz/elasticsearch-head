(function( $, app, i18n ) {

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
			this.el = $.joey( this._main_template() );
			this.body = this.el.children(".uiSidebarSection-body");
			this.config.open && ( this.el.addClass("shown") && this.body.css("display", "block") );
		},
		_showSection_handler: function( ev ) {
			var shown = $( ev.target ).closest(".uiSidebarSection")
				.toggleClass("shown")
					.children(".uiSidebarSection-body").slideToggle(200, function() { this.fire("animComplete", this); }.bind(this))
				.end()
				.hasClass("shown");
			this.fire(shown ? "show" : "hide", this);
		},
		_showHelp_handler: function( ev ) {
			new ui.HelpPanel({ref: this.config.help});
			ev.stopPropagation();
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiSidebarSection", children: [
				(this.config.title && { tag: "DIV", cls: "uiSidebarSection-head", onclick: this._showSection_handler, children: [
					this.config.title,
					( this.config.help && { tag: "SPAN", cls: "uiSidebarSection-help pull-right", onclick: this._showHelp_handler, text: i18n.text("General.HelpGlyph") } )
				] }),
				{ tag: "DIV", cls: "uiSidebarSection-body", children: [ this.config.body ] }
			] }
		); }
	});

})( this.jQuery, this.app, this.i18n );
