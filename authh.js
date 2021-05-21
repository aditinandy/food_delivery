const jwt = require('jsonwebtoken');
const sellerSignup = require('./sellersignup');

const authh = async (req, res, next) => {
    try{
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY_);
        console.log(verifyUser);
        const selleruser = await sellerSignup.findOne({_id:verifyUser._id});

        req.token = token;
        req.selleruser = selleruser;

        next();
    }catch(error){
        res.status(401).send(error);
    }
}

module.exports = authh;