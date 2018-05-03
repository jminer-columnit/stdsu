const fs = require('fs');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var RESTUtils;
var errors = [];

const doInsert = function(name, instance){
  var filename = path.join(__dirname, "data", name.replace(" ", "_").toLowerCase() + ".json");
  fs.readFile(filename, "utf8", function(err, data){
    if(err)
      throw err;

    var snapshotDetails = JSON.parse(data);
    for(var table in snapshotDetails){
      insertTable(instance, table, snapshotDetails[table]);
    }

    RESTUtils.triggerQueue().then(function(executed){
      console.log("Attempted to insert " + executed + " entries into instance " + instance);

      if(errors.length > 0){
        console.log(errors.length + " error(s) were generated during insertion.");
        for(var i=0;i<errors.length;i++){
          console.log("\t" + errors[i]);
        }

        var errorsFile = path.join(__dirname, "errors", "errors." + Date.now() + ".txt");
        fs.open(errorsFile, 'w', function(err, fd){
          if(err)
            throw err;
          fs.write(fd, errors.join("\n"), "utf8", function(err, written, str){
            if(err)
              throw err;

            fs.close(fd, function(err){
              if(err)
                throw err;

              console.log("Errors written to " + errorsFile);
              process.exit(0);
            })
          });
        });
      }
      else {
        process.exit(0);
      }
    });
  });
};

const insertTable = function(instance, table, details){
  for(var i=0;i<details.length;i++){
    insertEntry(instance, table, details[i]);
  }
};

const insertEntry = function(instance, table, entry){
  entry = processEntry(entry);
  var entryRequest = RESTUtils.createTableRequest(instance, table);
  entryRequest.post(JSON.stringify(entry)).fail(function(err){
    errors.push(err);
  });
};

const processEntry = function(entry){
  var result = {};

  for(var key in entry){
    if(entry[key].length > 0){
      result[key] = entry[key];
    }
  }

  return result;
};

rl.question("Snapshot Name: ", function(name){
  rl.question("Instance: ", function(instance){
    rl.question("Username: ", function(user){
      rl.question("Password: ", function(pass){
        RESTUtils = require("./utils/RESTUtils")(user, pass);
        doInsert(name, instance);
      });
    });
  });
});
