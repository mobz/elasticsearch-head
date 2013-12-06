(function( $, app ) {

	var ui = app.ns("ui");

	ui.ResultTable = ui.Table.extend({
		defaults: {
			width: 500,
			height: 400,
			cluster: null  // (required) instanceof es.Cluster
		},

		init: function() {
			this._super();
			this.cluster = this.config.cluster
			this.on("rowClick", this._showPreview_handler);
			this.on("rowRightClick", this._showDeleteMenu_handler);
			this.selectedRow = null;
			$(document).bind("keydown", this._nav_handler);
		},
		remove: function() {
			$(document).unbind("keydown", this._nav_handler);
			this._super();
		},
		attach: function(parent) {
			if(parent) {
				var height = parent.height() || ( $(document).height() - parent.offset().top - 41 ); // 41 = height in px of .uiTable-tools + uiTable-header
				var width = parent.width();
				this.el.width( width );
				this.body.width( width ).height( height );
			}
			this._super(parent);
		},
		showPreview: function(row) {
			row.addClass("selected");
			this.preview = new app.ui.JsonPanel({
				title: i18n.text("Browser.ResultSourcePanelTitle"),
				json: row.data("row")._source,
				onClose: function() { row.removeClass("selected"); }
			});
		},
		_nav_handler: function(jEv) {
			if(jEv.keyCode !== 40 && jEv.keyCode !== 38) {
				return;
			}
			this.selectedRow && this.preview && this.preview.remove();
			if(jEv.keyCode === 40) { // up arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.next("TR") : this.body.find("TR:first");
			} else if(jEv.keyCode === 38) { // down arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.prev("TR") : this.body.find("TR:last");
			}
			this.selectedRow && this.showPreview(this.selectedRow);
		},
		_showPreview_handler: function(obj, data) {
			this.showPreview(this.selectedRow = data.row);
		},
		_showDeleteMenu_handler: function(obj, data) {
			var menuElement = $({tag: "DIV", cls: "ui"});
			var menuPanel = new ui.MenuPanelOnElement({
				element: data.row,
				items: [
					{ text: i18n.text("Browser.DeleteRecord"), onclick: function() { this._deleteRow(data.row) }.bind(this) }
				]
			});
			var menuPaneljQ = $(menuPanel).appendTo(menuElement);
			menuPanel.open(data.event);
			menuPaneljQ.offset({
				top: data.event.pageY,
				left: data.event.pageX
			});
			data.event.preventDefault();
		},
		_deleteRow: function(row) {
			var rowData = row.data("row");
			rowData = rowData["_source"];
			// Delete from the index.
			this.cluster.delete(rowData["_index"] + "/" + rowData["_type"] + "/" + encodeURIComponent(rowData["_id"]));
			// Remove the row from table.
			row.remove();
		}
	});

	ui.MenuPanelOnElement = ui.MenuPanel.extend({
		defaults: {
			element: null // Required DOM element
		},
		init: function() {
			this._super();
			this.element = $(this.config.element);
		},
		open : function(jEv) {
			this.element.addClass("selected");
			this._super(jEv);
		},
		_close_handler: function(jEv) {
			this.element.removeClass("selected");
			this._super(jEv);
		}
	});

})( this.jQuery, this.app );
