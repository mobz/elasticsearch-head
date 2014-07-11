(function() {

	var global = this;
	var shortcuts = {
		"text" : "textContent",
		"cls" : "className"
	};

	function addAttr( el, attr, value, context ) {
		attr = shortcuts[attr] || attr;
		if( attr === 'children' ) {
			for( var i = 0; i < value.length; i++) {
				createNode( value[i], el, context );
			}
		} else if( attr === 'style' || attr === 'dataset' ) {
			for( var prop in value ) {
				el[ attr ][ prop ] = value[ prop ];
			}
		} else if( attr.indexOf("on") === 0 ) {
			el.addEventListener( attr.substr(2), value, false );
		} else {
			el[ attr ] = value;
		}
	}

	function createNode( obj, parent, context ) {
		var el, attr;
		if( obj == null ) {
			return;
		} else if( typeof obj === 'string' ) {
			el = context.createTextNode( obj );
		} else {
			el = context.createElement( obj.tag || obj.tagName || 'DIV' );
			for( attr in obj ) {
				addAttr( el, attr, obj[ attr ], context );
			}
		}
		if( parent ) {
			parent.appendChild( el );
		}
		return el;
	}

	global.joey = function joey(elementDef, parentNode) {
		return createNode( elementDef, parentNode, parentNode ? parentNode.ownerDocument : global.document );
	};

}());
