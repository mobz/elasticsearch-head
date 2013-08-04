$( function() {

	var ui = window.app.ns("ui");

	$("body").append(
		{ tag: "DIV", children: [
			new ui.SplitButton({
				label: "Default",
				items: [
					{ label: "Action" },
					{ label: "Another Action" },
					{ label: "Selected", selected: true }
				]
			})
		] }
	);

});