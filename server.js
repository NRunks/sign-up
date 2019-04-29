var http = require('http');
var express = require('express');
const app = express();
var request = require('superagent');
var Promise = require('promise');
var cors = require('cors');
var bodyParser = require('body-parser');
var path = require('path');
var favicon = require('serve-favicon');
var cors = require('cors');
var mongoose = require('mongoose');
mongoose.Promise = require("bluebird");
var newsApiKey = 'd936cc52913a4632a2fe902621b1133d';
const gm = require('gm').subClass({
	imageMagick: true
});;
var fs = require('fs');
const multer = require('multer');

// Multer us used to handle multipart/form-data which is the profile image sent from the browser
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		console.log('\n===================== DESTINATION CALLBACK =======================');
		console.log(req);
		console.log(file);
		cb(null, './TempFiles/Images/Thumbnails/Originals');
	},
	filename: function (req, file, cb) {
		console.log('\n===================== FILENAME CALLBACK =======================');
		console.log(req);
		console.log(file);
		var filename = (file.fieldname + "_" + Date.now() + "_" + file.originalname).replace(/\s/g, '');
		cb(null, filename);
	}
})

var upload = multer({
	storage: storage,
	fileSize: 15 * 1024 * 1024
}).array("imgUploader", 1);

const PROJECT_ID = '[GOOGLE_PROJECT_ID]'
const GoogleStorage = require('@google-cloud/storage');
const gStorage = GoogleStorage({
	projectId: PROJECT_ID,
	keyFilename: '[GOOGLE_JSON_KEY_FILE]'
});
const DEMO_THUMBNAIL_BUCKET = 'getgames';

var Flickr = require("flickrapi"),
	flickrOptions = {
		api_key: "[FLICKR_API_KEY]",
		secret: "[FLICKR_SECRET]"
	};

var cluster = require('cluster');
var workers = process.env.WORKERS || require('os').cpus().length;

/**
 * Since Node.js runs on a single process we use cluster to fork the master process into child processes based on the number of CPUS. 
 * If the program encounters an error in a worker process it can be recovered from the master.
 */
if (cluster.isMaster) {
	console.log('start cluster with %s workers', workers);
	console.log('\r\n');

	for (var i = 0; i < workers; ++i) {
		var worker = cluster.fork().process;
		console.log('worker %s started.', worker.pid);
		console.log('\r\n');
	}

	cluster.on('exit', function (worker) {
		console.log('worker %s died. restart...', worker.process.pid);
		console.log('\r\n');
		cluster.fork();
	});

} else {

	app.use('/', express.static(__dirname + '/'));
	app.use(bodyParser.json()); // for parsing application/json
	app.use(bodyParser.urlencoded({
		extended: true
	})); // for parsing application/x-www-form-urlencoded
	app.use(cors());
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT, PATCH");
		res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
	app.use(favicon(__dirname + '/apps/icons/favicon.ico'));
	const port = 8000;

	var expressServer = http.createServer(app);

	expressServer.listen(port, () => {
		console.log(`Server listening on port ${port}`);
		console.log('\r\n');
	});

	/**
	 * Retrtieves a random assortment of "people" from a 3rd party API endpoint
	 */
	app.get('/get-community-members', (req, res) => {
		console.log('/get-community-members API called!');
		request.get('https://randomuser.me/api/?results=2000')
			.then(function (communityMembers) {
				res.status(200).send(communityMembers.text);
			})
			.catch(function (err) {
				if (err.status) {
					console.log(err.status);
					res.sendStatus(err.status);
				} else {
					console.log(err);
					res.sendStatus(500);
				}
			});
	});

	/**
	 * Retrtieves a random assortment of news headlines from a 3rd party API endpoint
	 */
	app.get('/get-news', (req, res) => {
		console.log('/get-news API called!');
		console.log(newsApiKey);
		request.get('https://newsapi.org/v2/top-headlines?sources=daily-mail,mashable,' +
				'mtv-news,espn,bbc-sport,buzzfeed&apiKey=' + newsApiKey)
			.then(function (news) {
				// res.body, res.headers, res.status
				res.status(200).send(news.text);
			})
			.catch(function (err) {
				// err.message, err.response
				console.log(err.status);
				console.log(err.message);
				res.sendStatus(err.status);
			});
	});

	/**
	 * Retrtieves a random assortment of photos from a 3rd party API endpoint (Flickr)
	 */
	app.get('/get-photos', (req, res) => {
		console.log('/get-photos API called!');
		request.get('https://api.flickr.com/services/rest/' +
				'?method=flickr.photos.search&api_key=' + flickrOptions.api_key +
				'&tags=culture,scenery,geography,animals,buildings,structures,cars&sort=date-take-asc&safe_search=1&' +
				'per_page=100&page=' + Math.floor(Math.random() * 40) + 1 +
				'&format=json&nojsoncallback=1')
			.then(function (photos) {
				res.status(200).send(photos.text);
			})
			.catch(function (err) {
				// err.message, err.response
				console.log(err.status);
				console.log(err.message);
				res.sendStatus(500);
			});
	});

	/**
	 * Retrtieves a random album from a 3rd party API endpoint
	 */
	app.get('/get-album', (req, res) => {
		console.log('/get-album API called!');
		if (req.query && req.query.album) {
			console.log(req.query.album);
			request.get('http://ws.audioscrobbler.com/2.0/?method=album.search&album=' +
					req.query.album + '&api_key=c60b66b6ec70058262bffede01090bcc&format=json')
				.then(function (albumInfo) {
					res.status(200).send(albumInfo.text);
				})
				.catch(function (err) {
					console.log(err);
					res.sendStatus(404);
				});
		} else {
			res.sendStatus(500);
		}
	});

	/**
	 * Retrtieves a random quote from a 3rd party API endpoint
	 */
	app.get('/get-quote', (req, res) => {
		console.log('/get-quote API called!');
		request.get('http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en')
			.then(function (quote) {
				s = quote.text.replace(/\\n/g, "\\n")
					.replace(/\\'/g, "\\'")
					.replace(/\\"/g, '\\"')
					.replace(/\\&/g, "\\&")
					.replace(/\\r/g, "\\r")
					.replace(/\\t/g, "\\t")
					.replace(/\\b/g, "\\b")
					.replace(/\\f/g, "\\f");
				// remove non-printable and other non-valid JSON chars
				s = s.replace(/[\u0000-\u0019]+/g, "");
				res.status(200).send(s);
			})
			.catch(function (err) {
				console.log(err);
				res.status(200).send({
					quoteText: "You know you’re in love when you" +
						" can’t fall asleep because reality is finally better than your dreams.",
					quoteAuthor: "Dr. Seuss"
				});
			});
	});

	/**
	 * Uploads an image sent from the browser. Uses the createDirectories middleware function.
	 */
	app.post('/upload/upload-image', createDirectories, function (req, res) {
		console.log("UPLOAD IMAGE!!")
		upload(req, res, function (err) {
			console.log("Upload!!")
			console.log(req.files)
			if (err) {
				console.log(err)
				res.sendStatus(500) //return res.end("Something went wrong!");
			} else if (!Array.isArray(req.files) || req.files.length == 0) {
				res.sendStatus(403) //return res.end("Something went wrong!");
			} else {
				//return //res.end("File uploaded sucessfully!.");
				resizeThumbnailAndSave(req.files[0].mimetype, req.files[0].filename, res)

			}
		});
	});

	/**
	 * Middleware function to iteratively create necessary directories
	 */
	function createDirectories(req, res, next) {
		if (!isDirSync('./TempFiles')) {
			fs.mkdirSync('./TempFiles');
			fs.mkdirSync('./TempFiles/Images');
			fs.mkdirSync('./TempFiles/Images/Thumbnails');
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Originals');
		} else if (!isDirSync('./TempFiles/Images')) {
			fs.mkdirSync('./TempFiles/Images');
			fs.mkdirSync('./TempFiles/Images/Thumbnails');
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Originals');
		} else if (!isDirSync('./TempFiles/Images/Thumbnails')) {
			fs.mkdirSync('./TempFiles/Images/Thumbnails');
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Originals');
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Cropped');
		} else if (!isDirSync('./TempFiles/Images/Thumbnails/Originals')) {
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Originals');
		} else if (!isDirSync('./TempFiles/Images/Thumbnails/Cropped')) {
			fs.mkdirSync('./TempFiles/Images/Thumbnails/Cropped');
		}
		next();
	}


	/**
	 * Crops a thumbnail to correct size and aspect ratio then places the original and result in the respective directories
	 * on the local server machine and also on the google cloud in a gcloud storage bucket
	 */
	function resizeThumbnailAndSave(mimeType, filename, res) {
		console.log('The image handle is %s:', filename);
		var extension = mimeType.split('/')[1]
		console.log('Mimetype of file is %s and its extension is %s.', mimeType, extension);
		var width = 375,
			height = 400;

		var filePath1 = __dirname + '/TempFiles/Images/Thumbnails/Originals/' + filename;
		console.log('the file path for the original thumbnail is %s', filePath1);

		console.log(__dirname)

		var filePath2 = __dirname + '/TempFiles/Images/Thumbnails/Cropped/' + filename;
		console.log('the file path for the cropped file is %s', filePath2);


		gm(filePath1).resize(null, 400) // <---- take filepath1 resize it then copy it to filepath2
			.gravity('Center') // Move the starting point to the center of the image.
			.crop(width, height)
			.write(filePath2, function (err) {
				if (err) {
					console.log(err);
				} else {
					gStorage  
						.bucket(DEMO_THUMBNAIL_BUCKET)
						.upload(filePath1, {
							destination: '/originals/' + filename,
							public: true
						})
						.then(function () {
							console.log('%s uploaded to bucket %s.', filePath1, DEMO_THUMBNAIL_BUCKET + '/originals/');
							gStorage
								.bucket(DEMO_THUMBNAIL_BUCKET)
								.upload(filePath2, {
									destination: '/cropped/' + filename,
									public: true
								})
								.then(function () {
									console.log('%s uploaded to bucket %s.', filePath2, DEMO_THUMBNAIL_BUCKET + '/cropped/');
									var sizeOf = Promise.denodeify(require('image-size'));
									sizeOf(filePath1).then(function (originalDimensions) {
										sizeOf(filePath2).then(function (croppedDimensions) {
											console.log('original dimensions are: %', originalDimensions);
											console.log('cropped dimensions are: %', croppedDimensions);
											res.statusMessage = 'https://storage.googleapis.com/' + DEMO_THUMBNAIL_BUCKET + '/cropped/' + filename;
											res.status(200).end();
											console.log(res)
										}, function (err) {
											console.log('Error retrieving cropped image dimensions for %s', filePath2);
											res.statusMessage = 'https://storage.googleapis.com/' + DEMO_THUMBNAIL_BUCKET + '/cropped/' + filename;
											res.status(200).end();
										});
									}, function (err) {
										console.log('Error retrieving original image dimensions for %s', filePath1);
										res.statusMessage = 'https://storage.googleapis.com/' + DEMO_THUMBNAIL_BUCKET + '/cropped/' + filename;
										res.status(200).end();
									});
								})
								.catch(function (err) {
									console.error('ERROR:', err);
									res.sendStatus(500);
								});
						})
						.catch(function (err) {
							console.error('ERROR:', err);
							res.sendStatus(500);
						});
				}
			});
	}

	/**
	 * Syncronyously confirms if given path is a directory
	 * @param {*} aPath Path to directory
	 */
	function isDirSync(aPath) {
		try {
			return fs.statSync(aPath).isDirectory();
		} catch (e) {
			if (e.code === 'ENOENT') {
				return false;
			} else {
				throw e;
			}
		}
	}

	//Options for connection to mongoDB
	var serverOptions = {
		'auto_reconnect': true,
		'reconnectTries': Number.MAX_VALUE,
		'poolSize': 5
	};


	var connection = mongoose.createConnection("[PATH_TO_MONGODB_DATABASE]", serverOptions);

	connection.on('error', console.error.bind(console, 'error connecting with mongodb database:'));

	connection.once('open', function () {
		console.log('connected to mongodb database');
	});

	connection.on('disconnected', function () {
		//Reconnect on timeout
		connection = mongoose.createConnection("mongodb+srv://Nardo:AX0QRwZhEGVAEPVG@portfoliocluster-vipfe.mongodb.net/SignUp", serverOptions);
	});

	var CountrySchema = new mongoose.Schema({
		name: String,
		code: String
	});

	var ProfileSchema = new mongoose.Schema({
		firstname: String,
		lastname: String,
		email: String,
		profession: String,
		DOB: Date,
		thumbnail: String,
		city: String,
		state: String,
		country: CountrySchema,
		phone: String,
		gender: String,
		member_since: Date,
		last_online: Date,
		isSignUpComplete: Boolean,
	});

	var Profile = connection.model('profile', ProfileSchema);

	/**
	 * Checks if profile with given e-mail exists
	 */
	app.post('/signup-profile-api/check-availability', function (req, res) {
		console.log('\n/signup-profile-api/check-availability API endpoint called!!!');
		console.log(req.body);
		if (req.body && req.body.email) {
			Profile.findOne({
				email: req.body.email
			}, function (err, profile) {
				if (err) {
					console.log(err);
					res.status(500).send({
						message: "Something went wrong."
					});
				} else if (profile && profile.isSignUpComplete) {
					console.log("successful");
					res.status(302).send({
						profile
					});
				} else {
					console.log('No profile matching ' + req.body.email + ' found!');
					res.sendStatus(200);
				}
			});
		} else {
			res.status(500).send({
				message: "Must provide a valid e-mail."
			});
		}
	});

	/**
	 * Checks whether given credentials match the credentials of an existing Profile
	 */
	app.post('/signup-profile-api/check-credentials', function (req, res) {
		console.log('\n/signup-profile-api/check-credentials API endpoint called!!!');
		console.log(req.body);
		if (req.body && req.body.email) {
			Profile.findOne({
				email: req.body.email
			}, function (err, profile) {
				if (err) {
					console.log(err);
					res.status(500).send({
						message: "Something went wrong."
					});
				} else if (!profile) {
					res.status(403).send({
						message: "Your password is incorrect."
					});
				} else {
					console.log('The profile matching ' + req.body.email + ' is found!');
					res.status(200).send(profile);
				}
			});
		} else {
			res.status(500).send({
				message: "Must provide a valid e-mail."
			});
		}
	});

	/**
	 * Adds a profile to database
	 */
	app.post('/signup-profile-api/register-profile', function (req, res) {
		console.log('\n/signup-profile-api/register-profile API endpoint called!!!');
		console.log(req.body);
		if (req.body && req.body.email) {
			Profile.create({
				firstname: null,
				lastname: null,
				email: req.body.email,
				profession: null,
				DOB: null,
				thumbnail: null,
				city: null,
				state: null,
				country: null,
				gender: null,
				phone: null,
				isSignUpComplete: false
			}, function (err, profile) {
				if (err) {
					res.status(500).send({
						message: "Something went wrong."
					});
					console.log(err);
				} else {
					res.status(200).send({
						profile: profile
					});
				}
			});
		} else {
			res.status(500).send({
				message: "Must provide a valid e-mail."
			});
		}
	});

	/**
	 * Used during signup to complete registration by updating user profile
	 */
	app.patch('/signup-profile-api/save-profile', function (req, res) {

		console.log('\nPATCH save-profile API endpoint called!!!');
		console.log(req.body);
		if (req.body) {
			var countryData = {
				name: req.body.profile.country.name,
				countryCode: req.body.profile.country.code
			}

			console.log('^^^^^^^^^^^^^^^^^^^ req.body')
			if (req.body.profile.thumbnail) {
				console.log(req.body.profile.thumbnail);
				console.log('^^^^^^^^^^^^^^^^^^^ req.body.thumbnail')
			}

			Profile.findByIdAndUpdate(req.body.uid, {
				"$set": {
					"firstname": req.body.profile.firstname,
					"lastname": req.body.profile.lastname,
					"profession": req.body.profile.profession,
					"DOB": req.body.profile.DOB,
					"city": req.body.profile.city,
					"state": req.body.profile.state,
					"country": countryData,
					"phone": req.body.profile.phone,
					"gender": req.body.profile.gender,
					"thumbnail": req.body.profile.thumbnail,
					"isSignUpComplete": true
				}
			}, {
				new: true
			}, function (err, doc) {
				// doc contains the modified document
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					console.log('Update successful.')
					res.status(200).json({
						updated_profile: doc
					});
				}
			})
		} else {
			res.sendStatus(403);
		}
	});

	/**
	 * Retrieves a user profile
	 */
	app.get('/signup-profile-api/get-profile', function (req, res) {

		console.log('get-profile API endpoint called!!!');
		console.log(req.query);
		Profile.findOne({
			email: req.query.email
		}, function (err, profile) {
			if (err) {
				console.log(err);
				res.status(500).send(null);
			} else if (!profile) {
				console.log('No profile matching ' + req.query.email + ' found!');
				res.status(404).send([]);
			} else {
				res.status(200).send(profile);
			}
		});
	});

	/**
	 * This is a single page app so all routes should point to index.html
	 */
	app.get('/*', (req, res) => {
		res.sendFile(__dirname + '/apps/index.html');
	})

	/**
	 * Deletes a profile with given email
	 */
	app.delete('/signup-profile-api/delete-profile', function (req, res) {
		console.log(req.query);
		if (req.query && req.query.email) {
			Profile.deleteOne({
				email: req.query.email
			}, function (err, profile) {
				if (err) {
					console.log(err);
					res.sendStatus(500);
				} else {
					console.log(profile);
					res.sendStatus(200);
				}
			});
		} else {
			res.sendStatus(403);
		}
	});
}