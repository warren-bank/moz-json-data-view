---------------------------------------------------------------------------------------------------

https://developer.mozilla.org/en-US/Add-ons/Working_with_multiprocess_Firefox
https://developer.mozilla.org/en-US/Add-ons/Install_Manifests#multiprocessCompatible

https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/The_message_manager
https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Frame_script_environment
https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Limitations_of_frame_scripts
https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Limitations_of_chrome_scripts

---------------------------------------------------------------------------------------------------

http://dxr.mozilla.org/mozilla-central/source/dom/base/nsIMessageManager.idl#345

https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessageListenerManager

---------------------------------------------------------------------------------------------------

https://github.com/mdn/e10s-example-addons

https://github.com/mdn/e10s-example-addons/tree/master/run-script-in-all-pages
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-all-pages/ported-message-manager/src/chrome.manifest
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-all-pages/ported-message-manager/src/chrome/content/main.xul
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-all-pages/ported-message-manager/src/chrome/content/modify-all-pages.js
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-all-pages/ported-message-manager/src/chrome/content/frame-script.js

https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-active-page
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-active-page/ported-message-manager/src/bootstrap.js
https://github.com/mdn/e10s-example-addons/blob/master/run-script-in-active-page/ported-message-manager/src/frame-script.js

---------------------------------------------------------------------------------------------------

#### notes:

  * Frame scripts are associated with a browser tab, not with a page. So once you load them, they stay loaded until the tab is closed, even if you reload the document or navigate.
  * There is currently no way to unload them once you have loaded frame scripts, other than closing the tab they were loaded into.
  * `allowDelayedLoad` causes the frame script to automatically load into a new tab as soon as it is created.

#### conclusions:

  * There's no organized way to lazy-load a frame script, since it will remain loaded within the particular tab after the user navigates away.
  *	As such, all of my DOM accessors need to be placed into a frame script that is loaded by the `global message manager` into every tab.

---------------------------------------------------------------------------------------------------

#### v1.* methodology:

  * `chrome.manifest`
    > `overlay chrome://browser/content/browser.xul chrome://JSON-DataView/content/JSON-DataView.xul`

  * `JSON-DataView.xul`
    > `<script type="application/x-javascript" src="chrome://JSON-DataView/content/JSON-DataView.js"></script>`

  * `JSON-DataView.js`
    > ```javascript
window.addEventListener('load', function(){
    var appcontent = document.getElementById('appcontent');
    appcontent.addEventListener('DOMContentLoaded', onPageLoad, true);
}, false);
var onPageLoad = function(aEvent){
    var document = aEvent.originalTarget;
}
```

  * `onPageLoad` does all the real work. It calls various libraries and, ultimately, modifies the DOM of the `document` element that it receives as its parameter.

---------------------------------------------------------------------------------------------------

#### v2.0 methodology (#001):

  * assuming that a `document` element can be passed from a `frame` script to a `chrome` script, `onPageLoad` doesn't need to be modified.

  * refactoring should be limited to migrating the DOM event listeners to a new `frame` script, which passes its `document` element back to `onPageLoad`.

#### result:

  * `frame-script.js`
    > `Sending message that cannot be cloned. Are you trying to send an XPCOM object?`

#### conclusion:

  * apparently, the assumption was wrong; a `document` element cannot be passed.

---------------------------------------------------------------------------------------------------

#### v2.0 methodology (#002):

  * RTFM (some more):
    * https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/Cross_Process_Object_Wrappers
    * https://developer.mozilla.org/en-US/Firefox/Multiprocess_Firefox/The_message_manager#Content_to_chrome

  * changed the function used to pass the `document` element; now the parameter should support complex objects that cannot be serialized into JSON

#### result:

  * it works!

#### conclusion:

  * is this cheating?

  * is there any performance penalty using this methodology.. whereby for every page that loads, its `document` element is passed into the `chrome` process for inspection and (conditionally) modification?

---------------------------------------------------------------------------------------------------
