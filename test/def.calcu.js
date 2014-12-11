(function(win, factory){
    if (typeof define == 'function' && typeof define.amd == 'object') {
        //win._ = factory();
        define('test/calcu', factory);
    }
    else {
        win.calcu = factory();
    }
//}.call(this));
})(window, function(){ 

	AMD.emit('done', 'from calcu');
	return {
	    add: function(x, y){
	       return x + y;
	    }
 	};
     
});