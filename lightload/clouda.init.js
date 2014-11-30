/**
 * Clouda API Init
 * Baidu LightApp Loader Provider
 *
 * @create: 2014.11.6
 * @author: enimo <enimong@gmail.com>
 * @formatter & jslint: fecs xx.js --check 
 */


(function(win, doc){
    if ( typeof win !== 'object')
        return;
    if ( typeof win.clouda === 'undefined') {
        win.clouda = {};
    }

    if(win.Blend && win.Blend.ui){
        clouda.ui = Blend.ui;
    }

    win.Blend = win.blend = clouda;   // 加上Blend 和blend两个命名空间
    
    //同步API调用声明
    var device_apis = {
        "accelerometer": [],
        "activity": ["start","checkSupport"],
        "battery": ["get","startListen","stopListen","checkSupport"],
        "compass": [],
        "connection": ["get","checkSupport"],
        "contact": [],
        "device": ["getImei","getSysVersion","getDeviceModelName","getScreenSize","checkSupport"],
        "fs": ["post","checkSupport"],
        "geolocation": ["get","startListen","stopListen","checkSupport"],
        "globalization": ["getlocale","checkSupport"],
        "gyro": [],
        "localStorage": [],
        "media": ["captureMedia","operateMedia","checkSupport"],
        "notification": [],
        "qr": ["startCapture","checkSupport"],
        "screen": [],
        "orientation": ["setOrientation","checkSupport"],
        "keyboard": ["startListenKeyboard","stopListenKeyboard"]
    };

    var mbaas_apis = {
        "account": ["login","closeLoginDialog","checkSupport","bdLogin"],
        "app": ["followSite","checkFollow","checkSupport"],
        "pay": ["init","doPay","checkSupport"],
        "socialshare": ["callShare","checkSupport"],        
        "push": ["registerUnicast","unregisterUnicast","registerMulticast","unregisterMulticast","getUniqueId","isBind","checkSupport"],
        "vtt": ["init","showDialog"],  
        "tts": ["say"],
        "subscribe": ["setPanel","showPanel"],
        "feedback": ["addFeedback","getFeedback"]
    };
  
    var lego_apis = {
        "smartBar":["show","hide","setViewItems","setShowViewItem","setTheme"],
        "monitor": ["create", "click", "error", "send"]
    };

    if(!window.cloudaapiInitCount){
        window.cloudaapiInitCount = {};
        cloudaapiInitCount.lightInit = 0;
        cloudaapiInitCount.load = 0;
    }

    //API存储栈
    var API_STACK = [];
    
    //兼容第一版的clouda初始化接口
    if (typeof clouda.lightapp !== 'function') {//可能异步加载
        clouda.lightapp = function(ak, callback) {
            clouda.lightapp.ak = ak;
            
            if (!clouda.device || !clouda.mbaas || !clouda.mbaas.pay) {//避免重复加载
                var domain;
                if (window.location.protocol === "http:"){
                    domain = "http://apps.bdimg.com";
                }else{
                    domain = "https://openapi.baidu.com";
                }
                /*
                loadScript(domain+"/cloudaapi/s/api-0.5.5.js", function(){
                    if(typeof callback === 'function'){ callback();}
                    mystack = stack;
                    if (mystack.length){
                        for(var qq=0;qq<mystack.length;qq++){
                            eval(mystack[qq].func).apply(null,mystack[qq].arg);
                        }
                        mystack.length=0;
                    }
                });
                */
            }else{
              if (typeof callback === 'function'){ callback();}
            }

            //initStack(["activity","battery","connection","device","fs","geolocation","globalization","media","qr","account","app","pay"]);
        };
    }


    //第二版clouda初始化接口
    if (typeof clouda.lightInit !== 'function') {
        clouda.lightInit = function(obj, callback) {
            //clouda.lightInit.stack = []; //  存放函数队列
            if (obj.ak) {
              clouda.lightapp.ak = obj.ak;
            }
            var apis = obj.module;

            //do something...
        };
    }

    //目前推荐的appid获取方式
    //自动通过<script data-appid="1234">标签获取本标签的appid
    var script = doc.getElementsByName("baidu-tc-cerfication");
    if (script.length) {
      for (var l=script.length;l--;) {
        if (script[l].getAttribute("data-appid")) {
          clouda.lightapp.appid = script[l].getAttribute("data-appid");
          break;
        }
      }
    }


    /**
    * @pram modules(array) 需要加载的模块
    */
    function initStack(modules){
        var r_apis = modules;

        var api_tmp,type;
        for (var i = r_apis.length - 1; i >= 0; i--) {
            if(!clouda.device){
                clouda.device = {};
            }
            if(!clouda.mbaas){
                clouda.mbaas = {};
            }
            if(!clouda.lego){
                clouda.lego = {};
            }
            api_tmp =  device_apis[r_apis[i]]?device_apis[r_apis[i]]:false;
            var legoApiTmp = lego_apis[r_apis[i]]?lego_apis[r_apis[i]]:false;
            if(api_tmp){
                type = "device";
            }else if(legoApiTmp){
                type = "lego";
                api_tmp = legoApiTmp;
            }else{
                type="mbaas";
                api_tmp =  mbaas_apis[r_apis[i]]?mbaas_apis[r_apis[i]]:false;
            }
            
            if (typeof eval("clouda."+type+"['"+r_apis[i]+"']") !== 'undefined'){
                continue;
            }

            //对于blendui,不在mbaas和device中,不考虑延迟
            if(!api_tmp) continue;
            
            eval("clouda."+type+"['"+r_apis[i]+"'] ={}");
            var f_str;
            for (var j = 0,len= api_tmp.length; j< len; j++) {
                    f_str= "function(){stack.push({func:'clouda."+type+"."+r_apis[i]+"."+api_tmp[j]+"',arg:arguments});}";
                    eval("clouda."+type+"['"+r_apis[i]+"']['"+api_tmp[j]+"'] ="+f_str);
                
            }
            
        }

    }
    

    function loadScript(url, callback) {
        var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement, script, options, s;
        if ( typeof url === 'object') {
            options = url;
            url = undefined;
        }
        s = options || {};
        url = url || s.url;
        callback = callback || s.success;
        script = document.createElement("script");
        script.async = s.async || false;
        script.type = "text/javascript";
        if (s.charset) {
            script.charset = s.charset;
        }
        script.src = url;
        head.insertBefore(script, head.firstChild);
        if (typeof callback === 'function') {
            if (document.addEventListener){
                script.addEventListener("load", callback, false);
            }else{ 
                script.onreadystatechange = function() {
                    if (/loaded|complete/.test(script.readyState)) {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            }
        }
    }


})(window, document);
