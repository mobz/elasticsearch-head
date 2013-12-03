i18n.setKeys({
	"General.ElasticSearch": "ElasticSearch",
	"General.LoadingFacets": "Carregando Facetas...",
	"General.Searching": "Buscando...",
	"General.Search": "Busca",
	"General.Help": "Ajuda",
	"General.HelpGlyph": "?",
	"General.CloseGlyph": "X",
	"General.RefreshResults": "Atualizar",
	"General.ManualRefresh": "Atualização Manual",
	"General.RefreshQuickly": "Atualização rápida",
	"General.Refresh5seconds": "Atualização a cada 5 segundos",
	"General.Refresh1minute": "Atualização a cada minuto",
	"AliasForm.AliasName": "Apelido",
	"AliasForm.NewAliasForIndex": "Novo apelido para {0}",
	"AliasForm.DeleteAliasMessage": "digite ''{0}'' para deletar {1}. Não há como voltar atrás",
	"AnyRequest.DisplayOptions" : "Mostrar Opções",
	"AnyRequest.AsGraph" : "Mostrar como grafo",
	"AnyRequest.AsJson" : "Mostrar JSON bruto",
	"AnyRequest.AsTable" : "Mostrar tabela de resultados",
	"AnyRequest.History" : "Histórico",
	"AnyRequest.RepeatRequest" : "Refazer requisição",
	"AnyRequest.RepeatRequestSelect" : "Repetir requisição a cada ",
	"AnyRequest.Transformer" : "Transformador de resultado",
	"AnyRequest.Pretty": "Amigável",
	"AnyRequest.Query" : "Consulta",
	"AnyRequest.Request": "Requisição",
	"AnyRequest.Requesting": "Realizando requisição...",
	"AnyRequest.ValidateJSON": "Validar JSON",
	"Browser.Title": "Navegador",
	"Browser.ResultSourcePanelTitle": "Resultado",
	"Command.DELETE": "DELETAR",
	"Command.SHUTDOWN": "DESLIGAR",
	"Command.DeleteAliasMessage": "Remover apelido?",
	"ClusterOverView.IndexName": "Nome do índice",
	"ClusterOverview.NumShards": "Número de Shards",
	"ClusterOverview.NumReplicas": "Número de Réplicas",
	"ClusterOverview.NewIndex": "Novo índice",
	"IndexActionsMenu.Title": "Ações",
	"IndexActionsMenu.NewAlias": "Novo apelido...",
	"IndexActionsMenu.Refresh": "Atualizar",
	"IndexActionsMenu.Flush": "Flush",
	"IndexActionsMenu.Snapshot": "Snapshot do Gateway",
	"IndexActionsMenu.Analyser": "Analizador de teste",
	"IndexActionsMenu.Open": "Abrir",
	"IndexActionsMenu.Close": "Fechar",
	"IndexActionsMenu.Delete": "Deletar...",
	"IndexInfoMenu.Title": "Info",
	"IndexInfoMenu.Status": "Status do índice",
	"IndexInfoMenu.Metadata": "Metadados do índice",
	"IndexCommand.TextToAnalyze": "Texto para analizar",
	"IndexCommand.ShutdownMessage": "digite ''{0}'' para desligar {1}. Nó NÃO PODE ser reiniciado à partir dessa interface",
	"IndexSelector.NameWithDocs": "{0} ({1} documentoss)",
	"IndexSelector.SearchIndexForDocs": "Busca {0} por documentos onde:",
	"FilterBrowser.OutputType": "Resultados: {0}",
	"FilterBrowser.OutputSize": "Número de Resultados: {0}",
	"Header.ClusterHealth": "saúde do cluster: {0} ({1}, {2})",
	"Header.ClusterNotConnected": "saúde do cluster: não conectado",
	"Header.Connect": "Conectar",
	"Nav.AnyRequest": "Qualquer requisição",
	"Nav.Browser": "Navegador",
	"Nav.ClusterHealth": "Saúde do Cluster",
	"Nav.ClusterState": "Estado do Cluster",
	"Nav.ClusterNodes": "Nós do Cluster",
	"Nav.Info": "Informações",
	"Nav.NodeStats": "Estatísticas do nó",
	"Nav.Overview": "Visão Geral",
	"Nav.Plugins": "Plugins",
	"Nav.Status": "Status",
	"Nav.StructuredQuery": "Consulta Estruturada",
	"NodeActionsMenu.Title": "Ações",
	"NodeActionsMenu.Shutdown": "Desligar...",
	"NodeInfoMenu.Title": "Informações",
	"NodeInfoMenu.ClusterNodeInfo": "Informações do Nó do Cluster",
	"NodeInfoMenu.NodeStats": "Estatísticas do Nó",
	"NodeType.Master": "Nó master",
	"NodeType.Coord": "Coordenador",
	"NodeType.Worker": "Nó trabalhador",
	"NodeType.Client": "Nó cliente",
	"Overview.PageTitle" : "Visão geral do Cluster",
	"Output.JSON": "JSON",
	"Output.Table": "Tabela",
	"Output.CSV": "CSV",
	"Output.ShowSource": "Mostrar consulta original",
	"TableResults.Summary": "Buscado {0} de {1} shards. {2} resultados. {3} segundos",
	"QueryFilter.AllIndices": "Todos os Índices",
	"QueryFilter.AnyValue": "qualquer",
	"QueryFilter-Header-Indices": "Índices",
	"QueryFilter-Header-Types": "Tipos",
	"QueryFilter-Header-Fields": "Campos",
	"QueryFilter.DateRangeHint.from": "De : {0}",
	"QueryFilter.DateRangeHint.to": "  A : {0}",
	"Query.FailAndUndo": "Consulta falhou. Desfazendo últimas alterações",
	"StructuredQuery.ShowRawJson": "Mostrar JSON bruto" 
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