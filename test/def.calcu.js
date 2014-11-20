define(function() {
	AMD.emit('done', 'from calcu');
	return {
	    add: function(x, y){
	       return x + y;
	    }
 	};
     
});