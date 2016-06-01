var express = require('express'),
	router = express.Router(),
	_ = require('lodash'),
	helper = require('../lib/helper'),
	Promise = require('bluebird');

var auth = helper.auth.middleware;

router.post('/get-s3', auth, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	var config = req.config;

	return res.status(200).send({ok: true, data: config.s3});
})

router.post('/notify', auth, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	var config = req.config;

	var r = req.r;

	var message = req.body;
	return helper.notification.sendAlert(r, message.userId, message.level, message.msg)
	.then(function() {
		return res.status(200).send({ok: true});
	})
	.catch(function(e) {
		console.dir(e);
		return res.send({ok: false, message: e});
	})

})

router.post('/store-tx', auth, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	var config = req.config;

	var r = req.r;
	var messageQ = req.Q;

	var message = req.body;

	return messageQ.add({
		type: 'saveTX',
		payload: {
			message: message
		}
	}, config.Qconfig)
	.then(function() {
		return res.status(200).send({ok: true});
	})
	.catch(function(e) {
		console.dir(e);
		return res.send({ok: false, message: e});
	})

});

router.post('/check-recipient', auth, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	var config = req.config;
	var r = req.r;

	var email = req.body.to || null;
	if (!!!email) {
		return res.status(200).send({ok: false});
	}
	var account = email.substring(0, email.lastIndexOf("@")).toLowerCase();
	var domain = email.substring(email.lastIndexOf("@") +1).toLowerCase();

	return checkDomain(r, domain).then(function(domainResult) {
		return checkAccount(r, account, domainResult.domainId).then(function(accountResult) {
			return res.status(200).send({ok: true});
		})
	})
	.catch(function(e) {
		return res.status(200).send({ok: false});
	})
});

router.post('/store', auth, function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');

	var config = req.config;

	var r = req.r;
	var messageQ = req.Q;

	var message = req.body;

	var envelopeTo = message.envelopeTo[0];
	var recipient = null;
	if (typeof envelopeTo !== 'undefined') {
		if (envelopeTo.hasOwnProperty('address')) {
			recipient = envelopeTo.address.toLowerCase();
		}
	}

	if (!!!recipient) {
		return res.send({ok: false, message: 'No envelopeTo.'});
	}

	// Delete ourselves
	for (key in message.to) {
		if (message.to[key].address == recipient) {
			delete message.to[key];
		}
	}

	var recipientAccount = recipient.substring(0, recipient.lastIndexOf("@")).toLowerCase();
	var recipientDomain = recipient.substring(recipient.lastIndexOf("@") +1).toLowerCase();

	return checkDomain(r, recipientDomain).then(function(domainResult) {
		var domainId = domainResult.domainId;
		return checkAccount(r, recipientAccount, domainId).then(function(accountResult) {
			return messageQ.add({
				type: 'saveRX',
				payload: {
					accountId: accountResult.accountId,
					userId: accountResult.userId,
					myAddress: accountResult.account + '@' + domainResult.domain,
					message: message
				}
			}, config.Qconfig)
			.then(function() {
				return res.send({ok: true});
			});
		})
	})
	.catch(function(e) {
		console.dir(e);
		return res.send({ok: false, message: e});
	})
});

var checkDomain = Promise.method(function (r, domain) {
	return r
	.table('domains', {readMode: 'majority'})
	.getAll(domain, {index: 'domain'})
	.slice(0, 1)
	.run(r.conn)
	.then(function(cursor) {
		return cursor.toArray();
	}).then(function(result) {
		if (result.length === 0) {
			// Maybe it is one of the alias?
			return r
			.table('domains', {readMode: 'majority'})
			.getAll(domain, {index: 'alias'})
			.slice(0, 1)
			.run(r.conn)
			.then(function(cursor) {
				return cursor.toArray();
			}).then(function(result) {
				if (result.length === 0) {
					throw new Error('Domain does not exist: ' + domain);
				}else{
					return result[0];
				}
			});
		}else{
			return result[0];
		}
	})
})

var checkAccount = Promise.method(function (r, account, domainId) {
	return r
	.table('accounts', {readMode: 'majority'})
	.getAll([account, domainId], {index: 'accountDomainId'})
	.slice(0, 1)
	.run(r.conn)
	.then(function(cursor) {
		return cursor.toArray();
	}).then(function(result) {
		if (result.length === 0) {
			throw new Error('Account does not exist: ' + account);
		}else{
			return result[0];
		}
	})
})

module.exports = router;
