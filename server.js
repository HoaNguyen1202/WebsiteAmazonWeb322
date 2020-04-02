// Name:Thi Phuong Hoa Nguyen
// Id 154047179
// Email:tphnguyen1@myseneca.ca

const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

//load environment variables key
require('dotenv').config({ path: "./config/keys.env" });

// inport router objects
const generalRouters = require("./controllers/index");
const productRouters = require("./controllers/product");
const signupRouters = require("./controllers/signup");
const loginRouters = require("./controllers/login");

//creation of app object
const app = express();

//bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));

//express static middleware
app.use(express.static("public"));


//Handlebars middlware
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// custom middleware function
app.use(session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true
}))
app.use((req, res, next) => {

    //res.locals.user is a global handlebars variable. This means that ever single handlebars file can access 
    //that user variable
    res.locals.user = req.session.user;
    next();
});


//MAPs express to all our router objects
app.use("/", generalRouters);
app.use("/login", loginRouters);
app.use("/signup", signupRouters);
app.use("/product", productRouters); //  
app.use("/", (req, res) => {
    res.render("General/404");
});


//synchononous operation 
mongoose.connect(process.env.MONGO_BD_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log(`Yah, I am connected to the database`);
    })
    .catch(err => console.log(`Error while connecting a to MongoBD ${err}`));

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("WEB SERVER STARTED sucessfull!!!")
});