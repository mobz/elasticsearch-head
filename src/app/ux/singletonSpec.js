describe("app.ux.singleton", function(){

var Singleton = window.app.ux.Singleton;

	describe("creating a singleton", function() {
		var X = Singleton.extend({
			foo: function() {
				return "bar";
			}
		});

		var Y = Singleton.extend({
			bar: function() {
				return "baz";
			}
		});

		it("should have properties like a normal class", function() {
			var a = X.instance();

			expect( a instanceof X ).toBe( true );
			expect( a.foo() ).toBe( "bar" );
		});

		it("should return single instance each time instance() is called", function() {
			var a = X.instance();
			var b = X.instance();

			expect( a ).toBe( b );
		});

		it("should not share instances with different singletons", function() {
			var a = X.instance();
			var c = Y.instance();

			expect( a ).not.toBe( c );
		});

	});

});
