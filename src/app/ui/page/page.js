(function( app ) {

	var ui = app.ns("ui");

	ui.Page = ui.AbstractWidget.extend({
		show: function() {
			this.el.show();
		},
		hide: function() {
			this.el.hide();
		}
	});

})( this.app );