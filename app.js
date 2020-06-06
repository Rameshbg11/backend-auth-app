const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require('cors');
const bodyParser = require('body-parser');
const router = express.Router();
// Express APIs
const api = require('./routes/routes');
require('dotenv').config();


// Express settings
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cors());

// Serve static resources
app.use('/public', express.static('public'));

app.use('/api', api);


// Define PORT
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('Port Running : ' + port)
});


// Express error handling
app.use((req, res, next) => {
    setImmediate(() => {
        next(new Error('Something went wrong'));
    });
});

app.use(function (err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
});

