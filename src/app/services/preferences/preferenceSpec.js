describe("app.services.Preferences", function(){

var Preferences = window.app.services.Preferences;

	var prefs;

	beforeEach( function() {
		spyOn(window.localStorage, "getItem").and.returnValue( '{"foo":true}' );
		spyOn(window.localStorage, "setItem");
		prefs = Preferences.instance();
	});

	it("should return a preference from localStorage", function() {
		expect( prefs.get("foo") ).toEqual( {foo:true} );
	});

	it("should set a preference in localStorage", function() {
		prefs.set("foo", { foo: false } );
		expect( window.localStorage.setItem ).toHaveBeenCalledWith('foo', '{"foo":false}');
	});


});
