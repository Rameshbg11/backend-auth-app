const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
let dbConn;

// Mongo DB Connection
MongoClient.connect(process.env['MONGO_URL'], { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
    if (err) {
        throw err;
        db.close();
    } else {
        dbConn = db.db('users');
        console.log(`Connected to database : `, db.s.options.dbName);
    }
});


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY);
        const user = await dbConn.collection('auth-users').findOne({ email: data.email });

        // const user = await User.findOne({ _id: data._id, 'tokens.token': token })
        if (!user) {
            throw new Error();
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' })
    }
}

// Sign-up
router.post("/register-user", (req, res, next) => {
    bcrypt.hash(req.body.password, 10).then((hash) => {
        req.body['password'] = hash;
        dbConn.collection('auth-users').insertOne(req.body, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: "User creation failed",
                    error: err
                });
            } else {
                res.status(201).json({
                    message: "User successfully created!",
                    result: res['result']
                });
            }
        });
    });
});

// Sign-in
router.post("/signin", (req, res, next) => {
    let getUser;
    dbConn.collection('auth-users').findOne({ email: req.body.email }).then(user => {
        if (!user) {
            return res.status(401).json({
                message: "Authentication failed"
            });
        }
        getUser = user;
        return bcrypt.compare(req.body.password, user.password);
    }).then(response => {
        if (!response) {
            return res.status(401).json({
                message: "Authentication failed"
            });
        }
        let jwtToken = jwt.sign({
            email: getUser.email,
            userId: getUser._id
        }, process.env.JWT_KEY, {
            expiresIn: "1h"
        });
        res.status(200).json({
            token: jwtToken,
            expiresIn: 3600,
            _id: getUser._id
        });
    }).catch(err => {
        return res.status(401).json({
            message: "Authentication failed"
        });
    });
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});


module.exports = router;