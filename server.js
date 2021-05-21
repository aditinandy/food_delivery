require('dotenv').config();
const express = require("express");
require("./conn");
const Signup = require("./signup");
const sellerSignup = require('./sellersignup');
const UploadModel = require('./schema');
var hbs = require('hbs');
const app = express();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const auth = require("./auth");
const authh = require("./authh");
const store = require('./multer');
const fs = require('fs');

const passport = require("passport")
const bodyParser = require("body-parser")
const LocalStrategy = require("passport-local")
const passportLocalMongoose = require("passport-local-mongoose")

const { json } = require('express');
const { log } = require('console');

// const users = [];
const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "/public");
const template_path = path.join(__dirname, "/templetes/views");
const partials_path = path.join(__dirname, "/templetes/partials");

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended : false }));
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.use(express.static(static_path));


// app.use(require("express-session")({
//     secret: "Rusty is a dog",
//     resave: false,
//     saveUninitialized: false
// }));
// app.use(passport.initialize());
// app.use(passport.session());
  
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

app.get('/upload', async (req, res) => {
    const all_images = await UploadModel.find()
    res.render('img.hbs', {images: "all_images"});
})

app.post('/upload',store.array('images', 1000000), (req, res) => {
    const files = req.files;

    if(!files){
        const error = new Error('Please choose files');
        error.httpStatusCode = 400;
        return next(error)
    }

    // convert images into base64 encoding
    let imgArray = files.map((file) => {
        let img = fs.readFileSync(file.path)

        return encode_image = img.toString('base64')
    })

    let result = imgArray.map((src, index) => {

        // create object to store data in the collection
        let finalImg = {
            filename : files[index].originalname,
            contentType : files[index].mimetype,
            imageBase64 : src
        }

        let newUpload = new UploadModel(finalImg);

        return newUpload
                .save()
                .then(() => {
                    return { msg : `${files[index].originalname} Uploaded Successfully...!`}
                })
                .catch(error =>{
                    if(error){
                        if(error.name === 'MongoError' && error.code === 11000){
                            return Promise.reject({ error : `Duplicate ${files[index].originalname}. File Already exists! `});
                        }
                        return Promise.reject({ error : error.message || `Cannot Upload ${files[index].originalname} Something Missing!`})
                    }
                })
    });

    Promise.all(result)
        .then( msg => {
                // res.json(msg);
            res.redirect('/upload')
        })
        .catch(err =>{
            res.json(err);
        })
})

app.get('/signup', (req, res) => {
    res.render('signup.hbs');
})

app.get('/signin', (req, res) => {
    res.render('signin.hbs');
})

app.get('/sellersignup', (req, res) => {
    res.render('sellersignup.hbs');
})

app.get('/sellersignin', (req, res) => {
    res.render('sellersignin.hbs');
})

app.get('/home', (req, res) => {
    res.render('index.hbs');
})

app.get('/seller', authh, (req, res) => {
    res.render('seller.hbs');
})

app.get('/User', auth, (req, res) => {
    // console.log(`User HomePage ${req.cookies.jwt}`);
    res.render('user.hbs');
})

app.get('/sellerpro', authh, (req, res) => {
    // console.log(`User HomePage ${req.cookies.jwt}`);
    res.render('userpro.hbs');
})

app.get("/userpro", auth, function (req, res) {
    res.render('userpro.hbs');
})

app.get("/logout", auth, async(req, res) => {
    try{
        console.log(req.user);
        // logout from one device
        // req.user.tokens = req.user.tokens.filter((currentElement) => {
        //     return currentElement.token !== req.token;
        // })

        // logout from all device 
        req.user.tokens = [];

        res.clearCookie("jwt");
        console.log("log-out");
        await req.user.save();
        res.redirect('/signin');
    }catch(error){
        res.status(500).send(error);
    }
})

app.get("/signout", authh, async(req, res) => {
    try{
        console.log(req.selleruser);
        // logout from one device
        // req.user.tokens = req.user.tokens.filter((currentElement) => {
        //     return currentElement.token !== req.token;
        // })

        // logout from all device 
        req.selleruser.tokens = [];

        res.clearCookie("jwt");
        console.log("log-out");
        await req.selleruser.save();
        res.redirect('/sellersignin');
    }catch(error){
        res.status(500).send(error);
    }
})

app.post('/signup', async (req, res) => {
    try{
        // const hashedPassword = await bcrypt.hash(req.body.password, 10)
        // users.push({
        //     id: Date.now().toString(),
        //     name: req.body.name,
        //     email: req.body.email,
        //     password: hashedPassword,
        //     dob: req.body.dob,
        //     phone: req.body.phone
        // })
        const password = req.body.password;
        const cpassword = req.body.cpassword;

        if(password === cpassword){
            const signupUser = new Signup ({
                name : req.body.name,
                password : password,
                cpassword: cpassword,
                email : req.body.email,
                phone : req.body.phone,
                dob : req.body.dob
            })
            // console.log("the success part" + signupUser);
            const token = await signupUser.generateAuthToken();
            // console.log("the token part" + token);

            res.cookie("jwt", token)
            //     // expires: new Date(Date.now() + 4*3600*1000),
            //     httpOnly:true
            // });

            const signedup = await signupUser.save();
            res.redirect('/User');
        }else{
            res.send("password not match");
        }
        
    }catch(e){
        res.status(400).send(e);
    }
    // console.log(users)
})

app.post('/sellersignup', async (req, res) => {
    try{
        const password = req.body.password;
        const cpassword = req.body.cpassword;

        if(password === cpassword){
            const signupSeller = new sellerSignup ({
                name : req.body.name,
                password : password,
                cpassword: cpassword,
                email : req.body.email,
                phone : req.body.phone,
                pro : req.body.pro
            })
            // console.log("the success part" + signupUser);
            const token = await signupSeller.generateAuthToken();
            // console.log("the token part" + token);

            res.cookie("jwt", token, {
                expires: new Date(Date.now() + (4*3600*1000)),
                httpOnly:true
            });

            const usersignedup = await signupSeller.save();
            res.redirect('/seller');
        }else{
            res.send("password not match");
        }
    }catch{
        res.redirect('/sellersignin');
    }
})

app.post('/signin', async(req, res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        
        const useremail = await Signup.findOne({email:email});
        const isMatch = await bcrypt.compare(password, useremail.password);

        const token = await useremail.generateAuthToken();
        // console.log("the token part" + token);

        res.cookie("jwt", token)
        //     // expires: new Date(Date.now() + 4*3600*1000),
        //     httpOnly:true
        //     // secure:true
        // });
        // console.log(cookie);

        // res.send(useremail.password) 
        // console.log(useremail);
        if(isMatch){
            res.redirect('/User');
        }else{
            res.send("password incoorect");
        }

    }catch{
        res.redirect('/signup');
    }
})

app.post('/sellersignin', async(req, res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        
        const useremail = await sellerSignup.findOne({email:email});
        const isMatch = await bcrypt.compare(password, useremail.password);

        const token = await useremail.generateAuthToken();
        // console.log("the token part" + token);

         res.cookie("jwt", token, { 
            expires: new Date(Date.now() + (4*3600*1000)),
            httpOnly:true
        //     // secure:true
        });
        // console.log(cookie);

        // res.send(useremail.password) 
        // console.log(useremail);
        if(isMatch){
            res.redirect('/seller');
        }else{
            res.send("password incoorect");
        }

    }catch{
        res.redirect('/sellersignup');
    }
})

app.listen(port, () => {
    console.log(`listening ${port}`);
})