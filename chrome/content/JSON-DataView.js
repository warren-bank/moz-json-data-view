window.addEventListener('load', function load(event) {
	window.removeEventListener('load', load, false);
	JSON_DataView.init();
}, false);

if (!JSON_DataView) {
	var JSON_DataView = {

		prefs: null,
		load_prefs: function(){
			this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
							.getService(Components.interfaces.nsIPrefService)
							.getBranch("extensions.JSON_DataView.");
		},

		init: function() {
			var appcontent = document.getElementById('appcontent');
			if (appcontent){
				this.load_prefs();
				appcontent.addEventListener('DOMContentLoaded', this.onPageLoad, true);
			}
		},

		onPageLoad: function(aEvent) {
			var self				= JSON_DataView;
			var document			= aEvent.originalTarget;
			var is_json				= false;
			var is_jsonp			= false;
			var head, body, json_text;

			if (document.location.protocol.toLowerCase() === "view-source:"){return;}

			/** ---------------------------------
			  * note:
			  * =====
			  * testing in the wild has proven that all content-types should be inspected for jsonp responses.
			  * though a server should return 'javascript' for jsonp, in reality they are commonly called 'json'.
			  * the efficiency gained by treating 'json' types as VIP.. cutting to the front of the line,
			  * isn't worth the risk of misreading the data.
			  *
			  * to put this in real terms, the facebook graph api behaves this way:
			  *    http://graph.facebook.com/coca-cola?callback=whatever
			  * ---------------------------------
			  */
			switch( document.contentType.toLowerCase() ){
				case 'application/json':
				case 'text/json':
				case 'text/x-json':
			//		is_json			= true;
			//		break;
				case 'text/plain':
				case 'text/javascript':
				case 'application/javascript':
				case 'application/x-javascript':
					is_json			= 0;
					break;
			}

			if (is_json === false){return;}

			if (is_json !== true){
				// the location pathname ends with '.json'
				(function(){
					var pattern		= /\.json?$/;
					var ok			= (pattern.test( document.location.pathname.toLowerCase() ));
					if (ok)
						is_json 	= true;
				})();
			}

			if (is_json !== true){
				// the location querystring contains 'callback=', and the response is structured as a JSONP callback function
				(function(){
					var pattern		= /^.*[\?&]callback=([^\?&]+)(?:&.*)?$/i;
					var ok			= (pattern.test( document.location.search ));
					if (ok){
						is_json 	= true;
						is_jsonp	= decodeURIComponent( document.location.search.replace(pattern, '$1') );
					}
				})();
			}

			if (is_json !== true){
				// the location querystring contains 'JSON-DataView=json'
				(function(){
					var pattern		= /(^|[\?&])JSON-DataView=json([&]|$)/i;
					var ok			= (pattern.test( document.location.search ));
					if (ok)
						is_json 	= true;
				})();
			}

			if (is_json !== true){return;}

			head					= document.head;
			body					= document.body;
			json_text				= body.textContent;

			if (is_jsonp){
				// confirm that the response is structured as a JSONP callback function
				(function(){
					var clean_text	= function(){
						// 2 reasons:
						//   - need to pattern match on the entire response. some regex implementations have problems with the multi-line flag. I find that it's always simpler to just remove CR-LF.
						//   - it's become pretty standard practice for jsonp responses to contain javascript comments.
						//     the comments serve as a form of protection against an attack where a third party site bypasses the content-type of the response by doing: <object type="application/x-shockwave-flash" data="http://hostname/pathname?callback=[specifically crafted flash bytes]"></object>
						var result	= json_text;
						result		= result.replace(/^\s*\/\/.*$/gm,'');	// one-line comments
						result		= result.replace(/[\r\n]+/g,' ');		// CR-LF
						result		= result.replace(/\s+/g,' ');			// compact whitespace
						result		= result.replace(/^\s+/,'');			// trim left
						result		= result.replace(/\s+$/,'');			// trim right
						result		= result.replace(/^\/\*.*?\*\/\s*/,'');	// trim left comment block
						result		= result.replace(/\s*\/\*.*?\*\/$/,'');	// trim right comment block
						return result;
					};

					var one_line	= clean_text();
					var pattern		= new RegExp('^' + is_jsonp + '\\s*\\(' + '\\s*(.*)\\s*' + '\\)[;]?$');
					var ok			= (pattern.test( one_line ));
					if (ok){
						json_text 	= one_line.replace(pattern, '$1');
					}
					else {
						is_json		= false;
					}
				})();
				if (is_json !== true){return;}
			}

			(function(){
				var fname;
				fname				= document.location.pathname.toLowerCase().replace(/^.*\/([^\/]*?)(?:\.json)?$/,'$1');
				if (! fname){
					fname			= (is_jsonp)? (is_jsonp + '.jsonp') : 'JSON-DataView.json';
				}
				else {
					fname			= fname + '.json';
				}
				document.title		= fname;
			})();

			(function(){
				var $code;

				// prefs: syntax_highlighter
				var highlight = {};
				highlight.theme		= self.prefs.getCharPref("syntax_highlighter.theme");
				highlight.enabled	= self.prefs.getBoolPref("syntax_highlighter.enabled");
				highlight.enabled	= (highlight.enabled && highlight.theme);

				// add css files to head
				$C({
					"link_01": {
						"rel"		: "stylesheet",
						"type"		: "text/css",
						"href"		: ("resource://jdvskin/JSON-DataView.css")
					},
					"link_02": {
						"rel"		: "stylesheet",
						"type"		: "text/css",
						"href"		: "resource://jdvskin/highlight_styles_disabled.css",
						"condition"	: (! highlight.enabled)
					},
					"link_03": {
						"rel"		: "stylesheet",
						"type"		: "text/css",
						"href"		: "resource://jdvskin/jsonTreeViewer.css",
						"condition"	: (highlight.enabled)
					},
					"link_04": {
						"rel"		: "stylesheet",
						"type"		: "text/css",
						"href"		: ("resource://jdvskin/highlight_styles/" + highlight.theme.toLowerCase() + ".css"),
						"condition"	: (highlight.enabled)
					}
				}, head, document);

				// empty the body
				while (body.firstChild) {
					body.removeChild(body.firstChild);
				}

				if (highlight.enabled){
					//<ul id="tree"></ul>
					$code	= $C({"ul": {
									"id"			: "tree"
							}}, body, document);

					// populate $code "element" with a "root" tree node
					jsonTreeViewer.parse(json_text, $code, document);

					// the generated DOM tree contains css classes that were colorized by jsonTreeViewer.css
					// this color scheme is disabled, in preference for using highlight.js
					// in order to use the (unmodified) hightlight.js color schemes,
					// the css classes used by highlight.js will need to be applied to the DOM tree.
					(function(){
						var highlight_jsonTreeViewer = function(jsonTreeViewer_tree_el){

							// https://developer.mozilla.org/en-US/docs/Web/API/Element.querySelector
							// https://developer.mozilla.org/en-US/docs/DOM/Element.querySelectorAll
							// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/QuerySelector
							var $ = function(selector, el) {
								if (!el) {el = document;}
								return Array.prototype.slice.call(el.querySelectorAll(selector));
							};

							var addClass = function(selector, el, class_name){
								var $matches = ( selector ? $(selector, el) : (el ? [el] : []) );
								for (var i=0; i<$matches.length; i++){
									($matches[i]).classList.add(class_name);
								}
							};

							// "#tree" => ".hljs"
							addClass(
								false,
								jsonTreeViewer_tree_el,
								"hljs"
							);

							// ".expand_button" => ".hljs"
							addClass(
								".expand_button",
								jsonTreeViewer_tree_el,
								"hljs"
							);

							// ".null > .value" => ".hljs-literal"
							addClass(
								".null > .value",
								jsonTreeViewer_tree_el,
								"hljs-literal"
							);

							// ".number > .value" => ".hljs-number"
							addClass(
								".number > .value",
								jsonTreeViewer_tree_el,
								"hljs-number"
							);

							// ".string > .value" => ".hljs-string"
							addClass(
								".string > .value",
								jsonTreeViewer_tree_el,
								"hljs-string"
							);

							// ".boolean > .value" => ".hljs-literal"
							addClass(
								".boolean > .value",
								jsonTreeViewer_tree_el,
								"hljs-literal"
							);

							// ".name" => ".hljs-attribute"
							addClass(
								".name",
								jsonTreeViewer_tree_el,
								"hljs-attribute"
							);
						};

						highlight_jsonTreeViewer($code);
					})();

				}
				else {
					// pretty-print the json data
					json_text		= js_beautify(json_text, {
						"indent_size"	: 1,
						"indent_char"	: "\t"
					});

					//<pre>json_text</pre>
					$code	= $C({"pre": {
									"text"			: json_text
							}}, body, document);
				}

			})();

		}
	};
}
