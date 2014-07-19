if (!JSON_DataView)
	var JSON_DataView = {};

if (!JSON_DataView.StreamConverter) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

	JSON_DataView.StreamConverter = function() {};

	JSON_DataView.StreamConverter.prototype = {
		classDescription: "JSON to HTML stream converter",
		classID: Components.ID("{706e5fd4-2133-4590-afb0-790879a740db}"),
		contractID: "@mozilla.org/streamconv;1?from=application/json&to=*/*",

		_xpcom_factory: {
			createInstance: function(outer, iid) {
				if (outer != null)
					throw Components.results.NS_ERROR_NO_AGGREGATION;

				if (iid.equals(Components.interfaces.nsISupports) ||
					iid.equals(Components.interfaces.nsIStreamConverter) ||
					iid.equals(Components.interfaces.nsIStreamListener) ||
					iid.equals(Components.interfaces.nsIRequestObserver)) {
					return new JSON_DataView.StreamConverter();
				}
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
		},

		QueryInterface: XPCOMUtils.generateQI(
			[Components.interfaces.nsIObserver,
			Components.interfaces.nsIStreamConverter,
			Components.interfaces.nsIStreamListener,
			Components.interfaces.nsIRequestObserver]
		),

		onStartRequest: function(aRequest, aContext) {
			this.data    = "";
			this.uri     = aRequest.QueryInterface (Components.interfaces.nsIChannel).URI.spec;
		    this.channel = aRequest;
		    this.channel.contentType = "text/html";
			this.channel.contentCharset = "UTF-8";
		    this.listener.onStartRequest (this.channel, aContext);
		},

		onStopRequest: function(aRequest, aContext, aStatusCode) {
		    var sis = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
		    sis.setData(this.data, this.data.length);
		    this.listener.onDataAvailable(this.channel, aContext, sis, 0, this.data.length);
		    this.listener.onStopRequest(this.channel, aContext, aStatusCode);
		},

		onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
			var si = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance();
			si     = si.QueryInterface(Components.interfaces.nsIScriptableInputStream);
			si.init(aInputStream);
			this.data += si.read(aCount);
		},

		asyncConvertData: function(aFromType, aToType, aListener, aCtxt) {
		    this.listener = aListener;
		},

		convert: function(aFromStream, aFromType, aToType, aCtxt) {
		    return aFromStream;
		}
	};
}

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([JSON_DataView.StreamConverter]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([JSON_DataView.StreamConverter]);
