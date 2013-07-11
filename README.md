# maogou
> help noders access mongodb in a mongod and promise style

> maogou是一个帮助node开发者访问mongodb的工具，开发者可以使用mongodb原生的语法格式，且支持promise调用方式
   
# author info.

   @author liu@liandong.org
   
   @homepage http://www.liandong.org
 
# usage
    
    npm install maogou
    
- please make sure that mongdb package have been installed

确保mongodb- node包已经安装， 暂不考虑本地引入mongodb
   

> for demo cases, click [test.js](https://raw.github.com/linkwisdom/maogou/master/test.js)
 

# features

-  easy setup and connect mongodb
 
  简洁的连接方式


    var db = new MaoGou(params, 'user');

-  mongodb-like
 
采用类似mongodb客户端的简洁灵活的语法


     db.user.find({name: 'linkwisdom'}).then(print);

- promise and deffred are augmented, handler data in a midware-pipe line with then-chains
 
采用promise防止异步调用的错乱结构,同时支持中间件处理


     db.user.find({age: 19})
         .then(filter)
         .done(print);
     
 
-  setup the argument `options` in an uncurring pattern
  
采用反柯里的语法结构进行参数设置


     db.vistor.geoNear([130.19,39.102])
          .maxDsitance(0.39)
          .limit(25)
          .done(print);

-  serveral useful functions, mapreduce, find, update, remove, geoNear, cout, etc. are supported and augmented

支持简化的mapreduce，find, update,remove,geoNear,count等过程

     db.vistor.update({age: 19},{age: 20})
         .set({w: 1})
         .done(print);
         
- connect on demmand, close any time;

按需连接，即时关闭

     db.user.find({}).done(function(err, docs){
         db.user.close();
     });

-  more ...
 
更多新特性在完善
   
   web-client support, 与couchDB一样，我们希望能够提供一个支持http数据库操作API接口


# dependency
    mongodb package
 
# use case
 
   [旅行地图](http://liandong.org/travel)

   [凤巢数据中心](http://ecomfe/uedc)
    
    

