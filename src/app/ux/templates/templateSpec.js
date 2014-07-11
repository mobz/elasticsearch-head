describe("app.ut.byteSize_template", function() {

	describe("byteSize_template()", function() {
		var byteSize_template = window.app.ut.byteSize_template;

		it("should postfix with a B and have not decimal for number less than 1000", function() {
			expect( byteSize_template( 0 ) ).toBe( "0B" );
			expect( byteSize_template( 1 ) ).toBe( "1B" );
			expect( byteSize_template( 10 ) ).toBe( "10B" );
			expect( byteSize_template( 100 ) ).toBe( "100B" );
			expect( byteSize_template( 999 ) ).toBe( "999B" );
		});

		it("should have 0.xxX for values between 1000 and 1023", function() {
			expect( byteSize_template( 1000  ) ).toBe( "0.98ki" );
			expect( byteSize_template( 1024 * 1000 ) ).toBe( "0.98Mi" );
		});

		it("should always have three significant digits", function() {
			expect( byteSize_template( 1023  ) ).toBe( "1.00ki" );
			expect( byteSize_template( 1024  ) ).toBe( "1.00ki" );
			expect( byteSize_template( 1025  ) ).toBe( "1.00ki" );
			expect( byteSize_template( 1024 * 5 ) ).toBe( "5.00ki" );
			expect( byteSize_template( 1024 * 55 ) ).toBe( "55.0ki" );
			expect( byteSize_template( 1024 * 555 ) ).toBe( "555ki" );
		});

		it("should have the correct postfix", function() {
			expect( byteSize_template( 3 * Math.pow( 1024, 1) ) ).toBe( "3.00ki" );
			expect( byteSize_template( 3 * Math.pow( 1024, 2) ) ).toBe( "3.00Mi" );
			expect( byteSize_template( 3 * Math.pow( 1024, 3) ) ).toBe( "3.00Gi" );
			expect( byteSize_template( 3 * Math.pow( 1024, 4) ) ).toBe( "3.00Ti" );
			expect( byteSize_template( 3 * Math.pow( 1024, 5) ) ).toBe( "3.00Pi" );
			expect( byteSize_template( 3 * Math.pow( 1024, 6) ) ).toBe( "3.00Ei" );
			expect( byteSize_template( 3 * Math.pow( 1024, 7) ) ).toBe( "3.00Zi" );
			expect( byteSize_template( 3 * Math.pow( 1024, 8) ) ).toBe( "3.00Yi" );
		});

		it("should show an overflow for stupidly big numbers", function() {
			expect( byteSize_template( 3 * Math.pow( 1024, 10) ) ).toBe( "3.00..E" );
		});
	});

	describe("count_template()", function() {
		var count_template = window.app.ut.count_template;

		it("should not postfix and not decimal for number less than 1000", function() {
			expect( count_template( 0 ) ).toBe( "0" );
			expect( count_template( 1 ) ).toBe( "1" );
			expect( count_template( 10 ) ).toBe( "10" );
			expect( count_template( 100 ) ).toBe( "100" );
			expect( count_template( 999 ) ).toBe( "999" );
		});

		it("should always have three significant digits", function() {
			expect( count_template( 1000  ) ).toBe( "1.00k" );
			expect( count_template( 1005  ) ).toBe( "1.00k" );
			expect( count_template( 1055  ) ).toBe( "1.05k" );
			expect( count_template( 1000 * 5 ) ).toBe( "5.00k" );
			expect( count_template( 1000 * 55 ) ).toBe( "55.0k" );
			expect( count_template( 1000 * 555 ) ).toBe( "555k" );
		});

		it("should have the correct postfix", function() {
			expect( count_template( 3 * Math.pow( 1000, 1) ) ).toBe( "3.00k" );
			expect( count_template( 3 * Math.pow( 1000, 2) ) ).toBe( "3.00M" );
			expect( count_template( 3 * Math.pow( 1000, 3) ) ).toBe( "3.00G" );
			expect( count_template( 3 * Math.pow( 1000, 4) ) ).toBe( "3.00T" );
			expect( count_template( 3 * Math.pow( 1000, 5) ) ).toBe( "3.00P" );
			expect( count_template( 3 * Math.pow( 1000, 6) ) ).toBe( "3.00E" );
			expect( count_template( 3 * Math.pow( 1000, 7) ) ).toBe( "3.00Z" );
			expect( count_template( 3 * Math.pow( 1000, 8) ) ).toBe( "3.00Y" );
		});

		it("should show an overflow for stupidly big numbers", function() {
			expect( count_template( 3 * Math.pow( 1000, 10) ) ).toBe( "3.00..E" );
		});
	});


});
