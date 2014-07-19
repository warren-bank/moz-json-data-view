// http://www.openjs.com/scripts/createdom/
//		$C() - Create DOM Structures Easily

var $C = function(dom,id,doc) {
	if(!doc) var doc = document;
	//Most *necessary* HTML tags - make sure not to include any tags that is also a valid attribute name - eg 'cite'
	//Begining and ending commas are intentional - don't remove them
	var valid_tags = ",b,p,div,span,strong,em,u,img,pre,code,br,hr,a,script,link,table,tr,td,h1,h2,h3,h4,h5,h6,sup,sub,ul,ol,li,dd,dl,dt,form,input,textarea,legend,label,fieldset,select,option,blockquote,";
	var html = new Array();
	var non_alapha = new RegExp(/_\d*$/);
	for(var tag in dom) {
		var child = false;
		if(isNaN(tag)) { //Associative array
			var attributes = dom[tag];
		} else { //It's a list
			var tagname = "";
			var attributes = "";
			for(var tagname in dom[tag]) {
				attributes = dom[tag][tagname];
			}
			tag = tagname;
		}
		tag = tag.replace(non_alapha,"");//Remove the numbers at the end

		var ele;
		if (tag == "text"){
			if (typeof attributes === "string"){
				ele = doc.createTextNode(attributes);
			}
			else if (
					(typeof attributes === "object")
				&&	(attributes !== null)
				&&	(attributes.text)
				&&	(attributes.condition || (typeof attributes.condition === "undefined"))
			){
				ele = doc.createTextNode(attributes.text);
			}
			attributes = false;
		}
		else {
			ele = doc.createElement(tag);
		}

		//If the given attribute is a string, it is a text node
		if(typeof(attributes) == "string") child = doc.createTextNode(attributes);
		else if(attributes) {//If it an array...
			for(var att in attributes) {
				var value = "";
				if(isNaN(att)) { //Associative array
					value = attributes[att];
				} else { //It's a list
					for(var index in attributes[att]) {
						value = attributes[att][index];
					}
 					att = index;
				}

				att = att.replace(non_alapha,"");//Remove the numbers at the end - to solve the problem of non unique indexes
				if(att == "condition"){if (! value) {ele = undefined; break;}}
				else if(valid_tags.indexOf(","+att+",") != -1) { //If the attribute is a valid tag,
					//Find the dom sturcture of that tag.
					var node = new Object;
					node[att] = value;
					ele.appendChild($C(node,"",doc));// :RECURSION:
				}
				else if(att == "text") {
					//The text in the tag
					if (typeof value === "string"){
						child = doc.createTextNode(value);
					}
					else if (
							(typeof value === "object")
						&&	(value !== null)
						&&	(value.text)
						&&	(value.condition || (typeof value.condition === "undefined"))
					){
						child = doc.createTextNode(value.text);
					}
				}
				else ele.setAttribute(att,value);
			}
		}

		if(ele){
			if(child && attributes) ele.appendChild(child);//Append the child if it exists
			html.push(ele);
		}
	}

	//If a node/id was given, append the created elements to that element.
	if (id){
		var node = id;
		if(typeof id == "string") node = doc.getElementById(id);//If the given argument is an id.
		for(var i=0;el=html[i],i<html.length;i++) node.appendChild(el);
	}

	if(html.length == 1) return html[0];
	return html;
};