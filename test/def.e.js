define(function(exports) {
	AMD.emit('loaded', {url: 'def.e.js'});
	/*return {
	    hello: function(){
	       console.log("hello~~~")
	    }
 	};*/

 	exports.hello = function(x, y){ return x + y; };

 	return exports;
     
});