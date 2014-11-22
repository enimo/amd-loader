define(function(exports) {
	AMD.emit('loaded', {url: 'def.e.js'});
	/*return {
	    hello: function(){
	       console.log("hello~~~")
	    }
 	};*/
 	exports = {};

 	exports.hello = function(x){ console.log("hello exports~~~, from: "+x)};

 	return exports;
     
});