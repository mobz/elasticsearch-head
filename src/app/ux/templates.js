(function( app ) {

	var ut = app.ns("ut");

	ut.option_template = function(v) { return { tag: "OPTION", value: v, text: v }; };
	ut.require_template = function(f) { return f.require ? { tag: "SPAN", cls: "require", text: "*" } : null; };

})( this.app );