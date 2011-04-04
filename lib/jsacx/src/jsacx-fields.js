acx.ui.AbstractField = acx.ui.Widget.extend({
	defaults: {
		name : "", 			// (required) - name of the field
		require: false,	// validation requirements (false, true, regexp, function)
		value: "",			// default value
		label: ""				// human readable label of this field
	},
	init: function(parent) {
		this.el = $(this._main_template());
		this.field = this.el.find("[name="+this.config.name+"]");
		this.val(this.config.value);
		this.appendTo(parent);
	},
	val: function(val) {
		if(val === undefined) {
			return this.field.val();
		} else {
			this.field.val(val);
			return this;
		}
	},
	validate: function() {
		var val = this.val(), req = this.config.require;
		if(req === false) {
			return true;
		} else if(req === true) {
			return val.length > 0
		} else if(req.test && acx.isFunction(req.test)) {
			return req.test(val);
		} else if(acx.isFunction(req)) {
			return req(val, this);
		}
	}
});

acx.ui.TextField = acx.ui.AbstractField.extend({
	_main_template: function() {
		return { tag: "DIV", id: this.id(), cls: "uiField uiTextField", children: [
			{ tag: "INPUT", type: "text", name: this.config.name }
		]};
	}
});

acx.ui.FieldCollection = acx.ui.Observable.extend({
	defaults: {
		fields: []	// the collection of fields
	},
	init: function() {
		this._super();
		this.fields = this.config.fields;
	}
	validate: function() {
		return this.fields.reduce(function(r, field) {
			return r && field.validate();
		}, true)
	}
});