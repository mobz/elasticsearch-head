(function( $, app ) {

	var ui = app.ns("ui");

	ui.AbstractQuery = ui.AbstractWidget.extend({
		defaults: {
			base_uri: "http://localhost:9200/"   // the default ElasticSearch host
		},

		_request_handler: function(params) {
			$.ajax(acx.extend({
				url: this.config.base_uri + params.path,
				type: "POST",
				dataType: "json",
				error: function(xhr, type, message) {
					if(xhr.responseText != null) {
						var obj = $.parseJSON(xhr.responseText);
						if (!obj) {
							return;
						}
						console.log( obj.error || "Unknown error");
					}
				}
			}, params));
		}
	});
	
})( this.jQuery, this.app );