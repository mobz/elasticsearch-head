i18n.setKeys({
	"General.Elasticsearch": "Elasticsearch",
	"General.LoadingFacets": "加载聚合查询...",
	"General.Searching": "搜索中...",
	"General.Search": "搜索",
	"General.Help": "帮助",
	"General.HelpGlyph": "?",
	"General.CloseGlyph": "X",
	"General.RefreshResults": "刷新",
	"General.ManualRefresh": "手动刷新",
	"General.RefreshQuickly": "快速刷新",
	"General.Refresh5seconds": "每5秒刷新",
	"General.Refresh1minute": "每1分钟刷新",
	"AliasForm.AliasName": "别名",
	"AliasForm.NewAliasForIndex": "为 {0} 创建新别名",
	"AliasForm.DeleteAliasMessage": "输入 ''{0}''  删除 {1}. 此操作无法恢复",
	"AnyRequest.DisplayOptions" : "显示选项",
	"AnyRequest.AsGraph" : "图形视图",
	"AnyRequest.AsJson" : "原始 JSON",
	"AnyRequest.AsTable" : "表格视图",
	"AnyRequest.History" : "历史记录",
	"AnyRequest.RepeatRequest" : "重复请求",
	"AnyRequest.RepeatRequestSelect" : "重复周期 ",
	"AnyRequest.Transformer" : "结果转换器",
	"AnyRequest.Pretty": "易读",
	"AnyRequest.Query" : "查询",
	"AnyRequest.Request": "提交请求",
	"AnyRequest.Requesting": "请求中...",
	"AnyRequest.ValidateJSON": "验证 JSON",
	"Browser.Title": "数据浏览",
	"Browser.ResultSourcePanelTitle": "原始数据",
	"Command.DELETE": "删除",
	"Command.SHUTDOWN": "关闭",
	"Command.DeleteAliasMessage": "删除别名?",
	"ClusterOverView.IndexName": "索引名称",
	"ClusterOverview.NumShards": "分片数",
	"ClusterOverview.NumReplicas": "副本数",
	"ClusterOverview.NewIndex": "新建索引",
	"IndexActionsMenu.Title": "动作",
	"IndexActionsMenu.NewAlias": "新建别名...",
	"IndexActionsMenu.Refresh": "刷新",
	"IndexActionsMenu.Flush": "Flush刷新",
	"IndexActionsMenu.Optimize": "优化...",
	"IndexActionsMenu.Snapshot": "网关快照",
	"IndexActionsMenu.Analyser": "测试分析器",
	"IndexActionsMenu.Open": "开启",
	"IndexActionsMenu.Close": "关闭",
	"IndexActionsMenu.Delete": "删除...",
	"IndexInfoMenu.Title": "信息",
	"IndexInfoMenu.Status": "索引状态",
	"IndexInfoMenu.Metadata": "索引信息",
	"IndexCommand.TextToAnalyze": "文本分析",
	"IndexCommand.ShutdownMessage": "输入 ''{0}'' 以关闭 {1} 节点. 关闭的节点无法从此界面重新启动",
	"IndexOverview.PageTitle": "索引概览",
	"IndexSelector.NameWithDocs": "{0} ({1} 个文档)",
	"IndexSelector.SearchIndexForDocs": "搜索 {0} 的文档， 查询条件:",
	"FilterBrowser.OutputType": "返回格式: {0}",
	"FilterBrowser.OutputSize": "显示数量: {0}",
	"Header.ClusterHealth": "集群健康值: {0} ({1} of {2})",
	"Header.ClusterNotConnected": "集群健康值: 未连接",
	"Header.Connect": "连接",
	"Nav.AnyRequest": "复合查询",
	"Nav.Browser": "数据浏览",
	"Nav.ClusterHealth": "集群健康值",
	"Nav.ClusterState": "群集状态",
	"Nav.ClusterNodes": "集群节点",
	"Nav.Info": "信息",
	"Nav.NodeStats": "节点状态",
	"Nav.Overview": "概览",
	"Nav.Indices": "索引",
	"Nav.Plugins": "插件",
	"Nav.Status": "状态",
	"Nav.Templates": "模板",
	"Nav.StructuredQuery": "基本查询",
	"NodeActionsMenu.Title": "动作",
	"NodeActionsMenu.Shutdown": "关停...",
	"NodeInfoMenu.Title": "信息",
	"NodeInfoMenu.ClusterNodeInfo": "集群节点信息",
	"NodeInfoMenu.NodeStats": "节点状态",
	"NodeType.Client": "节点客户端",
	"NodeType.Coord": "协调器",
	"NodeType.Master": "主节点",
	"NodeType.Tribe": "分支结点",
	"NodeType.Worker": "工作节点",
	"NodeType.Unassigned": "未分配",
	"OptimizeForm.OptimizeIndex": "优化 {0}",
	"OptimizeForm.MaxSegments": "最大索引段数",
	"OptimizeForm.ExpungeDeletes": "只删除被标记为删除的",
	"OptimizeForm.FlushAfter": "优化后刷新",
	"OptimizeForm.WaitForMerge": "等待合并",
	"Overview.PageTitle" : "集群概览",
	"Output.JSON": "JSON",
	"Output.Table": "Table",
	"Output.CSV": "CSV",
	"Output.ShowSource": "显示查询语句",
	"Preference.SortCluster": "集群排序",
	"Sort.ByName": "按名称",
	"Sort.ByAddress": "按地址",
	"Sort.ByType": "按类型",
	"TableResults.Summary": "查询 {1} 个分片中用的 {0} 个. {2} 命中. 耗时 {3} 秒",
	"QueryFilter.AllIndices": "所有索引",
	"QueryFilter.AnyValue": "任意",
	"QueryFilter-Header-Indices": "索引",
	"QueryFilter-Header-Types": "类型",
	"QueryFilter-Header-Fields": "字段",
	"QueryFilter.DateRangeHint.from": "从 : {0}",
	"QueryFilter.DateRangeHint.to": "  到 : {0}",
	"Query.FailAndUndo": "查询失败. 撤消最近的更改",
	"StructuredQuery.ShowRawJson": "显示原始 JSON"
});

i18n.setKeys({
	"AnyRequest.TransformerHelp" : "\
		<p>结果转换器用于返回结果原始JSON的后续处理, 将结果转换为更有用的格式.</p>\
		<p>转换器应当包含javascript函数体. 函数的返回值将传递给json分析器</p>\
		<p>Example:<br>\
		  <code>return root.hits.hits[0];</code><br>\
		  遍历结果并只显示第一个元素<br>\
		  <code>return Object.keys(root.nodes).reduce(function(tot, node) { return tot + root.nodes[node].os.mem.used_in_bytes; }, 0);</code><br>\
		  将返回整个集群使用的总内存<br></p>\
		<p>以下函数可以方便的处理数组与对象<br>\
		<ul>\
			<li><i>Object.keys</i>(object) := array</li>\
			<li>array.<i>forEach</i>(function(prop, index))</li>\
			<li>array.<i>map</i>(function(prop, index)) := array</li>\
			<li>array.<i>reduce</i>(function(accumulator, prop, index), initial_value) := final_value</li>\
		</ul>\
		<p>当启用重复请求时, prev 参数将会传递给转换器函数. 这将用于比较并累加图形</p>\
		<p>Example:<br>\
		<code>var la = [ root.nodes[Object.keys(root.nodes)[0]].os.load_average[0] ]; return prev ? la.concat(prev) : la;</code><br>\
		将返回第一个集群节点最近一分钟内的平均负载\
		将会把结果送人图表以产生一个负载曲线图\
		"
});

i18n.setKeys({
	"AnyRequest.DisplayOptionsHelp" : "\
		<p>原始 Json: 将完整的查询结果转换为原始JSON格式 </p>\
		<p>图形视图: 将查询结果图形化, 将查询结果转换为数组值的形式</p>\
		<p>表格视图: 如果查询是一个搜索, 可以将搜索结果以表格形式显示.</p>\
		"
});

i18n.setKeys({
	"QueryFilter.DateRangeHelp" : "\
		<p>Date 字段接受日期范围的形式查询.</p>\
		<p>一下格式被支持:</p>\
		<ul>\
			<li><b>关键词 / 关键短语</b><br>\
				<code>now<br> today<br> tomorrow<br> yesterday<br> last / this / next + week / month / year</code><br>\
				搜索关键字匹配的日期. <code>last year</code> 将搜索过去全年.</li>\
			<li><b>范围</b><br>\
				<code>1000 secs<br> 5mins<br> 1day<br> 2days<br> 80d<br> 9 months<br> 2yrs</code> (空格可选, 同等于多个范围修饰词)<br>\
				创建一个指定时间范围的搜索, 将围绕<code>现在</code> 并延伸至过去与未来时间段.</li>\
			<li><b>DateTime 与 DateTime局部</b><br>\
				<code>2011<br> 2011-01<br> 2011-01-18<br> 2011-01-18 12<br> 2011-01-18 12:32<br> 2011-01-18 12:32:45</code><br>\
				指定一个特定的日期范围. <code>2011</code>会搜索整个 2011年, 而 <code>2011-01-18 12:32:45</code> 将只搜索1秒范围内</li>\
			<li><b>Time 与 Time局部</b><br>\
				<code>12<br> 12:32<br> 12:32:45</code><br>\
				这些格式只搜索当天的特定时间. <code>12:32</code> 将搜索当天的那一分钟</li>\
			<li><b>日期范围</b><br>\
				<code>2010 -&gt; 2011<br> last week -&gt; next week<br> 2011-05 -&gt;<br> &lt; now</code><br>\
				日期范围是将两个日期格式串 (日期关键字 / DateTime / Time) 用  &lt; 或 -&gt; (效果相同) 分隔. 如果缺少任意一端，那么在这个方向上时间将没有限制.</li>\
			<li><b>偏移日期范围</b><br>\
				<code>2010 -> 1yr<br> 3mins < now</code>\
				搜索包括指定方向上偏移的日期.</li>\
			<li><b>锚定范围</b><br>\
				<code>2010-05-13 05:13 <> 10m<br> now <> 1yr<br> lastweek <> 1month</code><br>\
				类似于上面的便宜日期，在两个方向上将锚定的日期延长</li>\
		</ul>\
	"
});
