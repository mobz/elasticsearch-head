(function( app ) {

	var services = app.ns("services");

	services.storage = (function() {
		var storage = {};
		return {
			get: function(k) { try { return JSON.parse(localStorage[k] || storage[k]); } catch(e) { return null; } },
			set: function(k, v) { v = JSON.stringify(v); localStorage[k] = v; storage[k] = v; }
		};
	})();

})( this.app );


