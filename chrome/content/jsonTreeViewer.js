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
		})()
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
				$C({
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
						"text"		: ("" + value)
					},
					"text" : {
						"condition"	: (!is_last),
						"text"		: ","
					}
				},el,doc);
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

		Node_simple.call(this, name, '"' + value + '"', is_last);
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
		"parse" : function(data, container_element, _doc) {
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
				if (container_element)
					tree.set_el(container_element);

				tree.set_root(new Node(null, js_obj, 'last'));
			}
		},

		"expand" : tree.expand,

		"collapse" : tree.collapse
	};
})();
