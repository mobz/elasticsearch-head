exports.vendorJs = [
	'src/vendor/jquery/jquery.js',
	'src/vendor/joey/joey.js',
	'src/vendor/nohtml/jquery-nohtml.js',
	'src/vendor/graphael/g.raphael.standalone.js',
	'src/vendor/dateRangeParser/date-range-parser.js'
];

exports.vendorCss = [
	'src/vendor/font-awesome/css/font-awesome.css'
];

exports.srcJs = [
	'src/app/base/boot.js',

	'src/app/ux/class.js',
	'src/app/ux/templates/templates.js',
	'src/app/ux/observable.js',
	'src/app/ux/singleton.js',
	'src/app/ux/dragdrop.js',
	'src/app/ux/fieldCollection.js',

	'src/app/data/model/model.js',
	'src/app/data/dataSourceInterface.js',
	'src/app/data/resultDataSourceInterface.js',
	'src/app/data/metaData.js',
	'src/app/data/metaDataFactory.js',
	'src/app/data/query.js',
	'src/app/data/queryDataSourceInterface.js',
	'src/app/data/boolQuery.js',

	'src/app/services/preferences/preferences.js',
	'src/app/services/cluster/cluster.js',
	'src/app/services/clusterState/clusterState.js',

	'src/app/ui/abstractWidget/abstractWidget.js',
	'src/app/ui/abstractField/abstractField.js',
	'src/app/ui/textField/textField.js',
	'src/app/ui/checkField/checkField.js',
	'src/app/ui/button/button.js',
	'src/app/ui/menuButton/menuButton.js',
	'src/app/ui/splitButton/splitButton.js',
	'src/app/ui/refreshButton/refreshButton.js',
	'src/app/ui/toolbar/toolbar.js',
	'src/app/ui/abstractPanel/abstractPanel.js',
	'src/app/ui/draggablePanel/draggablePanel.js',
	'src/app/ui/infoPanel/infoPanel.js',
	'src/app/ui/dialogPanel/dialogPanel.js',
	'src/app/ui/menuPanel/menuPanel.js',
	'src/app/ui/selectMenuPanel/selectMenuPanel.js',
	'src/app/ui/table/table.js',
	'src/app/ui/csvTable/csvTable.js',
	'src/app/ui/jsonPretty/jsonPretty.js',
	'src/app/ui/panelForm/panelForm.js',
	'src/app/ui/helpPanel/helpPanel.js',
	'src/app/ui/jsonPanel/jsonPanel.js',
	'src/app/ui/sidebarSection/sidebarSection.js',
	'src/app/ui/resultTable/resultTable.js',
	'src/app/ui/queryFilter/queryFilter.js',
	'src/app/ui/page/page.js',
	'src/app/ui/browser/browser.js',
	'src/app/ui/anyRequest/anyRequest.js',
	'src/app/ui/nodesView/nodesView.js',
	'src/app/ui/clusterOverview/clusterOverview.js',
	'src/app/ui/dateHistogram/dateHistogram.js',
	'src/app/ui/clusterConnect/clusterConnect.js',
	'src/app/ui/structuredQuery/structuredQuery.js',
	'src/app/ui/filterBrowser/filterBrowser.js',
	'src/app/ui/indexSelector/indexSelector.js',
	'src/app/ui/header/header.js',
	'src/app/ui/indexOverview/indexOverview.js',

	'src/app/app.js'
];

exports.srcCss = [
	'src/app/ux/table.css',
	'src/app/ui/abstractField/abstractField.css',
	'src/app/ui/button/button.css',
	'src/app/ui/menuButton/menuButton.css',
	'src/app/ui/splitButton/splitButton.css',
	'src/app/ui/toolbar/toolbar.css',
	'src/app/ui/abstractPanel/abstractPanel.css',
	'src/app/ui/infoPanel/infoPanel.css',
	'src/app/ui/menuPanel/menuPanel.css',
	'src/app/ui/selectMenuPanel/selectMenuPanel.css',
	'src/app/ui/table/table.css',
	'src/app/ui/jsonPretty/jsonPretty.css',
	'src/app/ui/jsonPanel/jsonPanel.css',
	'src/app/ui/panelForm/panelForm.css',
	'src/app/ui/sidebarSection/sidebarSection.css',
	'src/app/ui/queryFilter/queryFilter.css',
	'src/app/ui/browser/browser.css',
	'src/app/ui/anyRequest/anyRequest.css',
	'src/app/ui/nodesView/nodesView.css',
	'src/app/ui/clusterOverview/clusterOverview.css',
	'src/app/ui/clusterConnect/clusterConnect.css',
	'src/app/ui/structuredQuery/structuredQuery.css',
	'src/app/ui/filterBrowser/filterBrowser.css',
	'src/app/ui/header/header.css',
	'src/app/app.css'
];
