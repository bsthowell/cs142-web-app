"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create a schema
var userSchema = new mongoose.Schema({
    first_name: { type: String, 				// First name of the user.
    				required: [true, 'Error: first name not specified']
    				},

    last_name: { type: String, 			  // Last name of the user.
    				required: [true, 'Error: last name not specified']
    				},

    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    login_name: String,
    password: { type: String, 			  // Last name of the user.
    				required: [true, 'Error: password not specified']
                }
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
