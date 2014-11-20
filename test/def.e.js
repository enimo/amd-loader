define(function() {
	AMD.emit('loaded', {url: 'def.e.js'});
	return {
	    hello: function(){
	       console.log("hello~~~")
	    }
 	};

 	//exports.add = function(x, y){ return x + y; };
     
});