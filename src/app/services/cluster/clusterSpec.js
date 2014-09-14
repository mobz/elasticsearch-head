describe("app.services.Cluster", function() {

	var Cluster = window.app.services.Cluster;
	var test = window.test;

	var cluster;

	beforeEach( function() {
		cluster = new Cluster({ base_uri: "http://localhost:9200/" });
	});

	describe( "when it is initialised", function() {

		it("should have a localhost base_uri", function() {
			expect( cluster.base_uri ).toBe( "http://localhost:9200/" );
		});

		it("should have no version", function() {
			expect( cluster.version ).toBe( undefined );
		});

	});

	describe( "setVersion()", function() {

		it("have a version", function() {
			cluster.setVersion( "1.12.3-5" );
			expect( cluster.version ).toBe( "1.12.3-5" );
		});

	});

	describe("versionAtLeast()", function() {
		var vs = [ "0.0.3", "0.13.5", "0.90.3", "1.0.0", "1.1.0", "1.2.3", "1.12.4.rc2", "13.0.0" ];

		it("should return true for versions that are less than or equal to the current version", function() {
			cluster.setVersion("1.12.5");
			expect( cluster.versionAtLeast("1.12.5" ) ).toBe( true );
			expect( cluster.versionAtLeast("1.12.5rc2" ) ).toBe( true );
			expect( cluster.versionAtLeast("1.12.5-6" ) ).toBe( true );
			expect( cluster.versionAtLeast("1.12.5-6.beta7" ) ).toBe( true );
			expect( cluster.versionAtLeast("1.12.4" ) ).toBe( true );
			expect( cluster.versionAtLeast("0.12.4" ) ).toBe( true );
			expect( cluster.versionAtLeast("1.1.8" ) ).toBe( true );

			for( var i = 0; i < vs.length - 1; i++ ) {
				cluster.setVersion( vs[i+1] );
				expect( cluster.versionAtLeast( vs[i] ) ).toBe( true );
			}
		});

		it("should return false for versions that are greater than the current version", function() {
			cluster.setVersion("1.12.5");
			expect( cluster.versionAtLeast("1.12.6" ) ).toBe( false );
			expect( cluster.versionAtLeast("1.13.4" ) ).toBe( false );
			expect( cluster.versionAtLeast("2.0.0" ) ).toBe( false );

			for( var i = 0; i < vs.length - 1; i++ ) {
				cluster.setVersion( vs[i] );
				expect( cluster.versionAtLeast( vs[i+1] ) ).toBe( false );
			}
		});
	});

});
