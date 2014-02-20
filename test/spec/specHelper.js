// find *Spec.js files in the src directory next to the corresponding source file

var test = window.test = {};

test.cb = (function( jasmine ) {
	var callbacks = [];

	return {
		use: function() {
			callbacks = [];
		},
		createSpy: function( name, arg, data, context ) {
			return jasmine.createSpy( name ).andCallFake( function() {
				callbacks.push( { cb: arguments[ arg || 0 ], data: data, context: context } );
			});
		},
		execOne: function() {
			var exec = callbacks.shift();
			exec.cb.apply( exec.context, exec.data );
		},
		execAll: function() {
			while( callbacks.length ) {
				this.execOne();
			}
		}
	};


})( this.jasmine );
