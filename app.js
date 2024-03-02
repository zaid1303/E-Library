require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const fs=require('fs');
const { title } = require('process');

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL);

const userSchema = new mongoose.Schema({
    email: String,
    Password: String
});

const adminSchema = {
    email: String,
    Password: String
};

const bookSchema = {
    title: String,
    author: String,
    avatar: String,
    file: String
}

const Books = mongoose.model("Books", bookSchema);

const Admins = mongoose.model("Admins", bookSchema);

userSchema.plugin(passportLocalMongoose);

const Users = new mongoose.model("Users", userSchema);

passport.use(Users.createStrategy());

passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'bookimage') {
            cb(null, './public/uploads/bookcover')
        }
        else if (file.fieldname === 'bookfile') {
            cb(null, './public/uploads/bookfile')
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }

})
var upload = multer({
    storage: storage
    // fileFilter:function(req,file,callback){
    //     if(file.fieldname==='bookimage'){
    //         if(file.mimetype==='image/jpg'||file.mimetype==='image/png'){
    //             callback(null,true);
    //         }
    //         else{
    //             callback(null,false);
    //         }
    //     }
    //     if(file.fieldname==='bookfile'){
    //         if(file.mimetype==='application/pdf'){
    //             callback(null,true);
    //         }
    //         else{
    //             callback(null,false);
    //         }
    //     }
    // }
});

app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        Books.find({}).then(function (founditems) {
            res.render("book_user", { foundbooks: founditems })
        })
    }
    else {
        res.render("home");
    }
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/book_admin", (req, res) => {
    if (req.isAuthenticated()) {
        Books.find({}).then(function (founditems) {
            res.render("book_admin", { foundbooks: founditems })
        })
    }
    else {
        res.redirect("/login");
    }
})

app.get("/book", function (req, res) {
    if (req.isAuthenticated()) {
        Books.find({}).then(function (founditems) {
            res.render("book_user", { foundbooks: founditems })
        })
    }
    else {
        res.redirect("/login");
    }
})

app.get("/logout", function (req, res) {
    req.logout(req.body.username, err => {
        if (err) return nextTick(err);
        res.redirect("/");
    });
})

app.post("/register", (req, res) => {
    Users.register({ username: req.body.username }, req.body.password).then(function (user) {
        passport.authenticate("local")(req, res, function () {
            res.redirect("/book");
        })
    }).catch(function (err) {
        console.log(err);
        res.redirect("/register");
    })
})

app.post("/login", (req, res) => {
    const user = new Users({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                if(process.env.ADMIN_EMAIL===req.body.username){
                    if(process.env.PASSWORD===req.body.password){
                        res.redirect("/book_admin");
                    }
                    else{
                        res.redirect("/login");
                    }
                }
                else{
                    res.redirect("/book");
                }
            });
        }
    })
})

app.post('/upload', upload.any(), (req, res) => {
    const booktitle = req.body.booktitle;
    const bookauthor = req.body.bookauthor;
    const bookcover = "uploads/bookcover/" + booktitle + ".jpg";
    const bookfile = "uploads/bookfile/" + booktitle + ".pdf";
    const book = new Books({
        title: booktitle,
        author: bookauthor,
        avatar: bookcover,
        file: bookfile
    });
    book.save();
    res.redirect("/book");
})

app.get("/book/view/:title",(req,res)=>{
    const elementtitle=req.params.title;
    Books.findOne({title:elementtitle}).then(function(foundbook){
        var filePath ='./public/'+foundbook.file;
        fs.readFile(filePath , function (err,data){
            res.contentType("application/pdf");
            res.send(data);
        });
    })
})

app.get("/book/download/:title",(req,res)=>{
    const elementtitle=req.params.title;
    Books.findOne({title:elementtitle}).then(function(foundbook){
        res.download('./public/'+foundbook.file);
    })
})

app.get("/upload", (req, res) => {
    res.render("upload");
})

app.listen(process.env.PORT, function () {
    console.log(`server is running at ${process.env.PORT}.`);
})