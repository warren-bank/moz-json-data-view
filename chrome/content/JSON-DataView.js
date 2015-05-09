/*
 * --------------------------------------------------------
 * script
 *     name:    JSON-DataView
 *     summary: Firefox add-on that displays JSON data in a collapsible tree structure with syntax highlights.
 *     url:     https://github.com/warren-bank/moz-json-data-view
 * author
 *     name:    Warren R Bank
 *     email:   warren.r.bank@gmail.com
 *     url:     https://github.com/warren-bank
 * copyright
 *     notice:  Copyright (c) 2014, Warren Bank
 * contributors
 *            - JSON Tree Viewer
 *              http://github.com/summerstyle/jsonTreeViewer
 *              Copyright (c) 2014, Vera Lobacheva (summerstyle.ru)
 * license
 *     name:    GPLv3
 *     url:     http://www.gnu.org/licenses/gpl-3.0.txt
 * --------------------------------------------------------
 */

if (!JSON_DataView) {
	var JSON_DataView = {
		prefs: (
					Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService)
						.getBranch("extensions.JSON_DataView.")
		),
		onPageLoad: function(message) {
			var self				= JSON_DataView;
			var document			= message.data;
			var is_json				= false;
			var is_jsonp			= false;
			var head, body, json_text, parsed_json_data, $parser_syntax_error;
			var highlight, optional_features;

			// short-circuit when: request to view page source
			// (takes priority over invoker token in hash)
			if (
					(is_json !== true)
				&&	(document.location.protocol.toLowerCase() === "view-source:")
			){return;}

			// short-circuit when: detect stop token in hash
			// (takes priority over invoker token in hash)
			if (
					(is_json !== true)
				&&	( /(?:^[#]?|[\/,])No-JSON-DataView(?:[\/,]|$)/i.test(document.location.hash) )
			){return;}

			// detect invoker token in hash
			if (
					(is_json !== true)
				&&	( /(?:^[#]?|[\/,])JSON-DataView(?:[\/,]|$)/i.test(document.location.hash) )
			){is_json = true;}

			if (is_json !== true){
				switch( document.contentType.toLowerCase() ){
					case 'application/json':
					case 'text/json':
					case 'text/x-json':
						// can't set it to TRUE yet; need to test that it's not actually a JSONP response.
						is_json			= 1;
						break;
					case 'text/plain':
					case 'text/javascript':
					case 'application/javascript':
					case 'application/x-javascript':
						is_json			= 0;
						break;
				}
			}

			if (is_json === false){return;}

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

			// content-type is 'json', querystring doesn't indicate JSONP
			if (is_json === 1){is_json = true;}

			if (
					(is_json !== true)
				&&	( /\.json$/.test(document.location.pathname.toLowerCase()) )
			){is_json = true;}

			if (is_json !== true){return;}

			head					= document.head;
			body					= document.body;
			json_text				= body.textContent;

			// sanity check
			if (! json_text){return;}

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

						var ltrim_pattern = function(str){
							var pattern	= new RegExp('^' + str);
							if (pattern.test( result )){
								result	= result.replace(pattern, '');
							}
						};

						// add support for ExpressJS jsonp callback response format(s)
						//   - legacy
						//        cb && cb(json)
						//   - commit #e218377, Oct/15/2013
						//        typeof cb === 'function' && cb(json);
						//   - commit #f684a64, Jul/10/2014
						//        /**/ typeof cb === 'function' && cb(json);
						ltrim_pattern('typeof\\s+' + is_jsonp + '\\s+===\\s+([\'"])function\\1\\s+&&\\s+');
						ltrim_pattern(is_jsonp + '\\s+&&\\s+');

						// add support for additional forms of jsonp callback validation:
						//   (typeof cb === 'function') && cb(json);
						//   (typeof cb==='function') && cb(json);
						//   (typeof cb==='function')&&cb(json);
						ltrim_pattern('\\(\\s*typeof\\s+' + is_jsonp + '\\s*===\\s*([\'"])function\\1\\s*\\)\\s*&&\\s*');

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

			highlight				= {
				"enabled"				: self.prefs.getBoolPref("syntax_highlighter.enabled"),
				"theme"					: self.prefs.getCharPref("syntax_highlighter.theme")
			};
			highlight.enabled		= (highlight.enabled && highlight.theme);

			optional_features		= {
				"BigNumber"				: self.prefs.getBoolPref("optional_features.BigNumber"),
				"debug_parser_errors"	: self.prefs.getBoolPref("optional_features.debug_parser_errors")
			};

			if (highlight.enabled){
				(function(){
					// parse the string of JSON into a javascript data object
					//  * native parser:
					//        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
					//        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError
					//  * alternative parser:
					//        https://github.com/sidorares/json-bigint
					//        https://github.com/MikeMcl/bignumber.js
					//    fix to issue #4: "maximum integer (double-precision 64-bit) value that can be parsed from string format (ie: JSON)"
					//        https://github.com/warren-bank/moz-json-data-view/issues/4
					try {
						parsed_json_data			= (optional_features.BigNumber)? json_bigint.parse(json_text) : JSON.parse(json_text);

						// sanity check
						if (! parsed_json_data){
							is_json					= false;
						}
					}
					catch(e){
						//  * native parser:
						//        `e.name`			: 'SyntaxError'
						//        `e.message`		: A description of what went wrong
						//        `e.lineNumber`	: Line number of the code that raised this error
						//        `e.columnNumber`	: Column number in line that raised this error
						//  * json-bigint:
						//        `e.name`			: 'SyntaxError'
						//        `e.message`		: A description of what went wrong
						//        `e.text`			: The original string of JSON
						//        `e.at`			: The index of the current character
						//					ex: =>		var ch = e.text.charAt(e.at)

						if (optional_features.debug_parser_errors){
							$parser_syntax_error	= (function(){
								var pre, post, $error;

								if (optional_features.BigNumber){
									// sanity check
									if (typeof e.at === 'number'){
										pre			= e.text.substring(0, e.at);
										post		= e.text.substring(e.at);
									}
								}

								else {
									// thrown by the native JSON parser

									(function(){
										var process_multi_line_input;

										process_multi_line_input = function(columnNumber, lineNumber){
											// sanity check
											if (typeof columnNumber !== 'number'){return;}
											if (columnNumber < 0){columnNumber = 0;}

											if (typeof lineNumber === 'number'){
												if (lineNumber <= 0){lineNumber = undefined;}
											}

											if (typeof lineNumber === 'number'){
												(function(){
													var lines, tmp, i;
													lines	= json_text.split(/\r?\n/);

													// sanity check
													if (lines.length < lineNumber){return;}

													tmp		= {
														"pre" 	: [],
														"post"	: []
													};

													for (i=0; i<lines.length; i++){
														if (i < lineNumber){
															tmp.pre.push( lines[i] );
														}
														else if (i > lineNumber){
															tmp.post.push( lines[i] );
														}
														else {
															tmp.pre.push( lines[i].substring(0, columnNumber) );
															tmp.post.push( lines[i].substring(columnNumber) );
														}
													}

													pre		= tmp.pre.join('\n');
													post	= tmp.post.join('\n');
												})();
											}
											else {
												pre			= json_text.substring(0, columnNumber);
												post		= json_text.substring(columnNumber);
											}
										};

										// --------------------------------------------------------------------
										// problem using native JSON parser:
										//   * the values reported by e.lineNumber and e.columnNumber don't correspond to a position within the text being parsed.
										//     rather, they refer to the position within the javascript file from which `JSON.parse` was called.
										//     which is completely useless.
										// references:
										//   * https://bugzilla.mozilla.org/show_bug.cgi?id=507998
										//   * http://dxr.mozilla.org/mozilla-central/source/js/src/js.msg
										//         line 103:
										//             MSG_DEF(JSMSG_JSON_BAD_PARSE, 3, JSEXN_SYNTAXERR, "JSON.parse: {0} at line {1} column {2} of the JSON data")
										// --------------------------------------------------------------------
										// process_multi_line_input(e.columnNumber, e.lineNumber);

										(function(){
											var pattern, matches, line_num, col_num;

											if (typeof e.message === 'string'){
												pattern		= /at line (\d+) column (\d+) of the JSON data/i;
												matches		= pattern.exec(e.message);

												if (matches !== null){
													line_num	= parseInt(matches[1], 10);
													col_num		= parseInt(matches[2], 10);

													if (
														(! isNaN(line_num)) &&
														(! isNaN(col_num))
													){
														// adjustment. numbers in error message are 1-based. indices are 0-based.
														line_num--;
														col_num--;

														process_multi_line_input(col_num, line_num);
													}
												}
											}
										})();

									})();
								}

								if (pre || post){
									$error	= $C({
										"pre_1": {
											"text"			: pre
										},
										"div": {
											"class"			: "parser_error",
											"text"			: e.message
										},
										"pre_2": {
											"text"			: post
										}
									}, false, document);
								}
								else {
									$error	= false;
								}
								return $error;
							})();

							if ($parser_syntax_error){
								highlight.enabled	= false;
								json_text			= false;
							}
							else {
								is_json				= false;
							}
						}
						else {
							is_json					= false;
						}
					}
				})();
				if (is_json !== true){return;}
			}

			(function(){
				var fname;
				fname				= ( decodeURI(document.location.pathname) ).toLowerCase().replace(/^.*\/([^\/]*?)(?:\.json)?$/,'$1');
				if (! fname){
					fname			= (is_jsonp)? (is_jsonp + '.jsonp') : 'JSON-DataView.json';
				}
				else {
					fname			= fname + '.json' + ((is_jsonp)? 'p' : '');
				}
				document.title		= fname;
			})();

			(function(){
				var $code, user_options;

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
					},
					"style_01": {
						"rel"		: "stylesheet",
						"type"		: "text/css",
						"condition"	: (highlight.enabled),
						"text"		: (
										(function(){
											var css="", pref;
											if (! highlight.enabled){return css;}

											css += "ul#tree {";
											// ====================================================
											pref = self.prefs.getCharPref("css.tree.font_family");
											if (pref){
												css += "font-family:" +pref+ ";";
											}

											pref = self.prefs.getIntPref("css.tree.font_size");
											css += "font-size:" +pref+ "px;";

											pref = self.prefs.getIntPref("css.tree.line_height");
											css += "line-height:" +pref+ "em;";

											pref = self.prefs.getIntPref("css.tree.padding");
											css += "padding:" +pref+ "em;";
											// ====================================================
											css += "}";

											css += "ul#tree ul {";
											// ====================================================
											pref = self.prefs.getIntPref("css.subtree.white_space_indentation");
											css += "margin-left:" +(pref + 1.5)+ "em;";
											// ====================================================
											css += "}";

											return css;
										})()
									  )
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

					user_options = {
						"replace_newline"			: self.prefs.getBoolPref("value_filters.string.replace.newline"),
						"replace_tab"				: self.prefs.getBoolPref("value_filters.string.replace.tab"),
						"replace_url"				: self.prefs.getBoolPref("value_filters.string.replace.url"),

						"escape_back_slash"			: self.prefs.getBoolPref("value_filters.string.escape.back_slash"),
						"escape_forward_slash"		: self.prefs.getBoolPref("value_filters.string.escape.forward_slash"),
						"escape_double_quote"		: self.prefs.getBoolPref("value_filters.string.escape.double_quote"),
						"escape_carriage_return"	: self.prefs.getBoolPref("value_filters.string.escape.carriage_return"),
						"escape_line_feed"			: self.prefs.getBoolPref("value_filters.string.escape.line_feed"),
						"escape_tab"				: self.prefs.getBoolPref("value_filters.string.escape.tab"),
						"escape_form_feed"			: self.prefs.getBoolPref("value_filters.string.escape.form_feed"),
						"escape_backspace"			: self.prefs.getBoolPref("value_filters.string.escape.backspace"),
						"escape_unicode_characters"	: self.prefs.getBoolPref("value_filters.string.escape.unicode_characters")
					};

					// populate $code "element" with a "root" tree node
					jsonTreeViewer.parse(parsed_json_data, $code, document, user_options);

					// expand all tree nodes? (collapsed by default)
					if ( self.prefs.getBoolPref("syntax_highlighter.expand_all_nodes") ){
						jsonTreeViewer.expand();
					}

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

							// "body" => ".hljs"
							addClass(
								false,
								body,
								"hljs"
							);

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
				else if (json_text) {
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
				else if ($parser_syntax_error) {
					$parser_syntax_error.forEach(function($el){
						body.appendChild($el);
					});
				}

			})();

		}
	};
}

if (!globalMM) {
	var globalMM = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
	globalMM.loadFrameScript("chrome://JSON-DataView/content/frame-script.js", true);
	globalMM.addMessageListener("JSON-DataView-onPageLoad", JSON_DataView.onPageLoad);
}
