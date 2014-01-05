(function( app ) {

	var ui = app.ns("ui");

	ui.CheckField = ui.AbstractField.extend({
		_main_template: function() {
			return { tag: "DIV", id: this.id(), cls: "uiCheckField", children: [
				{ 
					tag: "INPUT",
					type: "checkbox",
					id: this.id(),
					name: this.config.name,
					checked: this.config.value,
					value: this.config.value,
					onclick: function(e) {
						var field = $(e.target);
						if (field.val() === "false") {
							field.val("true");
							field.attr("checked", "checked");
						} else {
							field.val("false");
							field.removeAttr("checked");
						}
					}
				}
			]};
		}
	});

})( this.app );


