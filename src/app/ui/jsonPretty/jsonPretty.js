(function( $, app ) {

	var ui = app.ns("ui");

	ui.JsonPretty = ui.AbstractWidget.extend({
		defaults: {
			obj: null
		},
		init: function(parent) {
			this._super();
			this.el = $(this._main_template());
			this.attach(parent);
			this.el.click(this._click_handler);
		},
		
		_click_handler: function(jEv) {
			var t = $(jEv.target).closest(".uiJsonPretty-name").closest("LI");
			if(t.length === 0 || t.parents(".uiJsonPretty-minimised").length > 0) { return; }
			t.toggleClass("uiJsonPretty-minimised");
			jEv.stopPropagation();
		},
		
		_main_template: function() {
			try {
					return { tag: "DIV", cls: "uiJsonPretty", children: this.pretty.parse(this.config.obj) };
			}	catch (error) {
					throw "JsonPretty error: " + error.message;
			}
		},
		
		pretty: { // from https://github.com/RyanAmos/Pretty-JSON/blob/master/pretty_json.js
			"expando" : function(value) {
				return (value && (/array|object/i).test(value.constructor.name)) ? "expando" : "";
			},
			"parse": function (member) {
				return this[(member == null) ? 'null' : member.constructor.name.toLowerCase()](member);
			},
			"null": function (value) {
				return this['value']('null', 'null');
			},
			"array": function (value) {
				var results = value.map(function(v) {
					return { tag: "LI", cls: this.expando(v), child: this['parse'](v) };
				}, this);
				return [ "[ ", ((results.length > 0) ? { tag: "UL", cls: "uiJsonPretty-array", children: results } : null), "]" ];
			},
			"object": function (value) {
				var results = [];
				for (var member in value) {
					results.push({ tag: "LI", cls: this.expando(value[member]), children:  [ this['value']('name', member), ': ', this['parse'](value[member]) ] });
				}
				return [ "{ ", ((results.length > 0) ? { tag: "UL", cls: "uiJsonPretty-object", children: results } : null ),  "}" ];
			},
			"number": function (value) {
				return this['value']('number', value.toString());
			},
			"string": function (value) {
				return this['value']('string', value.toString());
			},
			"boolean": function (value) {
				return this['value']('boolean', value.toString());
			},
			"value": function (type, value) {
				if (/^(http|https|file):\/\/[^\s]+$/.test(value)) {
					return this['value'](type, { tag: "A", href: value, target: "_blank", text: value } );
				}
				return { tag: "SPAN", cls: "uiJsonPretty-" + type, text: value };
			}
		}
	});

})( this.jQuery, this.app );