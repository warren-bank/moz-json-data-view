/*
 * --------------------------------------------------------
 * original script
 *     name:    CreateDOM - $C()
 *     summary: Create DOM Stuctures Easily
 *     url:     http://www.openjs.com/scripts/createdom/
 * author
 *     name:    Binny V Abraham
 *     email:   binnyva@gmail.com
 *     url:     http://binnyva.com/me/
 * license
 *     name:    BSD License
 *     url:     http://www.openjs.com/license.php
 * --------------------------------------------------------
 * modified script
 *     name:    CreateDOM - $C()
 *     summary: Create DOM Stuctures Easily
 *     url:     https://github.com/warren-bank/CreateDOM
 *     notes:   forked from original script on 07/16/2014
 * author
 *     name:    Warren R Bank
 *     email:   warren.r.bank@gmail.com
 *     url:     https://github.com/warren-bank
 * license
 *     name:    GPLv2
 *     url:     http://www.gnu.org/licenses/gpl-2.0.txt
 *     notes:   applies to diff between modified script and original.
 *              This is more restrictive than BSD, and requires that
 *              any and all derivative works also maintain a GPL (copy-left) license.
 * --------------------------------------------------------
 */

var $C = function(dom, id, _doc) {
	var doc, valid_tags, html, non_alapha, get_textnode, tag, child, attributes, tagname, ele, att, value, index, node;

	doc							= _doc || document;

	// csv list. first and last character must also be: ','
	// note: any tag name that's more commonly used as an attribute name should be removed. ex: ['cite','style','title']

	// http://www.w3.org/TR/html4/index/elements.html
	/*
		(function($){
			var valid_tags = [];
			$('td[title="Name"] > a').each(function(){
				var tag = $.trim( $(this).text().toLowerCase() );
				valid_tags.push(tag);
			});
			valid_tags = ',' + valid_tags.join(',') + ',';
			console.log(valid_tags);
		})(jQuery);
	*/
	valid_tags					= ',a,abbr,acronym,address,applet,area,b,base,basefont,bdo,big,blockquote,body,br,button,caption,center,' + /* 'cite,' + */ 'code,col,colgroup,dd,del,dfn,dir,div,dl,dt,em,fieldset,font,form,frame,frameset,h1,h2,h3,h4,h5,h6,head,hr,html,i,iframe,img,input,ins,isindex,kbd,label,legend,li,link,map,menu,meta,noframes,noscript,object,ol,optgroup,option,p,param,pre,q,s,samp,script,select,small,span,strike,strong,' + /* 'style,' + */ 'sub,sup,table,tbody,td,textarea,tfoot,th,thead,' + /* 'title,' + */ 'tr,tt,u,ul,var,';

	html						= [];
	non_alapha					= /_\d*$/;
	get_textnode				= function(value){
		var ele;

		if (
				(typeof value === "object")
			&&	(value !== null)
			&&	(typeof value.condition !== "undefined")
		){
			// process: {"condition":bool,"text":string}
			if (
					(value.condition)
				&&	(typeof value.text !== "undefined")
			){
				ele				= get_textnode(value.text);
			}
		}
		else {
			// process text value. correct some common mistakes by casting non-string to string.
			switch (typeof value){
				case 'number':
				case 'boolean':
				case 'function':
					value = (value).toString();
				case 'string':
					ele = doc.createTextNode(value);
					break;
			}
		}
		return ele;
	};
	for(tag in dom) {
		child					= false;
		if(isNaN(tag)) { //Associative array
			attributes			= dom[tag];
		} else { //It's a list
			tagname				= "";
			attributes			= "";
			for(tagname in dom[tag]) {
				attributes		= dom[tag][tagname];
			}
			tag					= tagname;
		}
		tag						= tag.replace(non_alapha,"");		//Remove the numbers at the end

		if (tag == "text"){
			ele					= get_textnode(attributes);
			attributes			= false;
		}
		else {
			ele					= doc.createElement(tag);
		}

		//If the given attribute is a string, it is a text node
		if(typeof(attributes) == "string"){
			child				= doc.createTextNode(attributes);
		}
		else if(attributes) {//If it an array...
			for(att in attributes) {
				value			= "";
				if(isNaN(att)) { //Associative array
					value		= attributes[att];
				} else { //It's a list
					for(index in attributes[att]) {
						value	= attributes[att][index];
					}
 					att			= index;
				}

				att				= att.replace(non_alapha,"");		//Remove the numbers at the end - to solve the problem of non unique indexes
				if(att == "condition"){
					if (! value) {
						ele		= undefined;
						break;
					}
				}
				else if(valid_tags.indexOf(","+att+",") != -1) {	//If the attribute is a valid tag,
					//Find the dom sturcture of that tag.
					node		= {};
					node[att]	= value;
					ele.appendChild($C(node,"",doc));				//RECURSION
				}
				else if(att == "text") {
					child		= get_textnode(value);
				}
				else {
					ele.setAttribute(att,value);
				}
			}
		}

		if(ele){
			if(child && attributes) ele.appendChild(child);			//Append the child if it exists
			html.push(ele);
		}
	}

	//If a node/id was given, append the created elements to that element.
	if (id){
		node					= id;
		if(typeof id == "string"){
			node				= doc.getElementById(id);			//If the given argument is an id.
		}
		for(index=0; index<html.length; index++){
			ele					= html[index];
			node.appendChild(ele);
		}
	}

	if(html.length === 1) return html[0];							//If only one HTML element was created, then return that element. Otherwise, return the array of all HTML elements.
	return html;
};
