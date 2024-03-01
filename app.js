require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session =require("express-session");
const passport =require("passport");
const passportLocalMongoose =require("passport-local-mongoose");

const app=express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret:"our little secret.",
    resave: false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL);

const userSchema= new mongoose.Schema({
    email:String,
    Password:String
});

userSchema.plugin(passportLocalMongoose);

const Users=new mongoose.model("Users",userSchema);

passport.use(Users.createStrategy());

passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/logout",function(req,res){
    req.logout(req.body.username,err=>{
        if(err) return nextTick(err);
        res.redirect("/");
    });
})

app.post("/register",(req,res)=>{
    Users.register({username: req.body.username},req.body.password).then(function(user){
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        })
    }).catch(function(err){
        console.log(err);
        res.redirect("/register");
    })
})

app.post("/login",(req,res)=>{
    const user= new Users({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
})

app.get("/upload",(req,res)=>{
    res.render("upload");
})

app.listen(process.env.PORT,function(){
    console.log(`server is running at ${process.env.PORT}.`);
})