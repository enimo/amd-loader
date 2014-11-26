/*
define(function(exports) {
	AMD.emit('loaded', {url: 'def.e.js'});
	return {
	    helloe: function(x){
	       console.log("def.e return helloe, trigger from: " + x);
	    }
 	};

});
*/
//define use exports return like below:
define(['exports'], function(exports) {
	 	exports.helloe = function(x){ console.log("hello return via exports~~~, trigger from: "+x); };
});