addEventListener("DOMContentLoaded", function(event) {
	// sanity check: only pass the 'document' element
	if (event.originalTarget.nodeName != "#document"){return};

	sendAsyncMessage("JSON-DataView-onPageLoad", "", {"document": event.originalTarget});
});
