var events = require('events');

/**
 * mapList 对应函数的扩展链式函数的映射对象
 * 
 * 如 db.find({level: 3}).limit(1).sort('age').max(30)
 */
var mapList = {
    find: ['fields', 'limit', 'sort', 'skip', 'min', 'max'],
    findOne: ['fields', 'limit', 'sort', 'skip', 'min', 'max'],
    remove: ['single'],
    geoNear: ['num', 'maxDistance', 'query', 'uniqueDocs']
};

/**
 * 增强组件，实现mongodb风格，链式调用，promise范式
 *  
 * @param {String} fname 函数名称
 * @param {Object} options 扩展参数(引用对象)
 */
function Augment(fname, options) {
    var me = this;
    var emitter = new events.EventEmitter();
    
    var funs = mapList[fname];
    var taskQue = [];

    //将链式函数传值作为参数映射到扩展参数集
    function parameterize(item) {
        me[item] = function(value) {
            options[item] = value;
            return me;
        };
    }
    
    //执行promise任务链
    this.resolve = function(err, result) {
        if (err) {
            err.func = fname;
            emitter.emit('error', err);
            return;
        }
        
        var fun, rst;
        do {
            fun = taskQue.shift();
            if (fun) {
                rst = fun(err, rst || result);
            }
            
        } while(fun);
        
        //任务执行完毕后，发送成功事件
        emitter.emit('ok', result);
    };
    
    //执行失败，发送fail事件
    this.onError = function(callback) {
        emitter.on('error', callback);
    };
    
    
    this.onSuccess = function(callback) {
        emitter.on('ok', callback);
    };

    //直接增加扩展属性集
    this.set = function(params) {
        for (var item in params) {
            options[item] = params[item];
        }
        return me;
    };

    //增加promise任务链
    this.then = function(callback) {
        taskQue.push(callback);
        return this;
    };
    
    this.done = function(cback) {
        taskQue.push(cback);
    };
    
    if (funs) {
        funs.forEach(function(fun) {
            parameterize(fun);
        });
    }
}

/**
 * Collection对象
 * 封装mongodb集合对象的方法，通过Augment扩展
 *  
 * @param {Object} name
 * @param {Object} database
 */
function Collection(name, database) {
    var db = database;
    var me = this;
    
    function _init() {
        for (var item in db) {
            var f = db[item];
            if (typeof f == 'function') {
                me[item] = bindMethod(item, name);
            }
        }
    }

    function bindMethod(item, name) {
        return function() {
            var f = db[item];
            var options = {};
            
            //第一个参数为库名称
            var aug = new Augment(item, options);
            var args = Array.prototype.slice.call(arguments);
            args.unshift(name);
            args.push(options);
            args.push(aug.resolve);
            f.apply(db, args);
            
            //每个函数对应一个augment对象
            return aug;
        };
    }
    
    _init();
}

module.exports = Collection;