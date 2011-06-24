/*
 * NOHTML templating library
 * github.com/mobz/nohtml
 * with extensions to support embedding widgets
 */

(function($, document) {
	// ie 6, 7 and 8 can not change the type of an input once it's created
	$.support.writeInputType = (function() {
		try {
			field = document.createElement( "INPUT" );
			field.setAttribute( "type", "checkbox" );
		} catch(e) {
			return true;
		}
		return false;
	})();

	var create = $.create = (function() {

		function addAttrs( el, obj, context ) {
			for( var attr in obj ){
				switch( attr ) {
				case 'tag' :
					break;
				case 'html' :
					el.innerHTML = obj[ attr ];
					break;
				case 'css' :
					for( var style in obj.css ) {
						$.attr( el.style, style, obj.css[ style ] );
					}
					break;
				case 'text' : case 'child' : case 'children' :
					createNode( obj[attr], el, context );
					break;
				case 'cls' :
					el.className = obj[attr];
					break;
				case 'data' :
					for( var data in obj.data ) {
						$.data( el, data, obj.data[data] );
					}
					break;
				default :
					if( attr.indexOf("on") === 0 && $.isFunction(obj[attr]) ) {
						$.event.add( el, attr.substr(2).replace(/^[A-Z]/, function(a) { return a.toLowerCase(); }), obj[attr] );
					} else {
						$.attr( el, attr, obj[attr] );
					}
				}
			}
		}

		function createNode(obj, parent, context) {
			if(obj && ($.isArray(obj) || obj instanceof $)) {
				for(var ret = [], i = 0; i < obj.length; i++) {
					var newNode = createNode(obj[i], parent, context);
					if(newNode) {
						ret.push(newNode);
					}
				}
				return ret;
			}
			var el;
			if(typeof(obj) === 'string') {
			  el = context.createTextNode(obj);
			} else if(!obj) {
				return undefined;
			} else if(obj.nodeType === 1) {
				el = obj;
			} else if(obj instanceof acx.ui.Widget) {
				el = obj.el[0];
			} else {
				if($.support.writeInputType && obj.tag && obj.tag.match(/input|button/i)) {
					el = context.createElement("<"+obj.tag+" type='"+obj.type+"'" + (obj.checked ? " checked" : "") + ">");
					delete obj.type;
				} else {
					el = context.createElement(obj.tag||'DIV');
				}
				addAttrs(el, obj, context);
			}
			if(parent){ parent.appendChild(el); }
			return el;
		};

		return function(elementDef, parentNode) {
			return createNode(elementDef, parentNode, (parentNode && parentNode.ownerDocument) || document);
		};
		
	})();
	

	// inject create into jquery internals so object definitions are treated as first class constructors (overrides non-public methods)
	var clean = $.clean,
		init = $.fn.init;

	$.clean = function( elems, context, fragment, scripts ) {
		for(var i = 0; i < elems.length; i++) {
			if( elems[i].tag || elems[i] instanceof acx.ui.Widget )
				elems[i] = create( elems[i], null, context );
		}
		return clean( elems, context, fragment, scripts );
	};

	$.fn.init = function( selector, context, rootjQuery ) {
		if ( selector && ( selector.tag || selector instanceof acx.ui.Widget )) {
			selector = create( selector, null, context );
		}
		return init.call( this, selector, context, rootjQuery );
	};

	$.fn.init.prototype = $.fn;

})(jQuery, window.document);

