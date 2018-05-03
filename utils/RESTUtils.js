const https = require('https');
const workerQueue = require("./WorkerQueue");

const RESTUtils = (function(user, pass){
  const createAuthHeader = function(){
    return "Basic " + Buffer.from(user + ":" + pass).toString("base64");
  };

  const prepareURL = function(url){
    var re = /https:\/\/(.+?)\/(.+(?=\?(.+))|.+)/;

    var match = re.exec(url);
    if(match == undefined){
      return undefined;
    }
    else {
      var host = match[1];
      var path = match[2];

      if(match[3] != undefined){
        var queriesParsed = [];
        var queries = match[3].split("&");
        for(var i=0;i<queries.length;i++){
          var parts = queries[i].split("=");
          queriesParsed.push(parts[0] + "=" + encodeURIComponent(parts[1]));
        }
        path += "?" + queriesParsed.join("&");
      }

      return {
        host: host,
        port: 443,
        path: path,
        headers: {
          "Authorization": createAuthHeader()
        }
      };
    }
  };

  const createRequest = function(url){
    return new RESTRequest(prepareURL(url));
  };

  const createTableRequest = function(instance, table, query){
    var host = instance + ".service-now.com";
    var path = "/api/now/table/" + table;
    query = query || {};

    if(Object.keys(query).length > 0){
      var queries = [];
      for(var key in query){
        queries.push(key + "=" + encodeURIComponent(query[key]));
      }
      path += "&" + queries.join("&");
    }

    return new RESTRequest({
      host: host,
      port: 443,
      path: path,
      headers: {
        "Authorization": createAuthHeader()
      }
    });
  };

  return {
    createRequest: createRequest,
    createTableRequest: createTableRequest,
    triggerQueue: workerQueue.run
  };
});

const RESTRequest = (function(opts){
  const get = function(){
    return workerQueue.createWorker(function(promise){
      opts.method = "GET";
      var req = https.request(opts, function(res){
        res.setEncoding("utf8");
        var data = "";

        res.on('data', function(chunk){
          data += chunk;
        });

        res.on('end', function(){
          promise.resolve(data);
        });
      });

      req.on('error', function(err){
        promise.reject(err);
      });

      req.end();
    });
  };

  const post = function(payload){
    return workerQueue.createWorker(function(promise){
      opts.method = "POST";
      var req = https.request(opts, function(res){
        res.setEncoding("utf8");
        var data = "";

        res.on('data', function(chunk){
          data += chunk;
        });

        res.on('end', function(){
          if(res.statusCode == 200 || res.statusCode == 201){
            promise.resolve(data);
          }
          else {
            promise.reject(data);
          }
        });
      });

      req.on('error', function(err){
        promise.reject(err);
      });

      req.write(payload);
      req.end();
    });
  };

  return {
    get: get,
    post: post
  };
});

module.exports = RESTUtils;
