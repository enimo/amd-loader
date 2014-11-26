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

    var require, define;

    var _module_map = {}, //已加载并define的模块，key为模块名(id)
        _loaded_map = {}, //已加载的js资源，key为资源URL
        _anonymous_id = 0, //匿名define计数器
        _script_stack = [];//脚本onload堆栈压入，执行时pop, 不太安全...
    
    var env = { debug: true }; //环境相关变量

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
    define = function (id, deps, factory) {
        
        //已经执行过define不会再执行，一般在loadScript时已拦截，再加载模块不会再执行
        if (hasProp(_module_map, id)) { 
            return;
        }

        //支持匿名define
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
        
        //此处选择在 执行 define(id, deps)时 就加载 对应的deps
        //也可以require(id)时加载该id的deps，实际上也是先执行了require才会去加载并执行对应define的

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
    require = function (deps, callback, errback) {
        if (typeof deps === 'string') {
            deps = [deps];
        }
        //Hack兼容：如无异步回调，则默认为require的CMD模式
        if (deps.length === 1 && arguments.length === 1) {
            return require['sync'](deps.join(''));
        }

        var loadDeps = filterLoadDeps(deps),//过滤保留的模块id
            depsLen = loadDeps.length,
            loadCount = depsLen;
 
        if (depsLen) {
            for(var i = 0; i < depsLen; i++) {
                var depModName = loadDeps[i];
                log("loadDeps outer[]: ", depModName, "_module_map1: ", _module_map);
                loadResources(depModName, function(depName) {
                    log("loadDeps inner[]: name: '", depName, "', _module_map2: ", _module_map);
                    modDone(depName);
                }); //多个url时以combo形式加载
            }
        } else {
            allDone();
        }
        
        function modDone(modName) {

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
                log("modDone callback depMod '"+mod.id+"' also have valid depends: ", filterDeps);
                loadCount--;//依赖本身完成加载后，计数减掉自身

                loadCount += filterLen;
                for(var i = 0; i < filterLen; i++) {
                    var dep = filterDeps[i];
                    loadResources(dep, function(depName){
                        log("modDone inner: ", mod, "dep: ", depName, " _module_map: ", _module_map);
                        modDone(depName);
                    }); //多个url时会以combo形式加载
                }
            } else {
                log("filterLen <=0, loadCount: ", loadCount, 'modName: ', modName);
                if (--loadCount <= 0) {
                    allDone();
                }
            }
        }

        function allDone() {
            log('=== allDone then call require[sync], _module_map stack: ', _module_map);
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
    require['sync'] = function (id) {
        var module, 
            exports, 
            deps,
            args = [];

        if (!hasProp(_module_map, id)) {
            //模块定义部分还未被加载，则可能是define的deps
            throw new Error('Required unknown module, id: "' + id + '"');
        }

        module = getModule(id) || {};//兼容require(pathId), 但define(id未使用path的情况)
        if (hasProp(module, "exports")) {
            log("%c模块:'"+id+"'命中exports map缓存，直接return export.", "color:green");
            return module.exports;
        }
        log("模块:'"+id+"'未命中exports map缓存, 执行fac.apply");

        module['exports'] = exports = {};
        deps =  module.deps;
        if (deps) { //如果该模块存在依赖
            for(var depsLen = deps.length, i = 0; i < depsLen; i++) {
                dep = deps[i];
                /*
                //为方便打日志，暂使用switch case
                switch (dep) {
                    case 'require': args.push(require); break;
                    case 'module': args.push(module); break;
                    case 'exports': args.push(exports); break;
                    default: 
                        args.push(require['sync'](dep));
                }
                */
                args.push(dep === "require" ? 
                    require : (dep === "module" ? 
                        module : ( dep === "exports" ? exports : require['sync'](dep) )
                    )
                );
            }

        }//if deps

        if (isObject(module.factory)) { //兼容define({ a: 1, b: 2 });
            log("模块:'"+id+"', define的factory为JSON数据对象，直接返回");
            module.exports = module.factory;
        } else if (isFunction(module.factory)){
            var ret = module.factory.apply(undefined, args);
            //当define内使用exports是ret==undefined，故直接使用module.exports即可
            if (ret !== undefined && ret !== exports) {
                log("模块:'"+id+"'执行apply(this, '[", args, "]'), 并获得exports: ", ret);
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
        log('loadScript url: ', url);
        if (! (url in _loaded_map)) { //为外部调用loadRes()做缓存拦截，AMD已在require层拦截
            log("url: "+url+" 未命中loaded map(onload)缓存，发起请求");
            var head = doc.getElementsByTagName('head')[0],
                script = doc.createElement('script');

            script.type = 'text/javascript';
            script.src = url;
            head.appendChild(script);

            if (isFunction(callback)) {
                if (doc.addEventListener) {
                    script.addEventListener("load", onload, false);
                } else { 
                    script.onreadystatechange = function() {
                        if (/loaded|complete/.test(script.readyState)) {
                            script.onreadystatechange = null;
                            onload();
                        }
                    };
                }
            }
        } else {
            log("%curl命中load map缓存: "+url+"不发起请求，直接执行回调", "color:green");
            //已加载和执行过的脚本，直接执行回调
            callback && callback();
        }

        //Notice: 这里onload()的触发是在define执行完之后的
        function onload() {
            log("%curl: "+url+" 加载完毕！", "color:green");
            //防止模块没加载完时，同一模块继续被require，而此时误认为已加载完毕，故必须在onload()中
            _loaded_map[url] = true; //FIX: 此处如果一个模块未加载完成时再次加载该模块，则会发生多次new script

            if (!env.debug) {
                //remove reduce mem leak
                head.removeChild(script);
            }
            var pathId = url.slice(0, -3), //兼容以文件路径形式定义的模块id
                //此处待验证: 是否执行完该模块的define时，直接会触发onload事件，不存在模块间的执行和onload交错
                modName = _script_stack.pop(),
                mod = _module_map[modName];
            if(mod && pathId !== modName) {//如果define的id本身就是pathId方式则忽略
                _module_map[pathId] = { alias: modName };
            }
            script = null;
            callback && callback(url);
        }

    }

    /**
     * 根据模块名得到md5或pkg后的url路径
     * 并根据依赖表同时加载所有依赖模块
     * @param {String} id 模块名或模块路径，url etc.
     * @access public
     * @return {Array} urls
    **/
    function getResources(id) {
        var ids = [];
        if (typeof id === 'string') {
            ids = [id];
        } else {
            return;//目前该函数只支持读取单个模块名或url
        }
        var urls = [],
            cache = {};
        log('getResources id: ', id);
        (function(ids) { 
            for (var i = 0; i < ids.length; i++) {
                var id = realpath(ids[i]),
                    url = null;
                //非clouda环境下
                //没有hashmap，直接加载url
                if(typeof _CLOUDA_HASHMAP == 'undefined') {
                    if(id.slice(-3) !== '.js') {
                        url = id + '.js';//没有模块表时，默认为url地址
                    } else {
                        url = id;
                    }
                } else {

                }

                if (!url || cache[url]) {
                    continue;
                }
                urls.push(url);
                cache[url] = true;

            }
        })(ids);

        return urls;
    }
    
    /**
     * 根据给出urls数组，加载资源，大于1时选用combo，处理是否在clouda环境中使用不同加载方式
     * @params {function} callback
     * @params {Array} urls
     * @return void
    **/
    function loadResources(depModName, callback) {

        var urls = getResources(depModName);

        var src = null;

        log('loadResources urls: ', urls);

        //非clouda环境下，不处理同时加载多个js，即每一个模块都单独加载，并只对应唯一个url
        if(typeof _CLOUDA_HASHMAP == 'undefined') {
            src = (urls.length === 1) ? urls[0] : null; //非clouda环境下不应该存在多个url，故直接置为null不处理
        } else {

        }
        //处理好，回调和请求只保留一个
        src && loadScript(src, function(){
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
        if (!hasProp(_module_map, id)) {
            log('_module_map中不存在该模块: "' + id + '"');
            return false;
        }
        var module = _module_map[id];
        if(hasProp(module, "alias")){ //兼容require(pathId), 但define(id未使用path的情况)
            log("id名: '"+id+"'非define时定义, alias到define时定义的id: ", module.alias);
            module = _module_map[module.alias];
        }        
        return module;
    }

    /**
     * Same as php realpath, 获取绝对路径
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

        return path;
        //暂时不在path前加'/'
        //return path.indexOf('/') === 0 ? path : '/' + path;
    }

    /**
     * Helper function, same as in, key_exists, typeof 
     * @return {boolean}
    **/
    function hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
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
    if (env.debug && typeof window.define == 'undefined') {
        win['define'] = win['_define_'];
        win['require'] = win['_require_'];
    }

    define.amd = {};

    define.version = '0.9';


})(window, document);
