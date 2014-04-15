$( function() {

	var ui = window.app.ns("ui");

	window.builder = function() { return (
		{ tag: "DIV", children: [
			new ui.TextField({}),
			new ui.TextField({ placeholder: "placeholder" }),
			new ui.TextField({ onchange: function( tf ) { console.log( tf.val() ); } })
		] }
	); };

});