define(function(exports) {
	AMD.emit('done', 'from calcu');
	return {
	    add: function(x, y){
	       return x + y;
	    }
 	};

 	//exports.add = function(x, y){ return x + y; };
     
});