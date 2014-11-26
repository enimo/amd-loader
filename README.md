# AMD-Loader

A Simple AMD loader Implementation, subset of Asynchronous Module Definition (AMD) API, and now serving for Baidu LightApp Loader.


## Getting Started

To get you started you can simply clone the amd-loader:

### Prerequisites

Insert the script link into head tag of html files: 

```html
  <script type="text/javascript" src="./amd.loader.js"></script>
```
if use it in production, compress first:
```shell
uglifyjs amd.loader.js -o amd.loader.min.js -m -c
```

## API Examples: <a name="examples"></a>

### Using require and exports

Typical usage:

Sets up the module with PATH ID of "test/def.alpha", will load script 'test.def.alpha.js'

```javascript
   define("test/def.alpha", function (alpha) {
        return alpha.hello();
   });
```

With dependences:

```javascript
   define("test/def.alpha", ['test/def.d', 'test/def.e'], function (alpha, d, e) {
        return {
          helloa: alpha.hello(),
          hellod: d.hello(),
          helloe: e.hello()
        }
   });
```

Sets up the module with ID of "alpha", that uses exports and the module with ID of "beta":

In this case, module ID 'alpha' will auto generate an alias path ID like: 'test/def.alpha'.

```javascript
   define("alpha", ["exports", "beta"], function (exports, beta) {
       exports.verb = function() {
           return beta.verb();
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

An anonymous and dependency-free module can define a direct object literal:

```javascript
   define({
     add: function(x, y){
       return x + y;
     }
   });
```

```javascript
   define({ a: 1, b: 2 });
```

## Future 

I'll keep polishing this app and keep adding new features. If you have any problems when using this engine, please feel free to drop me an issue or contact me:

* weibo: http://weibo.com/enimo