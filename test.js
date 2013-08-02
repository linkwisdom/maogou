var MaoGou = require('./maogou');
var params = {
    db: 'travel',
    ip: 'node.liandong.org',
    port: 9999,
    username: root,
    //password: false,
    igrep: true
};

var db = new MaoGou(params);
db.connect(params, ['test', 'photo']);
var photo = db.photo;

function print(err, result) {
    console.log(result);
    photo.close();
}

function testIndex() {
    photo.ensureIndex({loc: '2d'}).then(print);
}

function testInsert() {
    var dataList = [];
    
    for (var i = 15; i < 30; i++) {
        var x = 131.0 + 0.1 * i;
        var y = 39.0 + 0.1 * i;
        dataList.push({loc: [x, y], address: 'lofter'});
    }
    
    photo.save(dataList).done(
        function(err, result) {
            var c = photo.count();
            c.done(print);
        }
    );
}


function testUpdate() {
    var promise = photo.update(
        {name: 'liandong'}
        ,{
            $set: {degree: 5}
        }
    );
    
    promise.then(
        function(err, result) {
            photo.find({name: 'liandong'})
                .set({_id: false})
                .done(print);
        }
    );
    
    promise.done(print);
}


function testFind() {
    var promise = photo.find({})
        .fields({_id: false})
        .limit(12)
        .sort(['address']);
    
    promise.then(function(err, result) {
        var c = photo.count();
        c.done(function(err, result) {
            console.log(result);
            photo.close();
        });
    });
    
    promise.done(function(err, result) {
        console.log(result);
        photo.close();
    });
    
    promise.onSuccess(function(result) {
        console.log(result);
    });
    
    promise.onSuccess(function(result) {
        console.log('success');
    });
    
    promise.onError(function(err) {
        console.log(err);
    });
}

function testGeoNear() {
    var pro = photo.photoNear([130, 40])
        .set({num: 20})
        .maxDistance(103);
        
    pro.done(print);
}


function testIGrep() {
    photo.find({location: '!'}).then(print);
}

function testMapReduce() {
    var map = function() { 
        emit(this.location, 1);
    };
    
    var reduce = function(k, vals) { 
        return vals.join(','); 
    };
    
    photo.mapReduce(map, reduce).then(print);
}

function testRemove() {
    photo.remove({address: '*北京'}).then(print);
}


//testInsert();
//testFind()
