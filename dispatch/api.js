//
(function(factory){
	factory();
}(function(){
"use strict";

function loadScript(src,callback) {
	var script = document.createElement('script');
	script.type = "text/javascript";
	script.charset = "utf-8";
	script.async = true;
	if (script.attachEvent) {
		script.attachEvent("onreadystatechange", callback);
	} else if (script.addEventListener) {
		script.addEventListener("load", callback, false);
	}
	//
	script.src = src;
	//
	document.head.appendChild(script);
}



}));