/*
 * JSON Tree Viewer
 * http://github.com/summerstyle/jsonTreeViewer
 *
 * Copyright 2014 Vera Lobacheva (summerstyle.ru)
 * Released under the GPL3 (GPL3.txt)
 *
 * Sun 27 2014 20:15:00 GMT+0400
 */

'use strict';

var jsonTreeViewer = (function() {
	var doc;

	var options = {};

	/* Utilities */
	var utils = {
	/* unused and unreachable */
	/*

		"id" : function (str) {
			return doc.getElementById(str);
		},
		"hide" : function(node) {
			node.style.display = 'none';

			return this;
		},
		"show" : function(node) {
			node.style.display = 'block';

			return this;
		},
		"add_node_from_html" : function(parent, html) {
			var div = doc.createElement('div');

			parent.appendChild(div);

			div.outerHTML = html;
		},

		//JSON data types
		"is_string" : function(x) {
			return typeof x === 'string';
		},
		"is_number" : function(x) {
			return typeof x === 'number';
		},
		"is_big_number" : function(x) {
			return (
					(typeof x === 'object') &&
					(x !== null) &&
					(typeof x.constructor === 'function') &&
					(typeof x.constructor.name === 'string') &&
					(x.constructor.name === 'BigNumber')
			);
		},
		"is_boolean" : function(x) {
			return typeof x === 'boolean';
		},
		"is_null" : function(x) {
			return x === null;
		},
		"is_array" : function(x) {
			return Object.prototype.toString.call(x) === "[object Array]";
		},
		"is_object" : function(x) {
			return Object.prototype.toString.call(x) === "[object Object]";
		},

	*/

		"get_type" : function(x) {
			if (x === null) {
				return 'null';
			};

			switch (typeof x) {
				case 'number':
					return 'number';

				case 'string':
					return 'string';

				case 'boolean':
					return 'boolean';

				case 'object':
					if (
						(typeof x.constructor === 'function') &&
						(typeof x.constructor.name === 'string') &&
						(x.constructor.name === 'BigNumber')
					){
						return 'big_number';
					}
					break;
			};

			switch(Object.prototype.toString.call(x)) {
				case '[object Array]':
					return 'array';

				case '[object Object]':
					return 'object';
			};

			throw new Error('Bad type');
		},

		"foreach" : function(obj, func) {
			var type = utils.get_type(obj),
				is_last = false,
				last;

			switch (type) {
				case 'array':
					last = obj.length - 1;

					for (var i = 0, c = obj.length; i < c; i++) {
						if (i === last) {
							is_last = true;
						}

						func(obj[i], i, is_last);
					}

					break;

				case 'object':
					var keys = Object.keys(obj);

					last = keys.length - 1;

					for (var i = 0, c = keys.length; i < c; i++) {
						if (i === last) {
							is_last = true;
						}

						func(obj[keys[i]], keys[i], is_last);
					}

					break;
			}
		},

		"inherits" : (function() {
			var F = function() {};

			return function(Child, Parent) {
				F.prototype = Parent.prototype;
				Child.prototype = new F();
				Child.prototype.constructor = Child;
			}
		})(),

		"set_options" : function(user_options){
			var new_options, key;

			new_options = {
				"replace_newline"			: false,	// true
				"replace_tab"				: false,	// true, or custom replacement string. no HTML is allowed. ex: '\u00A0\u00A0\u00A0\u00A0'
				"replace_url"				: true,		// true

				"escape_back_slash"			: true,
				"escape_forward_slash"		: false,
				"escape_double_quote"		: true,
				"escape_carriage_return"	: true,
				"escape_line_feed"			: true,
				"escape_tab"				: true,
				"escape_form_feed"			: true,
				"escape_backspace"			: true,
				"escape_unicode_characters"	: false
			};

			if (
				(typeof user_options === 'object') &&
				(user_options !== null)
			){
				for (key in user_options){
					// only replace the value of keys that already exist in the default set of options
					if (typeof new_options[key] !== 'undefined'){
						new_options[key] = user_options[key];
					}
				}
			}

			// variable belongs to parent closure
			options = new_options;
		},

		"get_option" : function(name){
			return (
				(typeof options[name] === 'undefined')? null : options[name]
			);
		}

	};

	/* Node's factory */
	function Node(name, node, is_last) {
		var type = utils.get_type(node);

		switch (type) {
			case 'boolean':
				return new Node_boolean(name, node, is_last);

			case 'number':
				return new Node_number(name, node, is_last);

			case 'big_number':
				return new Node_number(name, node.toString(), is_last);

			case 'string':
				return new Node_string(name, node, is_last);

			case 'null':
				return new Node_null(name, node, is_last);

			case 'object':
				return new Node_object(name, node, is_last);

			case 'array':
				return new Node_array(name, node, is_last);

			default:
				throw new Error('Bad type');
		}
	}

	/* Simple type's constructor (string, number, boolean, null) */
	function Node_simple(name, value, is_last) {
		var self     = this,
			el       = doc.createElement('li'),
			template = function(el, name, value) {
				var dom_struct = {
					"span_1" : {
						"class"		: "name_wrapper",
						"span"		: {
							"class"	: "name",
							"text"	: ("" + name)
						},
						"text"		: " : "
					},
					"span_2" : {
						"class"		: "value",
						"span"		: {}
					},
					"text" : {
						"condition"	: (!is_last),
						"text"		: ","
					}
				};

				if (
					(typeof value === 'object') &&
					(value !== null)
				){
					dom_struct["span_2"]["span"] = value;
				}
				else {
					dom_struct["span_2"]["span"] = {
						"text"		: ("" + value)
					};
				}

				$C(dom_struct,el,doc);
			};

		el.classList.add('node');
		el.classList.add(this.type);
		template(el, name, value);

		self.el = el;
	}

	/* Boolean */
	function Node_boolean(name, value, is_last) {
		this.type = "boolean";

		Node_simple.call(this, name, value, is_last);
	}

	/* Number */
	function Node_number(name, value, is_last) {
		this.type = "number";

		Node_simple.call(this, name, value, is_last);
	}

	/* String */
	function Node_string(name, value, is_last) {
		this.type = "string";

		// perform simple text substitution
		value = (function(v){
			if (utils.get_option('escape_back_slash')){
				v = v.replace(/(\\)/gm, '\\$1');
			}
			if (utils.get_option('escape_forward_slash')){
				v = v.replace(/(\/)/gm, '\\$1');
			}
			if (utils.get_option('escape_double_quote')){
				v = v.replace(/(")/gm, '\\$1');
			}
			if (! utils.get_option('replace_newline')){
				if (utils.get_option('escape_carriage_return')){
					v = v.replace(/\r/gm, '\\r');
				}
				if (utils.get_option('escape_line_feed')){
					v = v.replace(/\n/gm, '\\n');
				}
			}
			if (! utils.get_option('replace_tab')){
				if (utils.get_option('escape_tab')){
					v = v.replace(/\t/gm, '\\t');
				}
			}
			else {
				v = v.replace(/\t/gm, ((typeof utils.get_option('replace_tab') === 'string')? utils.get_option('replace_tab') : '\u00A0\u00A0\u00A0\u00A0'));
			}
			if (utils.get_option('escape_form_feed')){
				v = v.replace(/\x08/gm, '\\f');
			}
			if (utils.get_option('escape_backspace')){
				v = v.replace(/\x0c/gm, '\\b');
			}
			if (utils.get_option('escape_unicode_characters')){
				(function(){
					var search_pattern, pad, callback;

					search_pattern = /[\u007f-\uffff]/gm;
					pad = function(num, size){
						return (
							(num.length < size)? pad("0" + num, size) : num
						);
					};
					callback = function(chr){
						var num;
						num = chr.charCodeAt(0).toString(16).toUpperCase();
						num = pad(num, 4);
						return ('\\u' + num);
					};

					v = v.replace(search_pattern, callback);
				})();
			}

			v = '"' + v + '"';
			return v;
		})(value);

		// perform replacements that will require updates to the DOM, rather than simple text substitution
		value = (function(v){
			var dom_struct, dom_keys_counter, get_next_dom_key, search_patterns, chomp_next_pattern, process_match, reposition_trailing_comma;

			dom_struct = {};
			dom_keys_counter = {};

			get_next_dom_key = function(key){
				var old_counter, new_counter, new_key;

				old_counter = (typeof dom_keys_counter[key] === 'number')? dom_keys_counter[key] : 0;
				new_counter = old_counter + 1;

				dom_keys_counter[key] = new_counter;
				new_key = key + '_' + new_counter;

				return new_key;
			};

			search_patterns = {};
			if (utils.get_option('replace_newline')){
				search_patterns['replace_newline'] = /(\r?\n)/gm;
			}
			if (utils.get_option('replace_url')){
				/* **********************************
				 * basis for regex pattern to identify URLs:
				 *   - https://mathiasbynens.be/demo/url-regex
				 *   - https://gist.github.com/729294
				 * **********************************
				 */
				search_patterns['replace_url'] = /\b(?:(?:(?:https?|ftp):\/\/)|(?:(?:mailto):))(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff]+-?)*[a-z0-9\u00a1-\uffff]+)(?:\.(?:[a-z0-9\u00a1-\uffff]+-?)*[a-z0-9\u00a1-\uffff]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s"]*)?/igm;
			}

			chomp_next_pattern = function(){
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Example.3A_Finding_successive_matches
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex

				var matches, first_start_index, first_key, key, match;
				var dom_key, txt_node;

				matches = {};
				first_start_index = -1;
				first_key = null;

				for (key in search_patterns){
					match = (search_patterns[key]).exec(v);

					if (match !== null){
						matches[key]                = {};
						matches[key]["value"]       = match[0];
						matches[key]["length"]      = match[0].length;
						matches[key]["last_index"]  = (search_patterns[key]).lastIndex;
						matches[key]["start_index"] = (matches[key]["last_index"] - matches[key]["length"]);

						if (
							(first_start_index === -1) ||
							(first_start_index > matches[key]["start_index"])
						){
							first_start_index = matches[key]["start_index"];
							first_key = key;
						}
					}

					// reset `lastIndex`, since the length of the string is being reduced from the front
					(search_patterns[key]).lastIndex = 0;
				}

				if (first_start_index === -1){
					dom_key                 = get_next_dom_key('text');
					txt_node                = v;
					dom_struct[dom_key]     = txt_node;
					v                       = '';
				}
				else {
					if (first_start_index > 0){
						dom_key             = get_next_dom_key('text');
						txt_node            = v.substring(0, first_start_index);
						dom_struct[dom_key] = txt_node;
					}
					process_match(first_key, matches[first_key]["value"]);
					if (
						(matches[first_key]["last_index"] < matches[first_key]["start_index"]) ||
						(
							(matches[first_key]["last_index"] === matches[first_key]["start_index"]) &&
							(matches[first_key]["length"] > 0)
						) ||
						(matches[first_key]["last_index"] >= v.length)
					){
						v                   = '';
					}
					else {
						v                   = v.substring(matches[first_key]["last_index"]);
					}
				}

				if (v){
					chomp_next_pattern();
				}
			};

			process_match = function(key, value){
				var dom_key, dom_node;

				switch(key){
					case 'replace_newline':
						dom_key  = get_next_dom_key('br');
						dom_node = false;
						break;
					case 'replace_url':
						if (utils.get_option('escape_forward_slash')){
							value = value.replace(/\\(\/)/gm, '$1');
						}
						dom_key  = get_next_dom_key('a');
						dom_node = {
							"href"   : value,
							"target" : "_blank",
							"text"   : value
						};
						break;
				}

				if (dom_key){
					dom_struct[dom_key] = dom_node;
				}
			};

			reposition_trailing_comma = function(){
				var dom_key, dom_node;

				if (! is_last){
					dom_key  = get_next_dom_key('span');
					dom_node = {
						"class" : "hljs",
						"text"  : ","
					};
					dom_struct[dom_key] = dom_node;
					is_last = true;
				}
			};

			chomp_next_pattern();
			reposition_trailing_comma();

			return dom_struct;
		})(value);

		Node_simple.call(this, name, value, is_last);
	}

	/* Null */
	function Node_null(name, value, is_last) {
		this.type = "null";

		Node_simple.call(this, name, value, is_last);
	}

	/* Complex node's constructor (object, array) */
	function Node_complex(name, value, is_last) {
		var self     = this,
			el       = doc.createElement('li'),
			template = function(el, name, sym) {
				$C({
					"span" : {
						"condition"		: (name !== null),
						"class"			: "name_wrapper",
						"span"			: {
							"class"		: "name",
							"span"		: {
								"class"	: "expand_button"
							},
							"text"		: ("" + name)
						},
						"text"			: " : "
					},
					"div" : {
						"class"			: "value",
						"b_1"			: sym[0],
						"ul"			: {
							"class"		: "children"
						},
						"b_2"			: sym[1],
						"text"			: {
							"condition"	: (!is_last),
							"text"		: ","
						}
					}
				},el,doc);
			},
			children_ul,
			name_el,
			children = [];

		el.classList.add('node');
		el.classList.add(this.type);
		template(el, name, self.sym);

		children_ul = el.querySelector('.children');

		if (name !== null) {
			name_el = el.querySelector('.name');
			name_el.addEventListener('click', function(event) {
				var is_recursive = event.ctrlKey || event.shiftKey;
				self.toggle(is_recursive);
			}, false);
			self.is_root = false;
		} else {
			self.is_root = true;
			el.classList.add('expanded');
		}

		self.el = el;
		self.children = children;
		self.children_ul = children_ul;

		utils.foreach(value, function(node, name, is_last) {
			var child = new Node(name, node, is_last);
			self.add_child(child);
		});

		self.is_empty = !Boolean(children.length);
		if (self.is_empty) {
			el.classList.add('empty');
		}
	}

	Node_complex.prototype = {
		"constructor" : Node_complex,

		"add_child" : function(child) {
			this.children.push(child);
			this.children_ul.appendChild(child.el);
		},

		"expand" : function(is_recursive){
			var children = this.children;

			if (!this.is_root) {
				this.el.classList.add('expanded');
			}

			if (is_recursive) {
				utils.foreach(children, function(item, i) {
					if (typeof item.expand === 'function') {
						item.expand(is_recursive);
					}
				});
			}
		},

		"collapse" : function(is_recursive) {
			var children = this.children;

			if (!this.is_root) {
				this.el.classList.remove('expanded');
			}

			if (is_recursive) {
				utils.foreach(children, function(item, i) {
					if (typeof item.collapse === 'function') {
						item.collapse(is_recursive);
					}
				});
			}
		},

		"toggle" : function(is_recursive) {
			if (is_recursive){
				if (this.el.classList.contains('expanded')){
					this.collapse(is_recursive);
				}
				else {
					this.expand(is_recursive);
				}
			}
			else {
				this.el.classList.toggle('expanded');
			}
		}
	};

	/* Object */
	function Node_object(name, value, is_last) {
		this.sym = ['{', '}'];
		this.type = "object";

		Node_complex.call(this, name, value, is_last);
	}
	utils.inherits(Node_object, Node_complex);

	/* Array */
	function Node_array(name, value, is_last) {
		this.sym = ['[', ']'];
		this.type = "array";

		Node_complex.call(this, name, value, is_last);
	}
	utils.inherits(Node_array, Node_complex);


	/* Tree */
	var tree = (function() {
		var el, root = null;

		return {
			"set_el" : function(element){
				if (! (element instanceof Element)){return;}

				while (element.firstChild) {
					element.removeChild(element.firstChild);
				}

				if (element instanceof 	HTMLUListElement){
					el = element;
				}
				else {
					el = $C({"ul":{"id" : "tree"}},element,doc);
				}

				/* ------------------------------
				 * note:
				 * =====
				 * I'm not sure what the reason was behind doing this,
				 * but I do know that it interferes with using the up/down keys to scroll through large data sets.
				 * ------------------------------
				 */
			//	el.addEventListener('mousedown', function(e) {
			//		e.preventDefault();
			//	}, false);
			},

			"set_root" : function(child) {
				root = child;

				if (! el)
					tree.set_el(doc.body);

				el.appendChild(child.el);
			},

			"expand" : function() {
				if (root) {
					root.expand('recursive');
				}
			},

			"collapse" : function(){
				if (root) {
					root.collapse('recursive');
				}
			}
		};
	})();

	return {
		"parse" : function(data, container_element, _doc, user_options) {
			doc = _doc || document;

			var js_obj;

			if (
					(typeof data === 'object')
				&&	(data !== null)
				&&	(data instanceof HTMLElement)
				&&	(data.ownerDocument instanceof HTMLDocument)
			){
				if (! container_element){
					container_element = data;
				}

				data		= data.textContent;
			}

			if (typeof data === 'string'){
				try {
					js_obj	= JSON.parse(data);
				}
				catch(e){
					js_obj	= {"error": e.message, "JSON data": data};
				}
			}

			if (
					(typeof data === 'object')
				&&	(data !== null)
			){
				js_obj		= data;
			}

			if (js_obj){
				if (container_element){
					tree.set_el(container_element);
				}

				utils.set_options(user_options);
				tree.set_root(new Node(null, js_obj, 'last'));
			}
		},

		"expand" : tree.expand,

		"collapse" : tree.collapse
	};
})();
