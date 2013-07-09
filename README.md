 @author liu@liandong.org
 @homepage http://www.liandong.org
 
maogou是一个nodejs访问mongodb的支持工具
相比mongodb组件，maogou有以下新的特性

 >  采用类似mongodb客户端的简洁灵活的语法

     db.user.find({name: 'linkwisdom'}).then(print);

 >  采用promise防止异步调用的错乱结构,同时支持中间件处理

     db.user.find({age: 19})
         .then(filter)
         .done(print);
     
 
 > 采用uncurring语法结构进行参数设置

     db.vistor.geoNear([130.19,39.102])
          .maxDsitance(0.39)
          .limit(25)
          .done(print);

 > 支持简化的mapreduce，find, update,remove,geoNear,count等过程

     db.vistor.update({age: 19},{age: 20})
         .set({w: 1})
         .done(print);


 >  更多新特性在完善
   web-client support, 与couchDB一样，我们希望能够提供一个支持http数据库操作API接口


 * 依赖: mongodb
 
 * use case
 
   [旅行地图](http://liandong.org/travel)

   [凤巢数据中心](http://ecomfe/uedc)

 * 使用方法

    参考 [test.js](https://raw.github.com/linkwisdom/maogou/master/test.js)
    
    

