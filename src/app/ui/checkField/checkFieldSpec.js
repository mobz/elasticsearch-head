describe("app.ui.CheckField", function() {

	var CheckField = window.app.ui.CheckField;

	it("should have a label", function() {
		expect( ( new CheckField({ label: "foo" }) ).label ).toBe( "foo" );
	});

	it("should have a name", function() {
		expect( ( new CheckField({ name: "foo" }) ).name ).toBe( "foo" );
	});

	it("should have a val that is false when then field is not checked", function() {
		expect( ( new CheckField({ name: "foo", value: false }) ).val() ).toBe( false );
	});

	it("should have a val that is true when the field is checked", function() {
		expect( ( new CheckField({ name: "foo", value: true }) ).val() ).toBe( true );
	});

	it("should be valid if the field value is true", function() {
		expect( ( new CheckField({ name: "foo", value: true }) ).validate() ).toBe( true );
	});

	it("should be valid if require is false", function() {
		expect( ( new CheckField({ name: "foo", require: false, value: true }) ).validate() ).toBe( true );
		expect( ( new CheckField({ name: "foo", require: false, value: false }) ).validate() ).toBe( true );
	});

	it("should be invalid if require is true and value is false", function() {
		expect( ( new CheckField({ name: "foo", require: true, value: false }) ).validate() ).toBe( false );
	});

});