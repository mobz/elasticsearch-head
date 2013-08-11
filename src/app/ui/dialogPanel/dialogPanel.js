(function( app ) {

	var ui = app.ns("ui");

	ui.DialogPanel = ui.DraggablePanel.extend({
		_commit_handler: function(jEv) {
			this.fire("commit", this, { jEv: jEv });
		},
		_main_template: function() {
			var t = this._super();
			t.children.push(this._actionsBar_template());
			return t;
		},
		_actionsBar_template: function() {
			return { tag: "DIV", cls: "pull-right", children: [
				new app.ui.Button({ label: "Cancel", onclick: this._close_handler }),
				new app.ui.Button({ label: "OK", onclick: this._commit_handler })
			]};
		}
	});

})( this.app );
