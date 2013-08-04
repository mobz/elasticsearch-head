$( function() {

	var ui = window.app.ns("ui");

	$("body").append(
		{ tag: "DIV", children: [
			new ui.Button({	label: "Default" })
		] }
	);

});