/*
 * column-converters.js
 * Eugen Eisler
 *
 * namespace for column converters is "window.es.converter"
 * 
 * custom converter can be added with this signature: 
 * converter.<id of converter>(hit,column)
 * 
 * converter can be bind to columns in "_meta.elasticsearch-head.browser.columns" by "{... "converter":{"id": "link", "type":"file"} ... }
 *
 * Example type mapping
{
    "fileInfo" : {
    	"_parent"    : {"type" : "container"},
    	"properties" : {
        	"name"     : {"type" : "string", "index" : "not_analyzed"},
        	"date"		 : {"type" : "date"},
        	"fileType" : {"type" : "string", "include_in_all" : false, "index" : "not_analyzed"},
        	"size"		 : {"type" : "long"}
        },
        "_meta" : {
        	"elasticsearch-head" : {
            	"loadParents"	: true,
            	"browser" 		: {
                	"columns" : [
                		{"label": "Name", "path":"_source.name", "converter":{"id": "link", "prefix":"file://"}},
                		{"label": "Type", "path":"_source.fileType"},
                		{"label": "Date", "path":"_source.date", "converter":{"id": "date", "pattern":""}},
                		{"label": "Size", "path":"_source.size"},
                		{"label": "Folder", "path":"_parent._source.folder", "converter":{"id": "link", "prefix":"file://"}},
                		{"label": "ContainerId", "path":"fields._parent"}
                	]
                }
            }
        }
    }
}
*/

(function() {
  
	var converter = window.es.converter = {};

  window.isUnset = function (object) {
    return (typeof object === "undefined")
  };
    
  converter.resolveProperty = function(hit, path) {
    var relObj=hit;
    var parts = path.split(".");
    for(var i =0;i<parts.length;i++){
      try{
        relObj = relObj[parts[i]];
      }catch(e){
        relObj = null;
        break;
      }
    }
    return relObj;
  };

  //default converter - get the value by path
  converter.value = function(hit, column){
    return {value:this.resolveProperty(hit, column.path), isHTML:false};
  };

  //link converter - generate anchor link.
  //parameter "prefix" prefix before value, e.g. 'file://' or 'http://'
  converter.link = function(hit, column){
    var value = this.resolveProperty(hit, column.path);
    var link = isUnset(column.converter.prefix) ? value : column.converter.prefix + value;;
    return {value:"<a href=\"" + link + "/\" target=\"_blank\">" + value + "</a>", isHTML:true};
  };
})();

