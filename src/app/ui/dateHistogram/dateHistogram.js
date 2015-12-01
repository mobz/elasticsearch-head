(function( app, i18n, raphael ) {

	var ui = app.ns("ui");

	ui.DateHistogram = ui.AbstractWidget.extend({
		defaults: {
			printEl: null, // (optional) if supplied, clicking on elements in the histogram changes the query
			cluster: null, // (required)
			query: null,   // (required) the current query
			spec: null     // (required) // date field spec
		},
		init: function() {
			this._super();
			this.el = $(this._main_template());
			this.query = this.config.query.clone();
			// check if the index/types have changed and rebuild the histogram
			this.config.query.on("results", function(query) {
				if(this.queryChanged) {
					this.buildHistogram(query);
					this.queryChanged = false;
				}
			}.bind(this));
			this.config.query.on("setIndex", function(query, params) {
				this.query.setIndex(params.index, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.config.query.on("setType", function(query, params) {
				this.query.setType(params.type, params.add);
				this.queryChanged = true;
			}.bind(this));
			this.query.search.size = 0;
			this.query.on("results", this._stat_handler);
			this.query.on("results", this._aggs_handler);
			this.buildHistogram();
		},
		buildHistogram: function(query) {
			this.statAggs = this.query.addAggs({
				stats: { field: this.config.spec.field_name }
			});
			this.query.query();
			this.query.removeAggs(this.statAggs);
		},
		_stat_handler: function(query, results) {
			if(! results.aggregations[this.statAggs]) { return; }
			this.stats = results.aggregations[this.statAggs];
			// here we are calculating the approximate range  that will give us less than 121 columns
			var rangeNames = [ "year", "year", "month", "day", "hour", "minute" ];
			var rangeFactors = [100000, 12, 30, 24, 60, 60000 ];
			this.intervalRange = 1;
			var range = this.stats.max - this.stats.min;
			do {
				this.intervalName = rangeNames.pop();
				var factor = rangeFactors.pop();
				this.intervalRange *= factor;
				range = range / factor;
			} while(range > 70);
			this.dateAggs = this.query.addAggs({
				date_histogram : {
					field: this.config.spec.field_name,
					interval: this.intervalName
				}
			});
			this.query.query();
			this.query.removeAggs(this.dateAggs);
		},
		_aggs_handler: function(query, results) {
			if(! results.aggregations[this.dateAggs]) { return; }
			var buckets = [], range = this.intervalRange;
			var min = Math.floor(this.stats.min / range) * range;
			var prec = [ "year", "month", "day", "hour", "minute", "second" ].indexOf(this.intervalName);
			results.aggregations[this.dateAggs].buckets.forEach(function(entry) {
				buckets[parseInt((entry.key - min) / range , 10)] = entry.doc_count;
			}, this);
			for(var i = 0; i < buckets.length; i++) {
				buckets[i] = buckets[i] || 0;
			}
			this.el.removeClass("loading");
			var el = this.el.empty();
			var w = el.width(), h = el.height();
			var r = raphael(el[0], w, h );
			var printEl = this.config.printEl;
			query = this.config.query;
			r.g.barchart(0, 0, w, h, [buckets], { gutter: "0", vgutter: 0 }).hover(
				function() {
					this.flag = r.g.popup(this.bar.x, h - 5, this.value || "0").insertBefore(this);
				}, function() {
					this.flag.animate({opacity: 0}, 200, ">", function () {this.remove();});
				}
			).click(function() {
				if(printEl) {
					printEl.val(window.dateRangeParser.print(min + this.bar.index * range, prec));
					printEl.trigger("keyup");
					query.query();
				}
			});
		},
		_main_template: function() { return (
			{ tag: "DIV", cls: "uiDateHistogram loading", css: { height: "50px" }, children: [
				i18n.text("General.LoadingAggs")
			] }
		); }
	});

})( this.app, this.i18n, this.Raphael );