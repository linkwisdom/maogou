var mapList = {
    find: ['fields', 'limit', 'sort', 'skip', 'min', 'max'],
    findOne: ['fields', 'limit', 'sort', 'skip', 'min', 'max'],
    remove: ['single'],
    geoNear: ['num', 'maxDistance', 'query', 'uniqueDocs']
};

function Augment(fname, options) {
    var me = this;
    var funs = mapList[fname];
    var taskQue = [];

    function parameterize(item) {
        me[item] = function(value) {
            options[item] = value;
            return me;
        }
    }
    
    this.resolve = function(err, result) {
        var fun, rst;
        do {
            fun = taskQue.shift();
            if (fun) {
                rst = fun(err, rst || result);
            }
        } while(fun);
    }
    
    this.set = function(params) {
        for (var item in params) {
            options[item] = params[item];
        }
        return me;
    }

    this.then = function(callback) {
        taskQue.push(callback);
        return this;
    }
    
    this.done = function(cback) {
        taskQue.push(cback);
    }
    
    if (funs) {
        funs.forEach(function(fun) {
            parameterize(fun);
        });
    }
}

function Collection(name, database) {
    var db = database;
    var me = this;
    
    function _init() {
        for(var item in db) {
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
        }
    }
    
    _init();
}

module.exports = Collection;