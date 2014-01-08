var MaoGou = require('maogou');

var params = {
    ip: 'localhost',
    port: 8973,
    db: 'travel'
};

var db = new MaoGou(params, ['user']);

//db.connect(params, ['user']);


function print(err, data) {
    if (!err) {
        console.log(data);
    }
}

//var list = [];
//for (var i = 15; i--;) {
//   list.push({name: 'p' + i, age: i});
//}

db.user.save({name: 'www'})
    .done(print);
