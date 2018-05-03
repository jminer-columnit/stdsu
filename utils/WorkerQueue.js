const Queue = (function(){
  var workers = [];
  var active = 0;
  var queuePromise = new WorkerPromise();
  var totalWorkers;

  const createWorker = function(work){
    var promise = new WorkerPromise();
    var worker = new Worker(work, promise);
    workers.push(worker);

    return worker.promise;
  };

  const runNext = function(){
    if(workers.length > 0){
      var worker = workers.splice(0,1)[0];
      worker.promise.finally(function(){
        active--;
        runNext();
      })
      worker.doWork();
      active++;
    }
    else if(active == 0){
      queuePromise.resolve(totalWorkers);
    }
  };

  const run = function(){
    totalWorkers = workers.length;
    while(active < 10 && workers.length > 0){
      runNext();
    }

    return queuePromise;
  };

  return {
    createWorker: createWorker,
    run: run
  };
});

const WorkerPromise = (function(){
  var thens = [];
  var fails = [];
  var finals = [];

  var p = {};

  const doFinals = function(){
    for(var i=0;i<finals.length;i++){
      finals[i].apply(null, arguments);
    }
  }

  p.then = function(fnc){
    if(typeof fnc == "function")
      thens.push(fnc);

    return p;
  };

  p.fail = function(fnc){
    if(typeof fnc == "function")
      fails.push(fnc);

    return p;
  };

  p.finally = function(fnc){
    if(typeof fnc == "function")
      finals.push(fnc);

    return p;
  }

  p.resolve = function(){
    for(var i=0;i<thens.length;i++){
      thens[i].apply(null, arguments);
    }

    doFinals.apply(null, arguments);
  };

  p.reject = function(){
    for(var i=0;i<fails.length;i++){
      fails[i].apply(null, arguments);
    }

    doFinals.apply(null, arguments);
  };

  return p;
});

const Worker = (function(work, promise){
  const doWork = function(){
    work(promise);
  };

  return {
    doWork: doWork,
    promise: promise
  };
});

module.exports = Queue();
