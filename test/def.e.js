define(function(exports) {
	AMD.emit('loaded', {url: 'def.e.js'});
	return {
	    helloe: function(x){
	       console.log("def.e return helloe, trigger from: " + x);
	    }
 	};
 	/*
 	exports = {};

 	exports.hello = function(x){ console.log("hello exports~~~, from: "+x); };

 	return exports;
 	*/
     
});