"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("fs");
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

// XXX - Your submission should work without this line
//var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});



app.post('/admin/login', function(request, response) {
    User.findOne({login_name: request.body.login_name}, function(err, user) {
        if (user !== null) {
            if(request.body.password === user.password){
                request.session.user_id = user._id;
                response.status(200).send(user);
            } else {
                response.status(400).send("Invalid password");
            }
        } else {
            response.status(400).send(request.body.login_name + " is not a valid account");
        }
    });
});

app.post('/admin/logout', function(request, response) {
    if (request.session.user_id) {
        request.session.destroy(function(err) {} );
        response.status(200).send();
    } else {
        response.status(400).send("No user currently logged in");
    }
});

app.post('/commentsOfPhoto/:photo_id', function(request, response) {
    let photo_id = request.params.photo_id;
    let user_id = request.session.user_id;
    let comment = request.body.comment;

    if (!comment) {
        console.log("Empty comment");
        response.status(400).send("Empty comment");
    } else {
        Photo.findOne({_id: photo_id}, function(err, photo) {
            if (!err) {
                photo.comments.push({comment: comment, user_id: user_id});
                photo.save();
                response.status(200).send();
            } else {
                console.log("Photo does not exist");
                response.status(400).send("Photo does not exist");
            }
        });
    }

});

app.post('/photos/new', function(request, response) {
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("no file");
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        if(request.file.fieldname !== "uploadedphoto") {
            response.status(400).send("no file");
            return;
        }
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // if (request.body.restricted) {
        //     let trusted_users = request.body.trusted_users.split(',');
        // } else {
        //     let trusted_users = [];
        // }

        let trusted_users = request.body.trusted_users.split(',');
        let restricted = (request.body.restricted === "true");

        console.log(request.body.restricted);

        console.log('typeof(trusted_users) ', typeof(trusted_users));
        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            let pendingPhoto = {
                file_name: filename, 
                user_id: request.session.user_id,
                comments: [],
                restricted: restricted
            };
            if (restricted) {
                console.log("is this false? " + request.body.restricted);
                pendingPhoto.trusted_users = trusted_users;
            }
            Photo.create(pendingPhoto, function(err, newPhoto) {
                if (err) {
                    console.log(err);
                    response.status(400).send("Error uploading photo");
                }
                response.status(200).send();
            });
        });
    });
});

app.post('/user', function(request, response) {
    if (!request.body.login_name) {
        console.log("no login name specified");
        response.status(400).send("no login name specified");
        return;
    }

    User.findOne({login_name: request.body.login_name}, function(err, user) {
        if (user !== null) {
            console.log("login name already exists");
            response.status(400).send("login name already exists");
            return;
        }

        let pendingUser = {
            login_name: request.body.login_name,
            password: request.body.password,
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            location: request.body.location,
            description: request.body.description,
            occupation: request.body.occupation
        };

        User.create(pendingUser, function(err, newUser) {
            if (err) {
                let errors = err.errors;
                let first_error = errors[Object.keys(errors)[0]];
                console.log(first_error.message);
                response.status(400).send(first_error.message);
                return;
            }
            console.log(newUser._id);
            request.session.user_id = newUser._id;
            response.status(200).send(newUser);
        });
    });
});

app.post('/likePhoto', function(request, response) {
    console.log("like photo");
    let photo_id = request.body.photo_id;
    let user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send("error liking photo");
            return;
        }
        if (photo.likes_ids.indexOf(user_id) >= 0) {
            response.status(400).send("photo already liked");
            return;
        }
        photo.num_likes += 1;
        photo.likes_ids.push(user_id);
        photo.save();
        response.status(200).send();
    });
});

app.post('/unlikePhoto', function(request, response) {
    console.log("unlike photo");
    let photo_id = request.body.photo_id;
    let user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send("error liking photo");
            return;
        }
        if (photo.likes_ids.indexOf(user_id) < 0) {
            response.status(400).send("photo not yet liked");
            return;
        }
        photo.num_likes -= 1;
        let index = photo.likes_ids.indexOf(user_id);
        photo.likes_ids.splice(index, 1);
        photo.save();
        response.status(200).send();
    });
});

app.post('/deleteComment', function(request, response) {
    console.log('delete comment');
    let photo_id = request.body.photo_id;
    let comment_id = request.body.comment_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send("error deleting comments");
        }

        if (!photo) {
            response.status(400).send("photo not found ");
        }
        let commentToDelete;
        photo.comments.forEach(function callback(currentComment) {
            if (currentComment._id.equals(comment_id)) {
                commentToDelete = currentComment;
            }
        });

        if (!commentToDelete) {
            response.status(400).send("comment not found");
            return;
        }

        if(!commentToDelete.user_id.equals(request.session.user_id)) {
            response.status(400).send("comment's author not logged in");
            return;
        }
        photo.comments.splice(photo.comments.indexOf(commentToDelete), 1);
        photo.save();
        response.status(200).send();
    });
});

app.post('/deletePhoto', function(request, response) {
    console.log('delete photo');
    let photo_id = request.body.photo_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send("error deleting photo");
            return;
        }

        if (!photo) {
            response.status(400).send("photo not found");
            return;
        }

        if(!photo.user_id.equals(request.session.user_id)) {
            response.status(400).send("photo's author not logged in");
            return;
        }
        Photo.remove({_id: photo_id}, function(err) {});
        response.status(200).send();
    });
});

app.post('/deleteUser', function(request, response) {
    let user_id = request.body.user_id;
    console.log("delete user " + user_id);

    if (user_id !== request.session.user_id) {
        response.status(400).send('user not logged in');
        return;
    }

    User.findOne({_id: user_id}, function(err, user) {
        if (err) {
            response.status(400).send("error deleting user");
            return;
        }

        if(!user) {
            response.status(400).send("user not found");
        }

        User.remove({_id: user_id}, function(err) {});
        Photo.remove({user_id: user_id}, function(err) {});

        Photo.find(function(err, photos) {
            if (err) {
                response.status(400).error("error deleting user's comments");
                return;
            }

            photos.forEach(function(photo) {
                let like_index = photo.likes_ids.indexOf(user_id);
                if (like_index >= 0) {
                    photo.likes_ids.splice(like_index, 1);
                    photo.num_likes -= 1;
                }
                let comments_copy = photo.comments.slice();
                comments_copy.forEach(function (comment) {
                    if (comment.user_id.equals(user_id)) {
                        photo.comments.splice(photo.comments.indexOf(comment), 1);
                    }
                });
                photo.save();
            });
        });
        response.status(200).send();
    });
});


/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);
    if (request.session.user_id === undefined) {
        response.status(401).send();
        return;
    }

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 * projected to (_id, first_name, last_name)
 */
app.get('/user/list', function (request, response) {
if (request.session.user_id === undefined) {
        response.status(401).send();
        return;
    }
    let doneCallback = function(err, users) {
       response.status(200).send(users); 
    };
    let query = User.find({});
    query.select("_id first_name last_name").exec(doneCallback);
    // response.status(200).send(cs142models.userListModel());
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
if (request.session.user_id === undefined) {
        response.status(401).send();
        return;
    }

    var id = request.params.id;
    //var user = cs142models.userModel(id);
    let user;
    let doneCallback = function(err, db_user) {
        user = db_user;
        if (user === undefined) {
            console.log('User with _id:' + id + ' not found.');
            response.status(400).send('Not found');
            return;
        }
        response.json(user);
        // response.status(200).send(user);
    };
    let query = User.findOne({_id: id});
    query.select("_id first_name last_name location description occupation").exec(doneCallback);
    
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {

if (request.session.user_id === undefined) {
        response.status(401).send();
        return;
    }

    var id = request.params.id;
    console.log(id);
    let photos;
    // var photos = cs142models.photoOfUserModel(id);
    let doneCallback = function(err, db_photos) {
        photos = db_photos;
        if (photos === undefined) {
            console.log('Photos for user with _id:' + id + ' not found.');
            response.status(400).send('Not found');
            return;
        }
        let photos_copy = JSON.parse(JSON.stringify(photos));
        photos_copy = photos_copy.filter(function(photo) {
            return (!photo.restricted | (photo.trusted_users.indexOf(request.session.user_id) >= 0));
        });
        let processPhoto = function(photo, photo_index, photo_callback) {
            let processComments = function(comment, comment_index, comment_callback) {
                // add user into photos_copy comment from user_id as ["user"]
                // user exists 
                let doneCallback = function(err, db_user) {
                    photos_copy[photo_index].comments[comment_index].user = db_user;
                    //delete user_id
                    Object.keys(comment).slice().forEach(function(key) {
                        if (!([ "comment", "date_time", "_id", "user"].includes(key))) {
                            delete photos_copy[photo_index].comments[comment_index][key];
                        }

                    });
                    comment_callback();
                };
                let comment_id = photos_copy[photo_index].comments[comment_index].user_id;
                let query = User.findOne({_id: comment_id});
                query.select("_id first_name last_name").exec(doneCallback);
            };
            let allCommentsDone = function(error) {
                photo_callback(error);
            };
            async.eachOf(photo.comments, processComments, allCommentsDone);
        };
        let allPhotosDone = function(error) {
            response.status(200).send(photos_copy);
        };
        async.eachOf(photos_copy, processPhoto, allPhotosDone);
    };
    let query = Photo.find({user_id: id});
    query.select("_id user_id comments file_name date_time num_likes likes_ids restricted trusted_users").exec(doneCallback);
});


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


