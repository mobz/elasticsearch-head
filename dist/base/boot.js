(function() {

	function ns( namespace ) {
		return (namespace || "").split(".").reduce( function( space, name ) {
			return space[ name ] || ( space[ name ] = { ns: ns } );
		}, this );
	}

	var app = ns("app");

})();