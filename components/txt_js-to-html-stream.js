Components.utils.import("chrome://JSON-DataView/content/generate_stream_converter.js");

var this_stream_converter = (function(){
	var class_description, class_id, from_mime_type;

	class_description	= "JSON to HTML stream converter";
	class_id			= "{fb38a18e-abc8-4195-8e00-bf3b50bdc403}";
	from_mime_type		= "text/javascript";

	generate_stream_converter(class_description, class_id, from_mime_type);

	return JSON_DataView.StreamConverters[class_id];
})();

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ this_stream_converter ]);
else
    var NSGetModule  = XPCOMUtils.generateNSGetModule( [ this_stream_converter ]);
