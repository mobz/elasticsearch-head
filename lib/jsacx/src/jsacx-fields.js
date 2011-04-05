(function() {
	function isInt(v) { return isFinite(parseInt(v)) && parseInt(v) === +v; }

	acx.val = {
		// returns a function which checks that a (string)val is an integer and is greater or equal to min and
		// less or equal to max. min and max can be undefined to avoid checking
		isInt: function(min, max) {
			return function(val) {
				return isInt(val) && (!isInt(min) || +val >= min) && (!isInt(max) || +val <= max);
			}
		}
	};

})();

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
		this.label = this.config.label;
		this.require = this.config.require;
		this.name = this.config.name;
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
		var val = this.val(), req = this.require;
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

acx.ux.FieldCollection = acx.ux.Observable.extend({
	defaults: {
		fields: []	// the collection of fields
	},
	init: function() {
		this._super();
		this.fields = this.config.fields;
	},
	validate: function() {
		return this.fields.reduce(function(r, field) {
			return r && field.validate();
		}, true);
	},
	getData: function(type) {
		return this.fields.reduce(function(r, field) {
			r[field.name] = field.val(); return r;
		}, {});
	}
});

acx.ui.PanelForm = acx.ui.Widget.extend({
	defaults: {
		fields: null	// (required) instanceof acx.ux.FieldCollection
	},
	init: function(parent) {
		this._super();
		this.el = $(this._main_template());
		this.appendTo(parent);
	},
	_main_template: function() {
		return { tag: "DIV", id: this.id(), cls: "uiPanelForm", children: this.config.fields.fields.map(this._field_template, this) };
	},
	_field_template: function(field) {
		return { tag: "LABEL", cls: "uiPanelForm-field", children: [
			{ tag: "DIV", cls: "uiPanelForm-label", children: [ field.label, acx.ut.require_template(field) ] },
			field
		]}
	}
});