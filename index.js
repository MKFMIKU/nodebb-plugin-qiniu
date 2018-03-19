'use strict'

var fs = require('fs');
var path = require('path');
var nconf = require.main.require('nconf');
var async = require.main.require('async');
var md5 = require.main.require('md5-file/promise');

var db = module.parent.require('./database');

var qiniu = require('qiniu')

var dbSettingsKey = 'nodebb-plugin-qiniu';

// render qiniu config page
function renderAdmin(req, res, next) {
	db.getObject(dbSettingsKey, function(err, settings) {
		if (err) {
			return next(err);
		}
		settings = settings || {};
		var data = {
			accessKey: settings.accessKey,
			secretKey: settings.secretKey,
			bucket: settings.bucket,
			host: settings.host
		};
		res.render('admin/plugins/qiniu', {settings: data, csrf: req.csrfToken()});
	});
}

// save qiniu config
function save(req, res, next) {
	var data = {
		accessKey: req.body.accessKey.trim() || '',
		secretKey: req.body.secretKey.trim() || '',
		bucket: req.body.bucket.trim() || '',
		host: req.body.host.trim() || ''
	};

	db.setObject(dbSettingsKey, data, function(err) {
		if (err) {
			return next(err);
		}

		res.status(200).json({message: 'Settings saved!'});
	});
}

function doUpload(data, setting, callback) {
	var bucket, key;

	qiniu.conf.ACCESS_KEY = setting.accessKey;
	qiniu.conf.SECRET_KEY = setting.secretKey;
	bucket = setting.bucket;
	// key = 'test.png';

	var image = data.image;

	var type = image.url ? 'url' : 'file';
	if (type === 'file' && !image.path) {
		return callback(new Error('invalid image path'));
	}

	key = md5(image.path).then(function (hash) {
		key = hash + path.extname(image.path)
		var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
		var token = putPolicy.token()
		var extra = new qiniu.io.PutExtra();
		qiniu.io.putFile(token, key, image.path, extra, function(err, ret) {
			if(!err) {
				// console.log('ret--->', ret)
				// 上传成功， 处理返回值
				console.log(ret.hash, ret.key, ret.persistentId);
				var url = 'http://' + setting.host + '/' + ret.key
				return callback(null, {
					name: image.name,
					url: url
				});
			} else {
				// console.log('err--->', err)
				// 上传失败， 处理返回代码
				callback(err);
				// throw err;
			}
		});
	}, function (err) {
		// console.log(err)
		callback(err);
		// throw err;
	})
}

module.exports = {
	init: function (params, callback) {
		params.router.get('/admin/plugins/qiniu', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
		params.router.get('/api/admin/plugins/qiniu', params.middleware.applyCSRF, renderAdmin);

		params.router.post('/api/admin/plugins/qiniu/save', params.middleware.applyCSRF, save);

		// params.router.get('/admin/plugins/qiniu/oauth', authorize);

		callback()
	},

	upload: function (data, callback) {
		var settings;
		var image = data.image;

		if (!image) {
			return callback(new Error('invalid image'));
		}

		async.waterfall([
			function(next) {
				db.getObject(dbSettingsKey, next);
			},
			function(_settings, next) {
				settings = _settings || {};

				if (!settings.accessKey) {
					return next(new Error('invalid-imgur-client-id'));
				}

				next()
			},
			function (next) {
				doUpload(data, settings, next);
			}
		], callback);
	},

	admin: {
		menu: function(menu, callback) {
			// console.log('---------------------hehehe-------------')
			menu.plugins.push({
				route: '/plugins/qiniu',
				icon: 'fa-cloud-upload',
				name: 'Qiniu'
			});

			callback(null, menu);
		}
	}

}
