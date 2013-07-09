var data = require('./travel');
        var arr = [];
        for(var item in data) {
            var d = data[item];
            delete d._id;
            d.loc = d.location.split(',');
            d.loc[0] =  d.loc[0] - 0;
            d.loc[1] =  d.loc[1] - 0;
            arr.push(d);
        }
        db.save(arr).then(response);