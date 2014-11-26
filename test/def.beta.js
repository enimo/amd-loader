define("beta", ["require", "exports"], function (require, exports) {
       
       /*exports.verb = function() {

           console.log("beta export verb");
       }*/
       return {
       		hello : function (x){
       			console.log("beta export hello: " + x);
       		}
       }
});