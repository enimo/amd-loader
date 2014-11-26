define("beta", ["require", "exports", 'test/def.e'], function (require, exports, e) {
       
       return {
       		hellobt : function (x){
       			e.helloe("def.beta exec helloe, trigger from: "+x);
       			console.log("def.beta export hellobt: " + x);
       		}
       }
});