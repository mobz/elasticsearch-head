acx.i18n.setKeys({
	"AnyRequest.Enabled" : "Enabled",
	"AnyRequest.GraphResult" : "Graph Result",
	"AnyRequest.HideJson" : "Hide JSON",
	"AnyRequest.RepeatRequest" : "Repeat Request",
	"AnyRequest.RepeatRequestSelect" : "Repeat request every ",
	"AnyRequest.Transformer" : "Result Transformer",
	"AnyRequest.Pretty": "Pretty",
	"AnyRequest.Request": "Request",
	"AnyRequest.Requesting": "Requesting...",
	"AnyRequest.ValidateJSON": "Validate JSON",
	"Browser.ResultSourcePanelTitle": "Result Source",
  "TableResults.Summary": "Searched {0} of {1} shards. {2} hits. {3} seconds",
	"QueryFilter-Header-Indices": "Indices",
	"QueryFilter-Header-Types": "Types",
	"QueryFilter-Header-Fields": "Fields"
});

acx.i18n.setKeys({
	"AnyRequest.TransformerHelp" : "\
		<p>The Result Transformer can be used to post process the raw json results from a request into a more useful format.</p>\
		<p>The transformer should contain the body of a javascript function. The return value from the function becomes the new value passed to the json printer</p>\
		<p>Example:<br>\
		  <code>return root.hits.hits[0];</code> would traverse a result set to show just the first match<br>\
		  <code>return Object.keys(root.nodes).reduce(function(tot, node) { return tot + root.nodes[node].os.mem.used_in_bytes; }, 0);</code> would return the total memory used across an entire cluster<br></p>\
		<p>The following functions are available and can be useful processing arrays and objects<br>\
		<ul>\
			<li><i>Object.keys</i>(object) := array</li>\
			<li>array.<i>forEach</i>(function(prop, index))</li>\
			<li>array.<i>map</i>(function(prop, index)) := array</li>\
			<li>array.<i>reduce</i>(function(accumulator, prop, index), initial_value) := final_value</li>\
		</ul>\
		<p>When Repeat Request is running, an extra parameter called prev is passed to the transformation function. This allows comparisons, and cumulative graphing</p>\
		<p>Example:<br>\
		<code>var la = [ root.nodes[Object.keys(root.nodes)[0]].os.load_average[0] ]; return prev ? la.concat(prev) : la;</code> would return the load average on the first cluster node over the last minute\
		This could be fed into the Graph to produce a load graph for the node\
		"
});

acx.i18n.setKeys({
	"AnyRequest.GraphHelp" : "\
		<p>To produce a graph of your results, use the result transformer to produce an array of values</p>\
		"
});