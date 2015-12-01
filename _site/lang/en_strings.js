i18n.setKeys({
	"General.Elasticsearch": "Elasticsearch",
	"General.LoadingAggs": "Loading Aggregations...",
	"General.Searching": "Searching...",
	"General.Search": "Search",
	"General.Help": "Help",
	"General.HelpGlyph": "?",
	"General.CloseGlyph": "X",
	"General.RefreshResults": "Refresh",
	"General.ManualRefresh": "Manual Refresh",
	"General.RefreshQuickly": "Refresh quickly",
	"General.Refresh5seconds": "Refresh every 5 seconds",
	"General.Refresh1minute": "Refresh every minute",
	"AliasForm.AliasName": "Alias Name",
	"AliasForm.NewAliasForIndex": "New Alias for {0}",
	"AliasForm.DeleteAliasMessage": "type ''{0}'' to delete {1}. There is no undo",
	"AnyRequest.DisplayOptions" : "Display Options",
	"AnyRequest.AsGraph" : "Graph Results",
	"AnyRequest.AsJson" : "Show Raw JSON",
	"AnyRequest.AsTable" : "Show Search Results Table",
	"AnyRequest.History" : "History",
	"AnyRequest.RepeatRequest" : "Repeat Request",
	"AnyRequest.RepeatRequestSelect" : "Repeat request every ",
	"AnyRequest.Transformer" : "Result Transformer",
	"AnyRequest.Pretty": "Pretty",
	"AnyRequest.Query" : "Query",
	"AnyRequest.Request": "Request",
	"AnyRequest.Requesting": "Requesting...",
	"AnyRequest.ValidateJSON": "Validate JSON",
	"Browser.Title": "Browser",
	"Browser.ResultSourcePanelTitle": "Result Source",
	"Command.DELETE": "DELETE",
	"Command.SHUTDOWN": "SHUTDOWN",
	"Command.DeleteAliasMessage": "Delete Alias?",
	"ClusterOverView.IndexName": "Index Name",
	"ClusterOverview.NumShards": "Number of Shards",
	"ClusterOverview.NumReplicas": "Number of Replicas",
	"ClusterOverview.NewIndex": "New Index",
	"IndexActionsMenu.Title": "Actions",
	"IndexActionsMenu.NewAlias": "New Alias...",
	"IndexActionsMenu.Refresh": "Refresh",
	"IndexActionsMenu.Flush": "Flush",
	"IndexActionsMenu.Optimize": "Optimize...",
	"IndexActionsMenu.Snapshot": "Gateway Snapshot",
	"IndexActionsMenu.Analyser": "Test Analyser",
	"IndexActionsMenu.Open": "Open",
	"IndexActionsMenu.Close": "Close",
	"IndexActionsMenu.Delete": "Delete...",
	"IndexInfoMenu.Title": "Info",
	"IndexInfoMenu.Status": "Index Status",
	"IndexInfoMenu.Metadata": "Index Metadata",
	"IndexCommand.TextToAnalyze": "Text to Analyse",
	"IndexCommand.ShutdownMessage": "type ''{0}'' to shutdown {1}. Node can NOT be restarted from this interface",
	"IndexOverview.PageTitle": "Indices Overview",
	"IndexSelector.NameWithDocs": "{0} ({1} docs)",
	"IndexSelector.SearchIndexForDocs": "Search {0} for documents where:",
	"FilterBrowser.OutputType": "Output Results: {0}",
	"FilterBrowser.OutputSize": "Number of Results: {0}",
	"Header.ClusterHealth": "cluster health: {0} ({1} of {2})",
	"Header.ClusterNotConnected": "cluster health: not connected",
	"Header.Connect": "Connect",
	"Nav.AnyRequest": "Any Request",
	"Nav.Browser": "Browser",
	"Nav.ClusterHealth": "Cluster Health",
	"Nav.ClusterState": "Cluster State",
	"Nav.ClusterNodes": "Nodes Info",
	"Nav.Info": "Info",
	"Nav.NodeStats": "Nodes Stats",
	"Nav.Overview": "Overview",
	"Nav.Indices": "Indices",
	"Nav.Plugins": "Plugins",
	"Nav.Status": "Indices Stats",
	"Nav.Templates": "Templates",
	"Nav.StructuredQuery": "Structured Query",
	"NodeActionsMenu.Title": "Actions",
	"NodeActionsMenu.Shutdown": "Shutdown...",
	"NodeInfoMenu.Title": "Info",
	"NodeInfoMenu.ClusterNodeInfo": "Cluster Node Info",
	"NodeInfoMenu.NodeStats": "Node Stats",
	"NodeType.Client": "Client Node",
	"NodeType.Coord": "Coordinator",
	"NodeType.Master": "Master Node",
	"NodeType.Tribe": "Tribe Node",
	"NodeType.Worker": "Worker Node",
	"NodeType.Unassigned": "Unassigned",
	"OptimizeForm.OptimizeIndex": "Optimize {0}",
	"OptimizeForm.MaxSegments": "Maximum # Of Segments",
	"OptimizeForm.ExpungeDeletes": "Only Expunge Deletes",
	"OptimizeForm.FlushAfter": "Flush After Optimize",
	"OptimizeForm.WaitForMerge": "Wait For Merge",
	"Overview.PageTitle" : "Cluster Overview",
	"Output.JSON": "JSON",
	"Output.Table": "Table",
	"Output.CSV": "CSV",
	"Output.ShowSource": "Show query source",
	"Preference.SortCluster": "Sort Cluster",
	"Sort.ByName": "By Name",
	"Sort.ByAddress": "By Address",
	"Sort.ByType": "By Type",
	"Preference.ViewAliases": "View Aliases",
	"ViewAliases.Grouped": "Grouped",
	"ViewAliases.List": "List",
	"ViewAliases.None": "None",
	"Overview.IndexFilter": "Index Filter",
	"TableResults.Summary": "Searched {0} of {1} shards. {2} hits. {3} seconds",
	"QueryFilter.AllIndices": "All Indices",
	"QueryFilter.AnyValue": "any",
	"QueryFilter-Header-Indices": "Indices",
	"QueryFilter-Header-Types": "Types",
	"QueryFilter-Header-Fields": "Fields",
	"QueryFilter.DateRangeHint.from": "From : {0}",
	"QueryFilter.DateRangeHint.to": "  To : {0}",
	"Query.FailAndUndo": "Query Failed. Undoing last changes",
	"StructuredQuery.ShowRawJson": "Show Raw JSON"
});

i18n.setKeys({
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

i18n.setKeys({
	"AnyRequest.DisplayOptionsHelp" : "\
		<p>Raw Json: shows complete results of the query and transformation in raw JSON format </p>\
		<p>Graph Results: To produce a graph of your results, use the result transformer to produce an array of values</p>\
		<p>Search Results Table: If your query is a search, you can display the results of the search in a table.</p>\
		"
});

i18n.setKeys({
	"QueryFilter.DateRangeHelp" : "\
		<p>Date fields accept a natural language query to produce a From and To date that form a range that the results are queried over.</p>\
		<p>The following formats are supported:</p>\
		<ul>\
			<li><b>Keywords / Key Phrases</b><br>\
				<code>now<br> today<br> tomorrow<br> yesterday<br> last / this / next + week / month / year</code><br>\
				searches for dates matching the keyword. <code>last year</code> would search all of last year.</li>\
			<li><b>Ranges</b><br>\
				<code>1000 secs<br> 5mins<br> 1day<br> 2days<br> 80d<br> 9 months<br> 2yrs</code> (spaces optional, many synonyms for range qualifiers)<br>\
				Create a search range centered on <code>now</code> extending into the past and future by the amount specified.</li>\
			<li><b>DateTime and Partial DateTime</b><br>\
				<code>2011<br> 2011-01<br> 2011-01-18<br> 2011-01-18 12<br> 2011-01-18 12:32<br> 2011-01-18 12:32:45</code><br>\
				these formats specify a specific date range. <code>2011</code> would search the whole of 2011, while <code>2011-01-18 12:32:45</code> would only search for results in that 1 second range</li>\
			<li><b>Time and Time Partials</b><br>\
				<code>12<br> 12:32<br> 12:32:45</code><br>\
				these formats search for a particular time during the current day. <code>12:32</code> would search that minute during today</li>\
			<li><b>Date Ranges</b><br>\
				<code>2010 -&gt; 2011<br> last week -&gt; next week<br> 2011-05 -&gt;<br> &lt; now</code><br>\
				A Date Range is created by specifying two dates in any format (Keyword / DateTime / Time) separated by &lt; or -&gt; (both do the same thing). If either end of the date range is missing, it is the same as having no constraint in that direction.</li>\
			<li><b>Date Range using Offset</b><br>\
				<code>2010 -> 1yr<br> 3mins < now</code>\
				Searches the specified date including the range in the direction specified.</li>\
			<li><b>Anchored Ranges</b><br>\
				<code>2010-05-13 05:13 <> 10m<br> now <> 1yr<br> lastweek <> 1month</code><br>\
				Similar to above except the range is extend in both directions from the anchor date</li>\
		</ul>\
	"
});
