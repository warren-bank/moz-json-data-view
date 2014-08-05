Components.utils.import("chrome://JSON-DataView/content/generate_stream_converter.js");

var this_stream_converter = (function(){
	var class_description, class_id, from_mime_type;

	class_description	= "JSON to HTML stream converter";
	class_id			= "{08890b76-aa5d-4e0a-bb3e-17091b26285b}";
	from_mime_type		= "text/json";

	generate_stream_converter(class_description, class_id, from_mime_type);

	return JSON_DataView.StreamConverters[class_id];
})();

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ this_stream_converter ]);
else
    var NSGetModule  = XPCOMUtils.generateNSGetModule( [ this_stream_converter ]);
