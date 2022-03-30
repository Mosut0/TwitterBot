
const Twitter = require('twitter');
const dotenv = require("dotenv")
dotenv.config()

// auth methods
//Replace XXXXXXX in .env with your own keys.
const auth = () => {
    let secret = {
        consumer_key: process.env.API_KEY,
        consumer_secret: process.env.SECRET_KEY,
        access_token_key: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
    }

    var client = new Twitter(secret);
    return client;
}

module.exports = { auth };