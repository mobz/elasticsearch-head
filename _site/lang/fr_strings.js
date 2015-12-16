i18n.setKeys({
//	"General.Elasticsearch": "Elasticsearch",
	"General.LoadingAggs" : "Chargement des facettes...",
	"General.Searching": "Recherche en cours...",
	"General.Search": "Recherche",
	"General.Help": "Aide",
//	"General.HelpGlyph": "?",
//	"General.CloseGlyph": "X",
	"General.RefreshResults": "Rafraîchir",
	"General.ManualRefresh": "Rafraîchissement manuel",
	"General.RefreshQuickly": "Rafraîchissement rapide",
	"General.Refresh5seconds": "Rafraîchissement toutes les 5 secondes",
	"General.Refresh1minute": "Rafraîchissement toutes les minutes",
	"AliasForm.AliasName": "Alias",
	"AliasForm.NewAliasForIndex": "Nouvel Alias pour {0}",
	"AliasForm.DeleteAliasMessage": "Entrez ''{0}'' pour effacer {1}. Attention, action irréversible.",
	"AnyRequest.DisplayOptions" : "Options d'affichage",
	"AnyRequest.AsGraph" : "En graphe",
	"AnyRequest.AsJson" : "En JSON brut",
	"AnyRequest.AsTable" : "En tableau",
	"AnyRequest.History" : "Historique",
	"AnyRequest.RepeatRequest" : "Répétition automatique de la requête",
	"AnyRequest.RepeatRequestSelect" : "Répéter la requête toutes les ",
	"AnyRequest.Transformer" : "Transformation des résultats",
//	"AnyRequest.Pretty": "Pretty",
	"AnyRequest.Query" : "Recherche",
	"AnyRequest.Request": "Requête",
	"AnyRequest.Requesting": "Requête en cours...",
	"AnyRequest.ValidateJSON": "Valider le JSON",
	"Browser.Title": "Navigateur",
	"Browser.ResultSourcePanelTitle": "Résultat au format JSON",
	"Command.DELETE": "SUPPRIMER",
	"Command.SHUTDOWN": "ETEINDRE",
	"Command.DeleteAliasMessage": "Supprimer l'Alias?",
	"ClusterOverView.IndexName": "Index",
	"ClusterOverview.NumShards": "Nombre de shards",
	"ClusterOverview.NumReplicas": "Nombre de replica",
	"ClusterOverview.NewIndex": "Nouvel Index",
//	"IndexActionsMenu.Title": "Actions",
	"IndexActionsMenu.NewAlias": "Nouvel Alias...",
	"IndexActionsMenu.Refresh": "Rafraîchir",
	"IndexActionsMenu.Flush": "Flusher",
	"IndexActionsMenu.Optimize": "Optimiser...",
	"IndexActionsMenu.Snapshot": "Dupliquer l'index (Snapshot)",
	"IndexActionsMenu.Analyser": "Tester un analyseur",
	"IndexActionsMenu.Open": "Ouvrir",
	"IndexActionsMenu.Close": "Fermer",
	"IndexActionsMenu.Delete": "Effacer...",
//	"IndexInfoMenu.Title": "Info",
	"IndexInfoMenu.Status": "Etat de l'Index",
	"IndexInfoMenu.Metadata": "Métadonnées de l'Index",
	"IndexCommand.TextToAnalyze": "Texte à analyser",
	"IndexCommand.ShutdownMessage": "Entrez ''{0}'' pour éteindre {1}. Le noeud NE PEUT PAS être redémarré depuis cette interface.",
//	"IndexSelector.NameWithDocs": "{0} ({1} docs)",
	"IndexSelector.SearchIndexForDocs": "Chercher dans {0} les documents correspondant à",
	"FilterBrowser.OutputType": "Format d'affichage des résultats {0}",
	"FilterBrowser.OutputSize": "Nombre de Résultats: {0}",
	"Header.ClusterHealth": "Santé du cluster: {0} ({1} {2})",
	"Header.ClusterNotConnected": "Santé du cluster: non connecté",
	"Header.Connect": "Se connecter",
	"Nav.AnyRequest": "Autres requêtes",
	"Nav.StructuredQuery": "Requêtes structurées",
	"Nav.Browser": "Navigateur",
	"Nav.ClusterHealth": "Santé du cluster",
	"Nav.ClusterState": "Etat du cluster",
	"Nav.ClusterNodes": "Noeuds du cluster",
//	"Nav.Info": "Info",
	"Nav.NodeStats": "Statistiques sur les noeuds",
	"Nav.Overview": "Aperçu",
	"Nav.Indices": "Index",
	"Nav.Plugins": "Plugins",
	"Nav.Status": "Etat",
	"Nav.Templates": "Templates",
	"Nav.StructuredQuery": "Recherche Structurée",
//	"NodeActionsMenu.Title": "Actions",
	"NodeActionsMenu.Shutdown": "Eteindre...",
//	"NodeInfoMenu.Title": "Info",
	"NodeInfoMenu.ClusterNodeInfo": "Infos sur le noeud du cluster",
	"NodeInfoMenu.NodeStats": "Statistiques du noeud",
	"NodeType.Client": "Noeud Client",
	"NodeType.Coord": "Coordinateur",
	"NodeType.Master": "Noeud Master",
	"NodeType.Tribe": "Noeud Tribe",
	"NodeType.Worker": "Noeud Worker",
	"NodeType.Unassigned": "Non assigné",
	"OptimizeForm.OptimizeIndex": "Optimiser {0}",
	"OptimizeForm.MaxSegments": "Nombre maximum de segments",
	"OptimizeForm.ExpungeDeletes": "Seulement purger les suppressions",
	"OptimizeForm.FlushAfter": "Flusher après l'optimisation",
	"OptimizeForm.WaitForMerge": "Attendre la fin de la fusion",
	"Overview.PageTitle" : "Aperçu du cluster",
//	"Output.JSON": "JSON",
	"Output.Table": "Tableau",
	"Output.ShowSource": "Voir la requête source",
    "TableResults.Summary": "Recherche sur {0} des {1} shards. {2} résultats. {3} secondes",
	"QueryFilter.AllIndices": "Tous les index",
	"QueryFilter.AnyValue": "Tout",
	"QueryFilter-Header-Indices": "Index",
//	"QueryFilter-Header-Types": "Types",
	"QueryFilter-Header-Fields": "Champs",
	"QueryFilter.DateRangeHint.from": "De : {0}",
	"QueryFilter.DateRangeHint.to": "  A : {0}",
	"Query.FailAndUndo": "Requête en échec. Annulation des dernières modifications.",
	"StructuredQuery.ShowRawJson": "Voir le JSON brut"
});

i18n.setKeys({
	"AnyRequest.TransformerHelp" : "\
		<p>Le transformateur de résultats peut être utilisé pour modifier a posteriori les résultats JSON bruts dans un format plus utile.</p>\
		<p>Le transformateur devrait contenir le corps d'une fonction javascript. La valeur de retour de la fonction devient la nouvelle valeur qui sera passée à l'afficheur des documents JSON.</p>\
		<p>Exemple:<br>\
		  <code>return root.hits.hits[0];</code> ne renverra que le premier élément de l'ensemble des résultats.<br>\
		  <code>return Object.keys(root.nodes).reduce(function(tot, node) { return tot + root.nodes[node].os.mem.used_in_bytes; }, 0);</code> retournera la mémoire totale utilisée dans l'ensemble du cluster.<br></p>\
		<p>Les fonctions suivantes sont disponibles et peuvent vous être utiles pour travailler sur les tableaux et les objets:<br>\
		<ul>\
			<li><i>Object.keys</i>(object) := array</li>\
			<li>array.<i>forEach</i>(function(prop, index))</li>\
			<li>array.<i>map</i>(function(prop, index)) := array</li>\
			<li>array.<i>reduce</i>(function(accumulator, prop, index), initial_value) := final_value</li>\
		</ul>\
		<p>Lorsque vous activez la répétition automatique de la requête, un paramètre supplémentaire nommé prev est passé à la fonction de transformation. Cela permet les comparaisons et les graphes cumulatifs.</p>\
		<p>Exemple:<br>\
		<code>var la = [ root.nodes[Object.keys(root.nodes)[0]].os.load_average[0] ]; return prev ? la.concat(prev) : la;</code> retournera la charge moyenne du premier noeud du cluster pour la dernière minute écoulée.\
		Cela peut alimenter ensuite le graphe pour produire un graphe de charge du noeud.\
		"
});

i18n.setKeys({
	"AnyRequest.DisplayOptionsHelp" : "\
		<p>En JSON brut: affiche les résultats complets de la recherche éventuellement transformée au format JSON brut.</p>\
		<p>En graphe: pour fabriquer un graphe de vos résultats, utilsez la transformation de résultats pour générer un tableau de valeurs.</p>\
		<p>En tableau: si votre requête est une recherche, vous pouvez alors afficher les résultats dans un tableau.</p>\
		"
});

i18n.setKeys({
	"QueryFilter.DateRangeHelp" : "\
		<p>Les champs Date acceptent une requête en langage naturel pour produire un écart de date (from/to) correspondant.</p>\
		<p>Les formats suivants sont acceptés :</p>\
		<ul>\
			<li><b>Mots clés</b><br>\
				<code>now<br> today<br> tomorrow<br> yesterday<br> last / this / next + week / month / year</code><br>\
				Cherchera pour des dates correspondant au mot clé. <code>last year</code> cherchera sur toute l'année précédente.</li>\
			<li><b>Ecarts</b><br>\
				<code>1000 secs<br> 5mins<br> 1day<br> 2days<br> 80d<br> 9 months<br> 2yrs</code> (les espaces sont optionnels et il existe beaucoup de synonymes pour qualifier les écarts)<br>\
				Créé un écart de date basé sur l'heure courante (maintenant) avec plus ou moins l'écart indiqué.</li>\
			<li><b>Dates et Dates partielles</b><br>\
				<code>2011<br> 2011-01<br> 2011-01-18<br> 2011-01-18 12<br> 2011-01-18 12:32<br> 2011-01-18 12:32:45</code><br>\
				Ces formats indiquent un écart de date spécifique. <code>2011</code> cherchera sur toute l'année 2011, alors que <code>2011-01-18 12:32:45</code> ne cherchera que pour la date précise à la seconde près.</li>\
			<li><b>Heures et heures partielles</b><br>\
				<code>12<br> 12:32<br> 12:32:45</code><br>\
				Ces formats indiquent un espace de temps pour la date du jour. <code>12:32</code> cherchera les éléments d'aujourd'hui à cette minute précise.</li>\
			<li><b>Ecart de Date</b><br>\
				<code>2010 -&gt; 2011<br> last week -&gt; next week<br> 2011-05 -&gt;<br> &lt; now</code><br>\
				Un écart de date est créé en spécifiant deux dates dans n'importe lequel des formats précédents (Mot clé / Dates / Heures) séparées par &lt; ou -&gt; (les deux produisent le même effet). Si la date de fin n'est pas indiquée, alors il n'y aura aucune contrainte de fin.</li>\
			<li><b>Ecart de date avec décalage</b><br>\
				<code>2010 -> 1yr<br> 3mins < now</code>\
				Cherche en incluant un décalage de la date dans la direction indiquée.</li>\
			<li><b>Ecart de date avec bornes</b><br>\
				<code>2010-05-13 05:13 <> 10m<br> now <> 1yr<br> lastweek <> 1month</code><br>\
				Similaire à ci-dessus excepté que le décalage est appliqué dans les deux sens à partir de la date indiquée.</li>\
		</ul>\
	"
});
