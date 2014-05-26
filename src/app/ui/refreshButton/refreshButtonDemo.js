$( function() {

	var ui = window.app.ns("ui");

	window.builder = function() {
		return new ui.RefreshButton({
			onRefresh: function() { console.log("-> refresh", arguments ); },
			onChange: function() { console.log("-> change", arguments ); }
		});
	};

});
