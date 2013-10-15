$( function() {

	var ui = window.app.ns("ui");

	window.builder = function() {
		return new ui.SplitButton({
			label: "Default",
			items: [
				{ label: "Action" },
				{ label: "Another Action" },
				{ label: "Selected", selected: true }
			]
		});
	};

});