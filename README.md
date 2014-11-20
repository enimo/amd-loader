# AMD-Loader

A Simple AMD loader Implementation, and it's alsp a subset of Asynchronous Module Definition (AMD) API, and now servering for Baidu LightApp Loader.


## Getting Started

To get you started you can simply clone the amd-loader:

### Prerequisites

Insert the script link into head tag of html files: 

```html
  <script type="text/javascript" src="./amd.loader.js"></script>
```

## API Examples: <a name="examples"></a>

### Using require and exports

Sets up the module with ID of "alpha", that uses require, exports and the module with ID of "beta":

```javascript
   define("alpha", ["require", "exports", "beta"], function (require, exports, beta) {
       exports.verb = function() {
           return beta.verb();
           //Or:
           return require("beta").verb();
       }
   });
```

An anonymous module that returns an object literal:

```javascript
   define(["alpha"], function (alpha) {
       return {
         verb: function(){
           return alpha.verb() + 2;
         }
       };
   });
```

A dependency-free module can define a direct object literal:

```javascript
   define({
     add: function(x, y){
       return x + y;
     }
   });
```

## Future 

I'll keep polishing this app and keep adding new features. If you have any problems when using this engine, please feel free to drop me an issue or contact me:

* weibo: http://weibo.com/enimo