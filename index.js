/**
 * @file mongoudb基础扩展
 * 
 * @author liu@liandong.org
 * 
 * maogou是一个nodejs访问mongodb的支持工具
 * 相比mongodb组件，maogou有以下新的特性
 * 
 * 1. 采用类似mongodb客户端的简洁灵活的语法
 *    db.user.find({name: 'linkwisdom'})
 *           .then(print);
 * 
 * 2. 采用promise防止异步调用的错乱结构,同时支持中间件处理
 *    db.user.find({age: 19})
 *           .then()
 *           .done()
 * 
 * 3. 采用uncurring语法结构进行参数设置
 *    db.vistor.geoNear([130.19,39.102])
 *             .maxDsitance(0.39)
 *             .limit(25)
 *             .then(print);
 * 
 * 4. 支持简化的mapreduce，find, update,remove,geoNear,count等过程
 *    db.vistor.update({age: 19},{age: 20})
 *             .update()
 *             .done(print);
 * 
 * 5. 更多新特性在完善
 *    web-client support, 与couchDB一样，
 *    我们希望能够提供一个支持http数据库操作API接口
 *    
 * 依赖: 
 * - mongodb
 *   nodejs访问mongodb的基础组件
 *  
 * - Collection.js 
 *   实现了promise和uncurring链式调用，封装实现了类mongodb客户端脚本调用方式
 * 
 */

var mongo = require('mongodb');
var Collection = require('./Collection');

/**
 * MaoGou 实现了基础的mongodb调用方法，
 * 其中公开方法参数约定为：
 * 第一个参数为collection名称
 * 最后两个参数分别为options和callback
 * 使用方法:
 * var db = new MaoGou(params, 'user');
 * db.user.find({}).done(print);
 */
    
function MaoGou(params, db) {
    
    //如果要求authentic才能访问，在connect参数中提供用户名和密码
    var username;
    var password;

    //是否采用模糊查询
    var igrep = false;
    
    //当前对象别名
    var me = this;
    
    //连接池
    var linkPool = [];

    me.Collection = Collection;
    
    function _construct() {
        if (params && db) {
            me.connect(params, db);
        }
    }
    
    /**
     * @param {object} params连接参数
     * @param {string/array} 需要链接的集合
     */
    this.connect = function(params, cols) {
        //预设参数
        username = params.username;
        password = params.password;
        igrep = params.igrep;
        
        cols || (cols = []);
        ('string' == typeof cols) && (cols = [cols]);
        
        //为了每次请求采用新的连接，使用Getter变量
        me.__defineGetter__('db', function() {
            var server = new mongo.Server(params.ip, params.port, {});
            return new mongo.Db(params.db, server, {w: 1});
        });

        //为每个集合创建一个collection对象
        cols.forEach(function(item) {
            me[item] = new Collection(item, me);
        });
    };
    
    
    /**
     * 获得collection后的请求处理函数
     * 为保持callback和db参数，采用返回函数形式
     * @param {function} callback 回调函数 
     * @param {MongoDB} db
     * @return {function}
     */
    function resolve(callback, db) {
        return function(err, collection) {
            //将连接加入连接池管理
            linkPool.push(db);
            //执行回调函数
            callback(err, collection);
        };
    }
    
    /**
     * 获得collection对象
     * 解决登录和非登录两种连接方式
     * 
     * @param{string} coName 文档名称
     * @param{function} callback 回调函数
     */
    function execute(coName, callback) {
        //me.db是一个Getter属性，动态获得请求链接
        var db = me.db;
         
        //无密码访问
        if (!password) {
            db.open(function(err, db) {
                db.collection(coName, resolve(callback, db));
            });
            return;
        }
          
         //需要验证方式链接, 比如BAE访问mongodb
        db.open(function(err, db) {
            db.authenticate(username, password, function(err, result) {
                if (result) {
                      db.collection(coName, resolve(callback, db)); 
                }
            });
        });
    }
    
    /**
     * 将字符串关联数组转为模糊查询条件
     * 主要是面向HTTP访问方式
     * 星号*表示模糊查询 
     * 叹号！表示对应字段为空的条件
     * @params {object} selector 需要转化的查询条件
     */
    function itrans(selector) {
        if (!igrep) {
            return;
        }
        for (var item in selector) {
            var v = selector[item];
            if ((typeof v == 'string')) {
                var c = v.charAt(0);
                if (c == '*') {
                    v = v.replace(/\*/g , '.*');
                    try {
                        var r = new RegExp(v);
                        if (r) {
                            selector[item] = r;
                        }
                    }
                    catch (ex) {
                        console.log('illegal regs');
                    }
                }
                else if (c == '!') {
                    selector[item] = null;
                }
            }
        }
        return selector;
    }
    
    /**
     * 更新文档
     * @param {object} selector 查询条件
     * @param {object} updator 更新操作
     * @param {object} options 参考mongodb文档
     */
    this.update = function(coName, selector, updator, options, callback) {
        itrans(selector);
        function action(err, collection) {
            collection.update(selector, updator, options, callback);  
        }
        execute(coName, action);
    };
    
    /**
     * 设置文档主键
     * @param {string} fname 字段名称
     * @param {object} options 参考mongodb文档 
     */
    this.ensureIndex = function(colName, fname, options, callback) {
        execute(colName, function(err, collection) {
            collection.ensureIndex(fname, options, callback);
        });
    };
    
    /**
     * 删除文档主键
     * @param {string} fname 字段名称
     * @param {object} options 暂时默认为{}
     */
    this.dropIndex = function(colName, fname, options, callback) {
        execute(colName, function(err, collection) {
            collection.dropIndex(fname, callback);
        });
    };
    
    /*
     * @param{object} json必须包含key,
     * date和data属性，其中key指定数据库集合名，date为数据产生的日期，data为数据的集合
     * @param{function} func为回调函数
     */
    this.save = function(colName, json, options, callback) {
        execute(colName, function(err, collection) {
            collection.insert(json, function(err, docs) {
              collection.count(function(err, count) {
                callback(null, {count: count});
              });
            });
        });
    };

    /**
     * 查找文档
     * @param {object} selector 查询条件
     * @param {object} options 参考mongodb文档
     */
    this.find = function(colName, selector, options, callback) {
        execute(colName, function(err, collection) {
            if (err) {
                callback(err, null);
            }
            else {
                itrans(selector);
                var cursor = collection.find(selector, options || {});
                cursor.toArray(callback);
            }
        });
    };
    
    /**
     * 查找单个文档
     * @param {object} selector 查询条件
     * @param {object} options 参考mongodb文档
     */
    this.findOne = function(colName, selector, options, callback) {
        execute(colName, function(err, collection) {
            if (err) {
                callback && callback({msg: 'error'});
            }
            else {
                itrans(selector);
                collection.findOne(selector, options, callback);
            }
        });
    };
    
    /**
     * 按空间位置检索元素
     * @param {array} loc 查询位置 loc[log,lat]
     * @param {object} options 参考mongodb文档
     */
    this.geoNear = function(colName, loc, options, callback) {
        execute(colName, function(err, collection) {
            if (err) {
                callback && callback({msg: 'error'});
            }
            else {
                if (options.query) {
                    itrans(options.query);
                }
                collection.geoNear(loc[0], loc[1], options, callback);
            }
        });
    };
    
    /**
     * 计算集合的文档数目
     * @param {object} options 默认为{}
     */
    this.count = function(colName, options, callback) {
        execute(colName, function(err, collection) {
            collection.count(options, callback);
        });
    };
    
    /**
     * 删除文档
     * @param {object} selector 查询条件
     * @param {object} options 参考mongodb文档
     */
    this.remove = function(colName, selector, options, callback) {
        execute(colName, function(err, collection) {
            if (collection) {
                itrans(selector);
                collection.remove(selector, options, callback);
            }      
        });
    };
    
    /**
     *  @params {String} colName Collection对应名称
     *  @params {Function} map 如果是String，则视为按字段group，函数为map过程函数
     *  @params {Function} reduce过程函数
     *  @params {Function}
     */
    this.mapReduce = function(colName, map, reduce, options, callback) {
        options.out = {replace: 'tempCollection'};
        execute(colName, function(err, collection) {
           collection.mapReduce(map, reduce, options, 
               function(err, collection) {
                   if (collection) {
                       collection.find().toArray(callback);
                   }
                   else {
                       callback(err, null);
                   }
               }
            );
        });
    };
    
    /**
     * 关闭连接池，确认请求都结束后，
     * 使用db.close()
     * 或db.xx.close()
     * @param colName集合名称
     */  
    this.close = function(colName) {
       var db = linkPool.shift();
       while (db) {
           db.close();
           db = linkPool.shift();
       }
    };
    
    _construct();
}

module.exports = MaoGou; 