(function( $, app, i18n ) {

	var ui = app.ns("ui");

	ui.IndexSelector = app.ui.AbstractQuery.extend({
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach( parent );
			this.update();
		},
		update: function() {
			this._request_handler({
				type: "GET",
				path: "_status",
				success: this._update_handler
			});
		},
		
		_update_handler: function(data) {
			var options = [];
			for(var name in data.indices) { options.push(this._option_template(name, data.indices[name])); }
			this.el.find(".uiIndexSelector-select").empty().append(this._select_template(options));
			this._indexChanged_handler();
		},
		
		_main_template: function() {
			return { tag: "DIV", cls: "uiIndexSelector", children: i18n.complex( "IndexSelector.SearchIndexForDocs", { tag: "SPAN", cls: "uiIndexSelector-select" } ) };
		},

		_indexChanged_handler: function() {
			this.fire("indexChanged", this.el.find("SELECT").val());
		},

		_select_template: function(options) {
			return { tag: "SELECT", children: options, onChange: this._indexChanged_handler };
		},
		
		_option_template: function(name, index) {
			return  { tag: "OPTION", value: name, text: i18n.text("IndexSelector.NameWithDocs", name, index.docs.num_docs ) };
		}
	});

})( this.jQuery, this.app, this.i18n );

