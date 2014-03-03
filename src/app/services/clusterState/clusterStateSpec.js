describe("app.services.ClusterState", function() {

	var ClusterState = window.app.services.ClusterState;
	var test = window.test;

	var c;
	var dummyData = {};
	var dataEventCallback;

	function expectAllDataToBeNull() {
		expect( c.clusterState ).toBe( null );
		expect( c.status ).toBe( null );
		expect( c.nodeStats ).toBe( null );
		expect( c.clusterNodes ).toBe( null );
	}

	beforeEach( function() {
		test.cb.use();
		dataEventCallback = jasmine.createSpy("onData");
		c = new ClusterState({
			cluster: {
				get: test.cb.createSpy("get", 1, [ dummyData ] )
			},
			onData: dataEventCallback
		});
	});

	describe( "when it is initialised", function() {

		it("should have null data", function() {
			expectAllDataToBeNull();
		});

	});

	describe( "when refresh is called", function() {

		beforeEach( function() {
			c.refresh();
		});

		it("should not not update models until all network requests have completed", function() {			
			test.cb.execOne();
			expectAllDataToBeNull();
			test.cb.execOne();
			expectAllDataToBeNull();
			test.cb.execOne();
			expectAllDataToBeNull();
			test.cb.execOne();
			expect( c.clusterState ).toBe( dummyData );
			expect( c.status ).toBe( dummyData );
			expect( c.nodeStats ).toBe( dummyData );
			expect( c.clusterNodes ).toBe( dummyData );
		});

		it("should fire a 'data' event when all data is ready", function() {
			test.cb.execAll();
			expect( dataEventCallback ).toHaveBeenCalledWith( c );
		});
	});

});
