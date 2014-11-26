define("beta", ["require", "exports", 'test/def.e'], function (require, exports, e) {
       
       /*exports.verb = function() {

           console.log("beta export verb");
       }*/
       return {
       		hellobt : function (x){
       			e.helloe("def.beta exec helloe, trigger from: "+x);
       			console.log("def.beta export hellobt: " + x);
       		}
       }
});