// import voter records from Colorado CSV file
// tsc importvoters.ts
// node importvoters.js <filename>
// -d for <filename> to drop table

var fs = require('fs')
var es = require('event-stream');
var MongoClient = require('mongodb');
var CSV = require('csv-string');

var count = 0;
var starttime = Date.now();

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

MongoClient.connect('mongodb://localhost:27017/matchdb', { useNewUrlParser: true })
    .then(odb => {
        console.log("MongoDB opened");
        var db = odb.db();
        if (process.argv[2] === "-d") {
            console.log("Dropping RegisteredVoters table");
            db.collection("RegisteredVoters").drop();
            odb.close();
            process.exit();
        }
        db.collection("RegisteredVoters").createIndex({ "vid": 1 });
        db.collection("RegisteredVoters").createIndex({ "cc": 1 });
        db.collection("RegisteredVoters").createIndex({ "state": 1 });
        var s = fs.createReadStream(process.argv[2])
            .pipe(es.split())
            .pipe(es.mapSync(function (line) {
                s.pause();
                if (line) {
                    var fields = CSV.parse(line);
                    if (fields[0][26] === "Active") { //filters header too
                        var vid = fields[0][0];
                        var state = "Colorado";
                        var cc = "us";
                        db.collection("RegisteredVoters").updateOne({ vid: vid, state: state, cc: cc }, 
                            { $set: { cc: cc, state: state, vid: vid, house_num: fields[0][11], city: capitalize(fields[0][20]) } }, 
                            { upsert: true, w: 1 });
                        count++;
                    }
                }
                s.resume();
            }))
            .on('error', function (err) {
                console.log('Error while reading file.', err);
                odb.close();
            })
            .on('end', function () {
                console.log(count, 'voters added in', Math.round((Date.now() - starttime) / 1000), 'seconds');
                odb.close();
            })
    });