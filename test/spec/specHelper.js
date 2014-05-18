// find *Spec.js files in the src directory next to the corresponding source file

var test = window.test = {};

test.cb = (function( jasmine ) {
	var callbacks = [];

	return {
		use: function() {
			callbacks = [];
		},
		createSpy: function( name, arg, data, context ) {
			return jasmine.createSpy( name ).and.callFake( function() {
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


test.clock = ( function() {
	var id = 0, timers, saved;
	var names = [ "setTimeout", "setInterval", "clearTimeout", "clearInterval" ];
	var byNext = function( a, b ) { return a.next - b.next; };
	var mocks = {
		setTimeout: function( fn, t ) {
			timers.push( { id: id, fn: fn, next: t, t: t, type: "t" } );
			return id++;
		},
		clearTimeout: function( id ) {
			timers = timers.filter( function( timer ) { return timer.id !== id; } );
		},
		setInterval: function( fn, t ) {
			timers.push( { id: id, fn: fn, next: t, t: t, type: "i" } );
			return id++;
		},
		clearInterval: function( id ) {
			timers = timers.filter( function( timer ) { return timer.id !== id; } );
		}
	};

	return {
		steal: function() {
			timers = [];
			saved = {};
			names.forEach( function( n ) {
				saved[n] = window[n];
				window[n] = mocks[n];
			});
		},
		restore: function() {
			names.forEach( function( n ) {
				window[n] = saved[n];
			});
			timers = null;
			saved = null;
		},
		tick: function() {
			if( timers.length ) {
				timers.sort( byNext );
				var t0 = timers[0];
				if( t0.type === "t" ) {
					timers.shift();
				} else {
					t0.next += t0.t;
				}
				t0.fn();
			}
		}
	};

})();
