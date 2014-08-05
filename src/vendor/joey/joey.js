(function() {

	var joey = this.joey = function joey(elementDef, parentNode) {
		return createNode( elementDef, parentNode, parentNode ? parentNode.ownerDocument : this.document );
	};

	var shortcuts = joey.shortcuts = {
		"text" : "textContent",
		"cls" : "className"
	};

	var plugins = joey.plugins = [
		function( obj, context ) {
			if( typeof obj === 'string' ) {
				return context.createTextNode( obj );
			}
		},
		function( obj, context ) {
			if( "tag" in obj ) {
				var el = context.createElement( obj.tag );
				for( var attr in obj ) {
					addAttr( el, attr, obj[ attr ], context );
				}
				return el;
			}
		}
	];

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
		} else if( value !== undefined ) {
			el[ attr ] = value;
		}
	}

	function createNode( obj, parent, context ) {
		var el;
		if( obj != null ) {
			plugins.some( function( plug ) {
				return ( el = plug( obj, context ) );
			});
			parent && parent.appendChild( el );
			return el;
		}
	}

}());
