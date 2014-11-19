/**
 * 一个简单的事件注册/派发器
 *
 * @create: 2014.09.12
 * @author: enimo <enimong@gmail.com>
 * @formatter & jslint: fecs xx.js --check 
 *
 */


(function(win) {

    function Events() {}

    Events.prototype.on = function (name, cb) {
        var cbs = this.events[name];
        if (!cbs) {
            cbs = this.events[name] = [];
        }
        cbs.push(cb);
    };

    Event.prototype.emit = function (name, evt) {
        each(this.events[name], function (cb) {
            cb(evt);
        });
        if (name === 'error') {
            //Now that the error handler was triggered, remove
            //the listeners, since this broken Module instance
            //can stay around for a while in the registry.
            delete this.events[name];
        }
    };

    Events.prototype.trigger = Events.prototype.emit;

    // Mix `Events` to object instance or Class function.
    Events.mixTo = function(receiver) {
        receiver = isFunction(receiver) ? receiver.prototype : receiver;
        var proto = Events.prototype;

        for (var p in proto) {
            if (hasProp(proto, p)) {
                receiver[p] = proto[p];
            }
        }
    }

    win['Events'] = Events;

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }


    /**
     * Toolkit func, same as in, key_exists, typeof 
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

})(window);
