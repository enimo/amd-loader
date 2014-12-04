/**
 * Simple AMD Loader
 * A subset of Asynchronous Module Definition (AMD) API 
 * Baidu LightApp Loader Provider
 *
 * @create: 2014.11.3
 * @update: 2014.11.6
 * @author: enimo <enimong@gmail.com>
 * @refer: define, require, requirejs
 * AMD Draft: https://github.com/amdjs/amdjs-api/wiki/AMD
 * @formatter & jslint: fecs xx.js --check 
 */

(function(win, doc){

    var require, define,
        _op = Object.prototype,
        _os = _op.toString;

    var _module_map = {}, //已加载并define的模块，key为模块名(id)
        _loaded_map = {}, //已加载的js资源，key为资源URL
        _loading_map = {}, //正在加载js资料，key为资源URL
        _anonymous_id = 0, //匿名define计数器
        _script_stack = [], //脚本onload堆栈压入，执行时pop, fix: 安全性待加强
        env = { debug: 1, ts: 0}; //环境相关变量    
    
    if (typeof _define_ !== 'undefined' && typeof _require_ !== 'undefined') {
        return;
    }

    /**
     * Define function implement
     *
     * @param {String} id 模块名
     * @param {Array} deps 依赖模块
     * @param {factory} factory 模块函数
     * @access public
     * @return void
    **/
    define = function(id, deps, factory) {
        if (hasProp(_module_map, id)) { 
            return; //已经执行过define不会再执行，一般在loadScript时已拦截，再加载模块不会再执行
        }
        //匿名define
        if (isFunction(id) || isArray(id) || isObject(id)) {
            //var modName = '_anonymous_' + id.toString().replace(/(\r|\n|\s)+/g, '').slice(-50); //先暂存key，暂存function的后50字符
            var modName = '_anonymous_mod_' + _anonymous_id++; //使用全局计数器id，匿名的define模块一般require时使用pathId进行，保证pathId与modName正确的对应关系即可
            if (arguments.length === 1){ //匿名&无依赖
                factory = id;
                deps = null;
            } else if (arguments.length === 2){//匿名&有依赖
                factory = deps;
                deps = id;
            }
            id = modName;

        //非匿名无依赖define
        } else if (isFunction(deps) && arguments.length === 2) { 
            factory = deps;
            deps = null;
        }
        //define是加载deps或者require(id)时加载该id的deps时机一样，实际是先执行了require才会去加载并执行对应define的
        //log("======== test define order: " + env.ts++, 'id: '+id);

        _module_map[id] = {
            id: id,
            deps: deps,
            factory: factory
        };
        _script_stack.push(id);

    };

    /**
     * require function implement
     *
     * @param {Array} deps 依赖模块
     * @param {factory} callback 回调函数
     * @access public
     * @return void
    **/
    require = function(deps, callback, errback) {
        if (typeof deps === 'string') {
            deps = [deps];
        }
        //兼容：如无异步回调，则默认为require的CMD模式
        if (deps.length === 1 && arguments.length === 1) {
            return require['sync'](deps.join(''));
        }

        var loadDeps = filterLoadDeps(deps),//过滤保留的模块id
            depsLen = loadDeps.length,
            loadCount = depsLen;
        if (depsLen) {
            for(var i = 0; i < depsLen; i++) {
                var depModName = loadDeps[i];
                loadResources(depModName, modResolved);
            }
        } else {
            allResolved();
        }
        
        function modResolved(modName) {
            var mod = getModule(modName) || {},
                filterDeps = [],
                filterLen = 0;
            //处理define时的依赖
            if (hasProp(mod, 'deps') && mod.deps) { //mod.deps !== null
                filterDeps = filterLoadDeps(mod.deps);//过滤保留的模块id
                filterLen = filterDeps.length;
            }

            //如果新加载的define模块存在有效依赖(排除require, exports, module)
            if (filterLen > 0) {
                log("modResolved callback depMod '"+mod.id+"' also have valid depends: ", filterDeps);
                loadCount += filterLen -1; //依赖本身完成加载后，计数减掉自身-1
                for(var i = 0; i < filterLen; i++) {
                    var dep = filterDeps[i];
                    //log("modResolved: ", arguments.callee);
                    loadResources(dep, arguments.callee);
                }
            } else {
                if (--loadCount <= 0) {
                    allResolved();
                }
            }
        }

        //function onResolved(depName) {
            //modResolved(depName);
        //}

        function allResolved() {
            log('=== allResolved then call require[sync], _module_map stack: ', _module_map);
            var exports = [];
            for (var index = 0; index < depsLen; index++) {
                exports.push(require['sync'](deps[index])); //确保当前require的deps模块已加载，方执行require['sync']
            }
            callback && callback.apply(undefined, exports);
            exports = null;
        }
        //errback && errback("No module definition");
    };

    /**
     * require function implement
     * 兼容CMD同步调用:
     *    var mod = require.sync("mod");
     *
     * @param {String} id 依赖模块
     * @access public
     * @return void
    **/
    require['sync'] = function(id) {
        var module, 
            exports, 
            deps,
            args = [];

        if (!hasProp(_module_map, id)) {//理论上未加载的define模块不会执行到这一层
            throw new Error('Required unknown module, id: "' + id + '"');
        }

        module = getModule(id) || {};//兼容require(pathId), 但define(id未使用path的情况)
        if (hasProp(module, "exports")) {
            log("%c模块:'"+id+"'命中exports map缓存，直接return export.", "color:#6b8e23");
            return module.exports;
        }
        //log("模块:'"+id+"'未命中exports map缓存, 执行fac.apply");
        module['exports'] = exports = {};
        deps =  module.deps;
        if (deps) { //如果该模块存在依赖
            for (var depsLen = deps.length, i = 0; i < depsLen; i++) {
                dep = deps[i];
                args.push(dep === "require" ? 
                    require : (dep === "module" ? 
                        module : ( dep === "exports" ? exports : require['sync'](dep) )
                    )
                );
            }
        }//if deps

        if (isObject(module.factory)) { //support define({ a: 1, b: 2 });
            //log("模块:'"+id+"', define的factory为JSON数据对象，直接返回");
            module.exports = module.factory;
        } else if (isFunction(module.factory)){
            var ret = module.factory.apply(undefined, args);
            //当define内使用exports是ret==undefined，故直接使用module.exports即可
            if (ret !== undefined && ret !== exports) {
                //log("模块:'"+id+"'执行apply(this, '[", args, "]'), 并获得exports: ", ret);
                module.exports = ret;
            }
        }
        return module.exports;
    };


    /**
     * 根据唯一的url地址加载js文件
     * @params {function} callback
     * @params {string} url
     * @return void
    **/
    function loadScript(url, callback) {
        if (hasProp(_loaded_map, url)) {
            log("%curl命中loaded map缓存: "+url+"不发起请求，直接执行回调", "color:#6b8e23");
            callback && callback(); //已加载和执行过的脚本，直接执行回调
        }else if(hasProp(_loading_map, url)){//正在加载
            log("%curl命中loading map缓存: "+url+"不发起请求，等待执行回调", "color:#006400");
            _loading_map[url] = _loading_map[url] || [];
            _loading_map[url].push(callback);
        }else{
            log("%curl: "+url+" 未命中loaded&loading map(onload)，发起请求", "color: blue");
            _loading_map[url] = []; //初始化key(url)

            var _head = doc.getElementsByTagName('head')[0];

            var script = doc.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.setAttribute('_md_', '_anymoore_' + url);
            _head.appendChild(script);

            if (isFunction(callback)) {
                if (doc.addEventListener) {
                    script.addEventListener("load", onload, false);
                } else { 
                    /* IE下，define和onload的执行顺序是否能保证*/
                    script.onreadystatechange = function() {
                        if (/loaded|complete/.test(script.readyState)) {
                            script.onreadystatechange = null;
                            onload();
                        }
                    };
                }
            }// end if isFunc
        } 
        //Notice: 这里onload()的触发是在define执行完之后的
        function onload() {
            log("%curl: "+url+" 加载完毕！", "color:blue");
            //log("======== test onload order: " + env.ts++, 'url: '+url);
            //防止模块没加载完时，同一模块继续被require，而此时误认为已加载完毕，故必须在onload()中
            _loaded_map[url] = true; //FIX: 如果一个模块未加载完成时再次加载该模块，会发生多次new script, FIXED 20141127
            if (!env.debug) {
                //remove reduce mem leak
                _head.removeChild(script);
            }

            var pathId = url.slice(0, -3), //兼容以文件路径形式定义的模块id
                modName = _script_stack.pop(),
                //此处待验证: 是否执行完该模块的define时，直接会触发onload事件，不存在模块间的执行和onload交错
                //已验证, 一定是define->onload->define->onload->..., 不会出现交错情况，所以用不着后面的两个stack的解决方案
                //////以下可忽略了：
                //////或者使用onload和define的执行顺序肯定是一样的原理，两边两个stack同时push，allResolved后统一pop()即得到对应关系
                //////这样的问题是对应关系是allResolved之后才建立的，如果在allResolved之前有多处调用同一匿名函数，则会进行多次[装载]&执行
                mod = _module_map[modName];
            if(mod && pathId !== modName) {//如果define的id本身就是pathId方式则忽略
                _module_map[pathId] = { alias: modName };
            }
            script = null;

            var cbStack = _loading_map[url] || [];
            if (cbStack.length > 0) {
                log("%curl: "+url+" 加载完毕, 存在回调数("+cbStack.length+")依次执行", "color:#006400");
                //cbStack = cbStack.reverse(); //保证FIFO按序执行回调, 已使用shift()代替
                while (cb = cbStack.shift()) {
                    cb && cb();
                }
                _loading_map[url] = null;
            }
            callback && callback();
        }
    }
    
    /**
     * getResources()函数在非Clouda环境下不再需要
     * @return void
    **/

    /**
     * 根据给出depModName模块名，加载对应资源，根据是否在clouda环境中使用不同加载方式以及是否处理合并关系
     * @params {function} callback
     * @params {String} depModName
     * @return void
    **/
    function loadResources(depModName, callback) {
        var url = null;
        //非clouda环境下，不处理同时加载多个js，即每一个模块都单独加载，并只对应唯一个url
        if(typeof _CLOUDA_HASHMAP == 'undefined') {
            var realId = realpath(depModName);
            url = (realId.slice(-3) !== '.js') ? (realId + '.js') : realId;//没有模块表时，默认为url地址
        } else {
            url = getResources && getResources(depModName);
        }
        log('loadResources url: ', url);
        url && loadScript(url, function(){
            log('loadResources callback depModName: ', depModName);
            callback(depModName);
        });
    }

    /**
     * 加载deps资源时过滤保留id: module, require, exports
     * @params {Array} deps
     * @return {Array} filterDeps
    **/
    function filterLoadDeps(depsMod) {    
        var filterDeps = [];
        if(depsMod && depsMod.length > 0) {
            for (var i = 0, len = depsMod.length; i < len; i++) {
                if (depsMod[i] !== 'require' && depsMod[i] !== 'exports' && depsMod[i] !== 'module' ) {
                    filterDeps.push(depsMod[i]);
                }
            }  
        }      
        return filterDeps;
    }

    /**
     * 根据模块id获取模块实体对象
     * @params {string} id
     * @return {object} module
    **/
    function getModule(id) {    
        if (!id || !hasProp(_module_map, id)) {
            log('%c_module_map中不存在该模块: "' + id + '"', "color:red");
            return false;
        }
        var module = _module_map[id];
        if(hasProp(module, "alias")){ //兼容require(pathId), 但define(id未使用path的情况)
            //log("id名: '"+id+"'非define时定义, alias到define时定义的id: ", module.alias);
            module = _module_map[module.alias];
        }        
        return module;
    }

    /**
     * Same as php realpath, 生成绝对路径
     * @params {String} path
     * @return {String} realpath
    **/
    function realpath(path) {
        var arr = [];
        if (path.indexOf('://') !== -1) {
            return path;
        }
        arr = path.split('/');
        path = [];
        for (var k = 0, len = arr.length; k < len; k++) {
            if (arr[k] == '.') {
                continue;
            }
            if (arr[k] == '..') {
                if (path.length >= 2) {
                    path.pop();
                }
            } else {
                if (!path.length || (arr[k] !== '')) {
                    path.push(arr[k]);
                }
            }
        }
        path = path.join('/');
        //return path.indexOf('/') === 0 ? path : '/' + path; //暂时不在path前加'/'
        return path;
    }

    /**
     * Helper function, same as: 1,prop in obj; 2,key_exists(); 3.obj[prop]
     * @return {boolean}
    **/
    function hasProp(obj, prop) {
        return _op.hasOwnProperty.call(obj, prop);
    }

    function isFunction(obj) {
        return _os.call(obj) === '[object Function]';
    }

    function isArray(obj) {
        return _os.call(obj) === '[object Array]';
    }

    function isObject(obj) {
        return _os.call(obj) === '[object Object]';
    }

    function log() {
        if (!env.debug) {
            return;
        }
        var apc = Array.prototype.slice; //same as [].slice; Let Object{} to Array[]
        console && console.log.apply(console, apc.call(arguments)); //return String, same like native console.log(), so choose it.
    }

    //防止污染用户后加载的AMD/CMD加载器，统一先使用: _define_, _require_
    win['_define_'] = define;
    win['_require_'] = require;

    //测试阶段，如果没有加载过requirejs之类，可直接暴露到window
    if (env.debug && typeof win.define == 'undefined') {
        win['define'] = win['_define_'];
        win['require'] = win['_require_'];
    }

    define.amd = {};
    define.version = '0.9';

})(window, document);