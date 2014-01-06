$( function() {

	var ui = window.app.ns("ui");
	var ux = window.app.ns("ux");
	var ut = window.app.ns("ut");

	window.builder = function() {
		var form = new ux.FieldCollection({
			fields: [
				new ui.CheckField({
					label: "default",
					name: "check_default"
				}),
				new ui.CheckField({
					label: "checked",
					name: "check_true",
					value: true
				}),
				new ui.CheckField({
					label: "unchecked",
					name: "check_false",
					value: false
				}),
				new ui.CheckField({
					label: "required",
					name: "check_required",
					require: true
				})
			]
		});

		return (
			{ tag: "DIV", children: form.fields.map( function( field ) {
				return { tag: "LABEL", cls: "uiPanelForm-field", children: [
					{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, ut.require_template(field) ] },
					field
				]};
			}).concat( new ui.Button({
				label: "Evaluate Form",
				onclick: function() { console.log( "valid=" + form.validate(), form.getData() ); }
			})) }
		);
	};

});