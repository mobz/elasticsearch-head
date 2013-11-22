describe("app.ut.byteSize_template", function() {

	var byteSize_template = window.app.ut.byteSize_template;

	it("should postfix with a B and have not decimal for number less than 1000", function() {
		expect( byteSize_template( 0 ) ).toBe( "0B" );
		expect( byteSize_template( 1 ) ).toBe( "1B" );
		expect( byteSize_template( 10 ) ).toBe( "10B" );
		expect( byteSize_template( 100 ) ).toBe( "100B" );
		expect( byteSize_template( 999 ) ).toBe( "999B" );
	});

	it("should have 0.xxX for values between 1000 and 1023", function() {
		expect( byteSize_template( 1000  ) ).toBe( "0.98k" );
		expect( byteSize_template( 1024 * 1000 ) ).toBe( "0.98M" );
	});

	it("should always have three significant digits", function() {
		expect( byteSize_template( 1023  ) ).toBe( "1.00k" );
		expect( byteSize_template( 1024  ) ).toBe( "1.00k" );
		expect( byteSize_template( 1025  ) ).toBe( "1.00k" );
		expect( byteSize_template( 1024 * 5 ) ).toBe( "5.00k" );
		expect( byteSize_template( 1024 * 55 ) ).toBe( "55.0k" );
		expect( byteSize_template( 1024 * 555 ) ).toBe( "555k" );
	});

	it("should have the correct postfix", function() {
		expect( byteSize_template( 3 * Math.pow( 1024, 1) ) ).toBe( "3.00k" );
		expect( byteSize_template( 3 * Math.pow( 1024, 2) ) ).toBe( "3.00M" );
		expect( byteSize_template( 3 * Math.pow( 1024, 3) ) ).toBe( "3.00G" );
		expect( byteSize_template( 3 * Math.pow( 1024, 4) ) ).toBe( "3.00T" );
		expect( byteSize_template( 3 * Math.pow( 1024, 5) ) ).toBe( "3.00P" );
		expect( byteSize_template( 3 * Math.pow( 1024, 6) ) ).toBe( "3.00E" );
		expect( byteSize_template( 3 * Math.pow( 1024, 7) ) ).toBe( "3.00Y" );
	});

	it("should show an overflow for stupidly big numbers", function() {
		expect( byteSize_template( 3 * Math.pow( 1024, 10) ) ).toBe( "3.00..E" );
	});

});