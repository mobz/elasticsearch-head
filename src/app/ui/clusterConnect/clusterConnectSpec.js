describe("clusterConnect", function() {

	var ClusterConnect = window.app.ui.ClusterConnect;

	describe("when created", function() {

		var prefs, success_callback, cluster, clusterConnect;

		beforeEach( function() {
			prefs = {
				set: jasmine.createSpy("set")
			};
			spyOn( window.app.services.Preferences, "instance" ).and.callFake( function() {
				return prefs;
			});
			cluster = {
				get: jasmine.createSpy("get").and.callFake( function(uri, success) {
					success_callback = success;
				})
			};
			clusterConnect = new ClusterConnect({
				base_uri: "http://localhost:9200",
				cluster: cluster
			});
		});

		it("should test the connection to the cluster", function() {
			expect( cluster.get ).toHaveBeenCalled();
		});

		it("should store successful connection in preferences", function() {
			success_callback("fakePayload");
			expect( prefs.set ).toHaveBeenCalled();
		});

	});

});
