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
        _loaded_map = {}; //已加载的js资源，key为资源URL
    
    //防止污染用户后加载的AMD/CMD加载器，统一先使用: _define_, _require_
    if (typeof _define_ !== 'undefined') {
        return;
    } else {
        win['_define_'] = define;
        win['_require_'] = require;
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
        if (hasProp(_module_map, id)) {
            return;
        }

        //无依赖define
        if (isFunction(deps)) { //!isArray(deps)
            factory = deps;
            deps = null;
        }

        _module_map[id] = {
          id: id,
          deps: deps,
          factory: factory;
        };

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
        //Hack：兼容require的CMD模式
        if (deps.length === 1 && arguments.length === 1) {
            return require['sync'](deps.join(''));
        }

        var depsLen = deps.length,
            loadCount = depsLen,
            urls;
        if (depsLen) {
            for(var i = 0; i < depsLen; i++) {
                urls = getResources(deps[i]);
                loadResource(urls, modDone);
            }
        } else {
            allDone();
        }

        function modDone() {
            if (! --loadCount) {
                allDone();
            }
        }

        function allDone() {
            var exports = [];
            for (var index = 0; index < depsLen; index++) {
                exports.push(require['sync'](deps[index]));
            }
            callback && callback.apply(undefined, exports);
            exports = null;
        }

        //errback && errback("No module definition");
        //第一次调用define函数后,require 会被修改为真正执行的函数
        //throw new Error("No module definition");
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
            throw new Error('Required unknown module "' + id + '"');
        }

        module = _module_map[id];
        if (hasProp(module, "exports")) {
            return module.exports;
        }

        module['exports'] = exports = {};
        deps =  module.deps;

        for(var depsLen =deps.length, i = 0; i < depsLen; i++) {
            dep = deps[i];
            args.push(dep === "module" ? module : (dep === "exports" ? exports : require['sync'](dep)));
        }

        var ret = module.factory.apply(undefined, args);
        if (ret !== undefined && ret !== exports) {
            module.exports = ret;
        }

        return module.exports;
    };

    /**
     * 根据模块名得到md5或pkg后的url路径
     * 并根据依赖表同时加载所有依赖模块
     * @param {String, Array} ids 模块名或模块路径，url etc.
     * @access public
     * @return {Array} urls
    **/
    function getResources(ids) {
        if (typeof ids === 'string') {
            ids = [ids];
        }
        var urls = [],
            cache = {};

        (function(ids) { 
            for (var i = 0; i < ids.length; i++) {
                var id = realpath(ids[i]);

                if(typeof _CLOUDA_HASHMAP.deps !== 'undefined'){
                    var mod = _CLOUDA_HASHMAP.deps[id] || {},
                        deps_ids = mod['deps']; //递归得到所有依赖资源
                    deps_ids && arguments.callee(deps_ids);
                }

                if (typeof _CLOUDA_HASHMAP_.res !== 'undefined') {
                    var res = _CLOUDA_HASHMAP_.res[id] || {},
                        url = res.pkg ? res.pkg : (res.src || id);
                    if (cache[url]) {
                        continue;
                    }
                    urls.push(url);
                    cache[url] = true;
                }
            }
        })(ids);

        return urls;
    }
    
    /**
     * 根据给出urls数组，加载资源，大于1时选用combo
     * @params {function} callback
     * @params {Array} urls
     * @return void
    **/
    function loadResource(urls, callback) {

        var domain, src;

        if (window.location.protocol === "http:") {
            domain = "http://apps.bdimg.com";
        } else {
            domain = "https://openapi.baidu.com";
        }

        src = (urls.length === 1) ? urls[0] : '/cloudaapi/api-list.js?a=' + encodeURIComponent(urls.join(','));

        if (! (src in _loaded_map))  {//为外部调用loadRes()做缓存拦截，AMD已在require层拦截
            _loaded_map[src] = true;

            var head = doc.getElementsByTagName('head')[0],
                script = doc.createElement('script');

            script.type = 'text/javascript';
            script.src = domain + src;
            head.appendChild(script);

            if (isFunction(callback)) {
                if (doc.addEventListener) {
                    script.addEventListener("load", callback, false);
                } else { 
                    script.onreadystatechange = function() {
                        if (/loaded|complete/.test(script.readyState)) {
                            script.onreadystatechange = null;
                            callback();
                        }
                    };
                }
            }
        }

    }

    /**
     * Same as php realpath, 获取绝对路径
     * @params {String} path
     * @return {String} realpath
    **/
    function  realpath(path) {
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

        return path.indexOf('/') === 0 ? path : '/' + path;
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


    /**
     * 依赖关系映射表数据结构：
     *   {
     *     'mod/a': { 
     *       'deps': ['mod/c', 'mod/d']
     *     }
     *   }
     * 
    **/
    function handlerDepends(id, callback) {

    }

    // undergoing
    function regPlugin(id) {
        //_plugins_map.push(id);
    }

    define.amd = {};

    define.version = '0.8';

})(window, document);
