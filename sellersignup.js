const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// seller database
const sellersignupSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    password: {
        type:String,
        required:true
    },
    cpassword: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true
    },
    phone: {
        type:Number,
        required:true,
        unique:true
    },
    pro: {
        type:String,
        required:true
    },
    tokens: [{
        token: {
            type:String,
            required:true
        }
    }]
})


sellersignupSchema.methods.generateAuthToken = async function(){
    try{
        const token = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY_);
        this.tokens = this.tokens.concat({token});
        await this.save();
        // console.log(token);
        return token;
    }catch(error){
        res.send("the error part");
        console.log("the error part");
    }
}

sellersignupSchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
        this.cpassword = await bcrypt.hash(this.password, 10);
    }
    next();
})

const sellerSignup = new mongoose.model('sellerSignup', sellersignupSchema);

module.exports = sellerSignup;