Components.utils.import("chrome://JSON-DataView/content/generate_stream_converter.js");

var this_stream_converter = (function(){
	var class_description, class_id, from_mime_type;

	class_description	= "JSON to HTML stream converter";
	class_id			= "{7b20ad9d-f7cb-4d94-9499-7d29730abe2b}";
	from_mime_type		= "text/plain";

	generate_stream_converter(class_description, class_id, from_mime_type);

	return JSON_DataView.StreamConverters[class_id];
})();

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ this_stream_converter ]);
else
    var NSGetModule  = XPCOMUtils.generateNSGetModule( [ this_stream_converter ]);
