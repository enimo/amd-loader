define("alpha", ["require", "exports", "test/def.beta"], function (require, exports, beta) {
       /*exports.verb = function() {
           return beta.verb();
           //Or:
           //return require("beta").verb();
       }*/
       return {
       		helloa : function (x){
       			beta.hellobt('trigger from alpha: ' + x);
       			//console.log("alpha export hello:" + x);
       		}
       }
});