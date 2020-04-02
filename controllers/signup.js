const express = require('express')
const router = express.Router();
const SignUpModel = require("../module/signup")

// import bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 8;
// signup route 
router.get("/", (req, res) => {
    res.render("General/signup", {
        title: "Registation"
    });
});

// validation form
router.post("/signUp_Form", (req, res) => {
    const emailError = [];
    const passwordError = [];
    const nameError = [];
    // check name is not null
    if (req.body.name.length == 0) {
        emailError.push('must enter your name');
    }
    // check password is not null
    if (req.body.password.length == 0) {
        passwordError.push('Password must not null');
    }
    // check password must be minimum 6 characters and maximum 12 characters
    if (req.body.password.length < 6 || req.body.password.length > 12) {
        passwordError.push('Password must be at least 6 characters and maxmium 12 characters');
    } else {

        /**check password must be only letter or number, no special characters */
        let letterNumber = /^[0-9a-zA-Z]+$/;
        if (!(req.body.password.match(letterNumber))) {
            passwordError.push('Password must be letter or number only');
        }
    };
    // confirmation password
    if (req.body.password != req.body.password_again) {
        passwordError.push('Password must be matched');
        console.log(`not match`);
    }
    //validation email
    if (req.body.email.length == 0) {
        emailError.push('email must not be null');
        res.render("General/signup", {
            title: "Failed Registration",
            name: req.body.name,
            email: req.body.email,
            Error_name: nameError,
            Error_mail: emailError,
            Error_password: passwordError
        });
    } else {
        SignUpModel.findOne({ "email": req.body.email }).then(database_email => {

            if (database_email != null) {
                emailError.push('Email is already exist');
                //render with error:
                res.render("General/signup", {
                    title: "Enter Unique Email",
                    name: req.body.name,
                    email: req.body.email,
                    Error_mail: emailError
                });
            } else {
                if (passwordError.length == 0 && emailError.length == 0) {
                    bcrypt.genSalt(saltRounds, function(err, salt) {
                        bcrypt.hash(req.body.password, salt, function(err, hash) {
                            // Store hash in your password DB.
                            console.log(req.body.password);
                            console.log(hash);
                            console.log(`CLERK REGISTRATIION:${req.body.clerk}`);
                            const addAccount = {
                                name: req.body.name,
                                email: req.body.email,
                                password: hash,
                            }
                            const account = new SignUpModel(addAccount)
                            account.save()
                                .then(() => {
                                    console.log(`REGISTER SUCCESSFULLY`);
                                    const sgMail = require('@sendgrid/mail');
                                    sgMail.setApiKey(process.env.sendgridapi);

                                    const msg = {
                                        from: `ntphuonghoa84@gmail.com`,
                                        to: `${req.body.email}`,
                                        subject: 'Thank you for your registration',
                                        html: 'Thank you for your registration'
                                    };
                                    sgMail.send(msg).then(
                                        () => {
                                            req.session.user = account;
                                            if (req.session.user.isClerk) {
                                                res.render("General/clerk", {
                                                    title: "Successfully Login",
                                                    email: req.body.email,
                                                    account_name: req.body.name
                                                });
                                            } else {
                                                res.redirect("/login/dashboard");
                                            }
                                        }).catch(err => {
                                        console.log(`Error ${err}`);
                                    });
                                })
                                .catch(err => console.log(`err ${err}`))

                        });
                    });
                } else {
                    //error
                    res.render("General/signup", {
                        title: "Sign-up Failed - Password or Name error",
                        name: req.body.name,
                        email: req.body.email,
                        Error_name: nameError,
                        Error_mail: emailError,
                        Error_password: passwordError
                    });
                }

            }
        }).catch(err => `error: ${err}`);
    }

});

module.exports = router;