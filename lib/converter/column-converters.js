/*
 * column-converters.js
 * Eugen Eisler
 *
 * namespace for column converters is "window.es.converter"
 * 
 * custom converter can be added with this signature: 
 * converter.<id of converter>(hit,column)
 * 
 * converted value can be just a target value or object with two properties {value:xx, isHTML:true/false}
 * if isHTML is true then the value is rendered as innerHTML of DIV cell element
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
                		{"label": "Name", "path":"_source.name", "converter":{"id": "link", "prefix":"file://" } },
                		{"label": "Type", "path":"_source.fileType"},
                		{"label": "Date", "path":"_source.date", "converter":{"id": "date", "pattern":"DD-MM-YYYY HH:mm"}},
                		{"label": "Size", "path":"_source.size", "converter":{"id": "bytesToSize", "precision":2}},
                		{"label": "Folder", "path":"_parent._source.folder", "converter":{"id": "link", "prefix":"file://" } },
                		{"label": "ContainerId", "path":"fields._parent"}
                	]
                }
            }
        }
    }
}
 */

(function() {

	var converter=window.es.converter={};

	window.isUnset=function(object) {
		return(typeof object==="undefined")
	};

	converter.resolveProperty=function(hit,path) {
		var relObj=hit;
		var parts=path.split(".");
		for( var i=0;i<parts.length;i++){
			try{
				relObj=relObj[parts[i]];
			}catch(e){
				relObj=null;
				break;
			}
		}
		return relObj;
	};

	// default converter - get the value by path
	converter.value=function(hit,column) {
		return {value:this.resolveProperty(hit,column.path),isHTML:false};
	};

	// link converter - generate anchor link.
	// parameter "prefix" prefix before value, e.g. 'file://' or 'http://'
	converter.link=function(hit,column) {
		var value=this.resolveProperty(hit,column.path);
		var link=isUnset(column.converter.prefix)?value:column.converter.prefix
				+value;
		;
		return {value:"<a href=\""+link+"/\" target=\"_blank\">"+value+"</a>",
			isHTML:true};
	};

	// Convert number of bytes into human readable formatb
	// parameter: precision (decimal places)
	converter.bytesToSize=function(hit,column) {
		var ret=this.resolveProperty(hit,column.path);
		if(!isNaN(ret)&&ret!=0){
			var precision=isUnset(column.converter.precision)
					||isNaN(column.converter.precision)?2
					:Number(column.converter.precision);
			var sizes=['B','KB','MB','GB','TB'];
			var posttxt=0;
			while(ret>=1024){
				posttxt++;
				ret=ret/1024;
			}
			ret=ret.toFixed(precision)+" "+sizes[posttxt];
		}
		if(ret==0){
			ret="0";
		}
		return {value:ret,isHTML:false};
	};
})();
