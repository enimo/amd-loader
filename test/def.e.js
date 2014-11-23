define(function(exports) {
	AMD.emit('loaded', {url: 'def.e.js'});
	return {
	    hello: function(x){
	       console.log("hello return~~~, from: " + x);
	    }
 	};
 	/*
 	exports = {};

 	exports.hello = function(x){ console.log("hello exports~~~, from: "+x); };

 	return exports;
 	*/
     
});