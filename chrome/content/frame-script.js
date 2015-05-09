addEventListener("DOMContentLoaded", function(event) {
	// sanity check: only pass the 'document' element
	if (event.originalTarget.nodeName != "#document"){return};

	sendSyncMessage("JSON-DataView-onPageLoad", event.originalTarget);
});
