const fs = require('fs');
const path = require('path');
const tablesFile = fs.readFileSync(path.join(__dirname, "config", "tables.config"), "utf8");
const tables = tablesFile.split("\n");

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var RESTUtils;
const snapshotDetails = {};
const IGNORED = [
  "sys_id"
];

const retrieveSnapshot = function(name, instance){
  for(var i=0;i<tables.length;i++){
    getTableSnapshot(instance, tables[i]);
  }

  RESTUtils.triggerQueue().then(function(){
    var filename = path.join(__dirname, "data", name.replace(" ", "_").toLowerCase() + ".json");
    fs.open(filename, 'w', function(err, fd){
      if(err)
        throw err;

      fs.write(fd, JSON.stringify(snapshotDetails), "utf8", function(err, written, str){
        if(err)
          throw err;

        fs.close(fd, function(err){
          if(err)
            throw err;

          console.log("Snapshot written to " + filename);
          process.exit(0);
        });
      });
    });
  });
};

const getTableSnapshot = function(instance, table){
  table = table.trim();
  if(table.length == 0)
    return;

  var tableRequest = RESTUtils.createTableRequest(instance, table);
  var results = [];
  tableRequest.get().then(function(response){
    var responseJson = JSON.parse(response);
    for(var i=0;i<responseJson.result.length;i++){
      results.push(processEntry(responseJson.result[i]));
    }
  });

  snapshotDetails[table] = results;
};

const processEntry = function(entry){
  var result = {};
  for(var key in entry){
    if(IGNORED.indexOf(key) == -1){
      if(typeof entry[key] == "object"){
        if(entry[key].hasOwnProperty('value')){
          result[key] = entry[key].value;
        }
      }
      else {
        result[key] = entry[key];
      }
    }
  }

  return result;
}

rl.question("Snapshot Name: ", function(name){
  rl.question("Instance: ", function(instance){
    rl.question("Username: ", function(user){
      rl.question("Password: ", function(pass){
        RESTUtils = require("./utils/RESTUtils")(user, pass);
        retrieveSnapshot(name, instance);
      });
    });
  });
});
