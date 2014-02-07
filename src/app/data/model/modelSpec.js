describe("app.data.Model", function() {

	var Model = window.app.data.Model;

	it("test setting model does a shallow copy", function() {
		var test = {};
		var array = [ 1, 2, 3 ];
		var m = new Model({
			data: {
				"foo": "bar",
				"test": test,
				"array": array
			}
		});
		expect( m.get("foo") ).toBe("bar");
		expect( m.get("array").length ).toBe(  3  );
		expect( m.get("array")[1] ).toBe( 2 );
		expect( m.get("array") ).toBe( array );
		expect( m.get("test") ).toBe( test );
	});

	it("should replace model with shallow copy when put with no path", function() {
		var m = new Model({ foo: "bar" });
		m.set({ bar: "blat" });
		expect( m.get("foo")).toBe( undefined );
		expect( m.get("bar")).toBe("blat");
	});

	it("test getting values from deep in a model", function() {
		var m = new Model({
			data: {
				"foo": {
					"bar": {
						"baz": {
							"quix": "abcdefg"
						}
					}
				}
			}
		});

		expect( m.get("foo.bar.baz.quix") ).toBe( "abcdefg" );
	});

	it("test setting non-existant values creates new values", function() {
		var m = new Model({
			data: {
				"foo": {
					"bar": "abc"
				}
			}
		});
		m.set("foo.bar", "123" );
		m.set("foo.baz", "456" );
		expect( m.get("foo.bar") ).toBe( "123" );
		expect( m.get("foo.baz") ).toBe( "456" );
	});

	it("test setting values deep in a model", function() {
		var m = new Model({
			data: {
				"foo": {
					"bar": "abc"
				}
			}
		});
		m.set("foo.bar", "123" );
		m.set("foo.baz", "456" );
		m.set("foo.something.else.is.here", "xyz" );
		expect( m.get("foo.something.else.is").here ).toBe( "xyz" );
		expect( m.get("foo.something.else.is.here") ).toBe( "xyz" );
	});

});
