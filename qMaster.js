var	Queue = require('rethinkdb-job-queue'),
	config = require('./config'),
    discover = require('./lib/discover'),
	log;

discover().then(function(ip) {
    if (ip !== null) config.rethinkdb.host = ip;
    var messageQ = new Queue(config.rethinkdb, {
        name: 'jobQueue',
        // For the sake of review, we will remove finished jobs after 24 hours
        removeFinishedJobs: 24 * 60 * 60 * 1000,
        // This is a master queue
        masterInterval: (15 * 60 * 1000) + (10 * 1000)
    });

    if (!!config.graylog) {
    	log = require('bunyan').createLogger({
    		name: 'API-Queue-Master',
    		streams: [{
    			type: 'raw',
    			stream: require('gelf-stream').forBunyan(config.graylog.host, config.graylog.port)
    		}]
    	});
    }else{
    	log = require('bunyan').createLogger({
    		name: 'API-Queue-Master'
    	});
    }

    messageQ.on('error', function(e) {
        log.error({ message: 'Error thrown from Queue', error: '[' + e.name + '] ' + e.message, stack: e.stack })
        process.exit(1)
    })

    log.info('Process ' + process.pid + ' is running as Queue Master')
})
