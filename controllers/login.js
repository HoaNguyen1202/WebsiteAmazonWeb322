const express = require('express');
const router = express.Router();
const SignUpModel = require("../module/signup")
const product_model = require("../module/product")
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload'); //import file upload
router.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 } //maximum 5 MB
}));
var path = require("path");

//Route to direct use to login form
// login/
router.get("/", (req, res) => {
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //render clerk page
            res.redirect("/login/clerk");
        } else {
            //user
            res.redirect("/login/cart");
        }
    } else {
        //not login -> login
        res.render("General/login", {
            title: "Login"
        });
    }
});

router.post("/", (req, res) => {
        const emailError = [];
        const passwordError = [];
        if (req.body.email.length == 0) { emailError.push('Email must not be empty'); }
        if (req.body.password.length == 0) {
            passwordError.push('Password must not be empty');
        } else if (req.body.password.length < 6) { passwordError.push('Password must be at least 6 characters'); }
        if (passwordError.length == 0 && emailError.length == 0) {
            //client validation ok

            //find username
            SignUpModel.findOne({ "email": req.body.email }).then(database_user => {
                //debug
                if (database_user != null) {
                    //check hash password
                    bcrypt.compare(req.body.password, database_user.password, function(err, result) {
                        // result === true
                        console.log(`the result of hash${result}`);
                        if (result) {
                            //correct password
                            req.session.user = database_user; //save this cookie to session
                            //there are two dashboard page: for clerk and for user
                            res.redirect("/login/");
                        } else {
                            //wrong password
                            passwordError.push('Password must be correct');
                            res.render("General/login", {
                                title: "Password incorrect",
                                email: req.body.email,
                                errorP: passwordError
                            });
                        }
                    });
                } else {

                    emailError.push('Username or password is incorrect');
                    res.render("General/login", {
                        title: "Fail Login",
                        email: req.body.email,
                        password: req.body.password,
                        errorM: emailError,
                        errorP: passwordError

                    });
                }
                //if match BOTH => signin
            }).catch(err => {
                console.log(`There is a error ${err}`);
            });
        } else {
            res.render("General/login", { title: "Sign-in", email: req.body.email, passW: req.body.password, errorM: emailError, errorP: passwordError });
        }

    })
    /**dashboard*/
router.get("/dashboard", (req, res) => {
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //render clerk page
            res.render("General/clerk", {
                name: "CLERK: req.session.user.name",
                email: "req.session.user.mail"
            });
        } else {
            //get cart
            var temp_cart = [];
            var total = 0;
            SignUpModel.findById(req.session.user._id).then((user) => {
                user.cart.forEach(element => {
                    total += 1;
                    temp_cart.push(element);
                    console.log(`element: ${element}`);
                });
                res.render("General/dashboard", {
                    name: req.session.user.name,
                    product_list: temp_cart
                });
            });

        }
    } else {
        //not login
        res.redirect("/login");
    }

})
router.get("/sell", (req, res) => {
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //render clerk page
            res.render("General/sell");
        } else {
            //user
            res.render("General/dashboard", {
                name: req.session.user.name,
                email: req.session.user.mail
            });
        }
    } else {
        //not login
        res.redirect("/login");
    }

})

//upload to database
router.post("/addproduct", (req, res) => {
        const err = [];
        console.log(`req.files: ${req.files}`);
        if (req.session.user) {
            if (!req.files) {
                res.redirect("/login/sell");
                console.log(`you did not upload any picture (required)`);
            } else {
                if (req.session.user.isClerk) {
                    //check image uploaded or not
                    if (!req.files.product_picture || !(path.parse(req.files.product_picture.name).ext === ".png" || path.parse(req.files.product_picture.name).ext === ".JPG" || path.parse(req.files.product_picture.name).ext === ".tiff" || path.parse(req.files.product_picture.name).ext === ".gif")) {
                        //wrong type, file not exist
                        err.push(`wrong type or file not exist`);
                        res.render("General/sell", {
                            error: err
                        });
                    } else {
                        //set up image
                        const pp = `${req.files.product_picture.name}${req.session.user._id}${path.parse(req.files.product_picture.name).ext}`;
                        req.files.product_picture.mv(`public/img/${pp}`);
                        //no error, addto database
                        if (!req.body.isBest) {
                            req.body.isBest = "false";
                        }
                        const newProduct = {
                            product_name: req.body.product_name,
                            product_price: req.body.product_price,
                            product_description: req.body.product_description,
                            product_quantity: req.body.product_quantity,
                            product_picture: pp,
                            category: req.body.category,
                            isBest: req.body.isBest,
                            seller: req.session.user._id
                        }
                        console.log(`before saving: ${newProduct}`);
                        const newitem = new product_model(newProduct);
                        newitem.save();

                        //success, render login
                        res.redirect("/login");
                    }

                } else {
                    //user
                    console.log(`User cannot add item`);
                    res.redirect("/login");
                }
            }

        } else {
            //not login
            res.redirect("/login");
        }

    })
    //logout
router.get("/logout", (req, res) => {
    //destroy session
    if (req.session.user) {
        delete req.session.user;
    };

    res.redirect("/login");
});
//clerk
router.get("/clerk", (req, res) => {
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //render clerk page
            //get data from server
            product_model.find({ seller: req.session.user._id }).then((items) => {
                //result = list of items
                var temp_products = [];
                var total_bill = 0;
                var total_products = 0;
                items.forEach(element => {
                    temp_products.push(element);
                    total_bill += (element.product_price * element.product_quantity);
                    total_products += 1;
                });
                total_bill.toFixed(2); //round two decimal
                //render
                res.render("General/clerk", {
                    name: req.session.user.name,
                    email: req.session.user.email,
                    totalproduct: total_products,
                    product_list: temp_products.reverse(), //new things first
                    totalbill: total_bill
                });
            });

        } else {
            //user
            res.render("General/dashboard", {
                name: req.session.user.name,
                email: req.session.user.mail
            });
        }
    } else {
        //not login -> login
        res.render("General/login", {
            title: "Login"
        });
    }
});
router.post("/clerkedit/:id", (req, res) => {
    //get full infor 
    if (req.session.user) {
        if (!req.files && req.session.user.isClerk) {
            //get the current picture (because we only pass _id, not picture)
            product_model.findById(req.params.id).then((item) => {
                //update
                const item_update = {
                    product_name: req.body.product_name,
                    product_price: req.body.product_price,
                    product_description: req.body.product_description,
                    product_quantity: req.body.product_quantity,
                    product_picture: item.product_picture,
                    category: req.body.category,
                    isBest: req.body.isBest,
                    seller: req.session.user._id
                }
                product_model.findOneAndUpdate({ _id: req.params.id }, item_update).then((item_changed) => {
                    res.redirect("/login");
                });
            });

        } else {
            if (req.session.user.isClerk) {
                //check image uploaded or not
                if (!req.files.product_picture || (path.parse(req.files.product_picture.name).ext !== ".png" || path.parse(req.files.product_picture.name).ext !== ".jpg" || path.parse(req.files.product_picture.name).ext !== ".tiff" || path.parse(req.files.product_picture.name).ext !== ".gif")) {
                    //wrong type, file not exist
                    //debug
                    let err = [];
                    err.push(`wrong type or file not exist`);
                    res.render("General/sell", {
                        error: err
                    });
                } else {
                    //set up image
                    const pp = `${req.files.product_picture.name}${req.session.user._id}${path.parse(req.files.product_picture.name).ext}`;
                    req.files.product_picture.mv(`public/img/${pp}`);
                    //no error, addto database
                    if (!req.body.isBest) {
                        req.body.isBest = "false";
                    }
                    const item_update = {
                        product_name: req.body.product_name,
                        product_price: req.body.product_price,
                        product_description: req.body.product_description,
                        product_quantity: req.body.product_quantity,
                        product_picture: pp,
                        category: req.body.category,
                        isBest: req.body.isBest,
                    }
                    product_model.findOneAndUpdate({ _id: req.params.id }, item_update).then(() => {
                        res.redirect("/login");
                    });
                }

            } else {
                //user
                console.log(`User cannot sell item`);
                res.redirect("/login");
            }
        }

    } else {
        //not login
        res.redirect("/login");
    }

});
//clerk - delete
router.post("/clerkdelete/:id", (req, res) => {
    console.log(`req.body.param: :${req.params.id}`);
    console.log(`req.body.new quan:${req.body.product_quantity}`);

    product_model.findOneAndDelete({ _id: req.params.id }).then(() => {

        res.redirect("/login");
    });
});
router.post("/clerkrequest/:id", (req, res) => {
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //get infor
            product_model.findById(req.params.id).then((product) => {
                res.render("General/clerkedit", {
                    _id: product._id,
                    product_name: product.product_name,
                    product_price: product.product_price,
                    product_description: product.product_description,
                    product_quantity: product.product_quantity,
                    product_picture: product.product_picture
                });
            });

        } else {
            //user
            res.render("General/dashboard", {
                name: req.session.user.name,
                email: req.session.user.mail
            });
        }
    } else {
        //not login -> login
        res.render("General/login", {
            title: "Login"
        });
    }
});
//cart - for user only
router.get("/cart", (req, res) => {
    if (req.session.user) {
        //user only
        if (!req.session.user.isClerk) {
            //render user
            //get cart from server
            //concept: extend the tempcart from {_id,quantity} -> {_id,quantity,name,price} to show in user's cart
            SignUpModel.findOne({ _id: req.session.user._id }).then((user) => {
                var temp_cart = [];
                var total_bill = 0;
                var total_products = 0;
                req.session.user.tempreceipt = `Your receipt:<br>`;
                //sumuser
                user.cart.forEach(element => {
                    temp_cart.push(element);
                });
                //get all item
                product_model.find().then((list_product) => {
                    temp_cart.forEach(element => {
                        list_product.forEach(element_product => {
                            if (element._id == element_product._id) {
                                //match, then add more product information to temp_cart
                                element.product_name = element_product.product_name;
                                element.product_price = element_product.product_price;
                                element.product_picture = element_product.product_picture;
                            }
                        });
                        total_bill += ((element.product_price * element.product_quantity) * 1.13);

                        total_products += 1;
                        req.session.user.tempreceipt += element.product_name + `  ` + element.product_price.toFixed(2) + `$    x    ` + element.product_quantity + `<br>`;
                    });
                    req.session.user.tempreceipt += `HST:13%    `;
                    let fix_bill = parseFloat(total_bill).toFixed(2); //for email
                    req.session.user.tempreceipt += `total: ` + fix_bill + `$<br>` + `Thank you for shopping`
                    console.log(`mail: ${req.session.user.tempreceipt}`);
                    //render tempcart
                    res.render("General/dashboard", {
                        name: req.session.user.name,
                        product_list: temp_cart.reverse(), //newest to oldest
                        totalproduct: total_products,
                        totalbill: total_bill.toFixed(2) //for cart display
                    });
                });
            });

        } else {
            //clerk
            res.redirect("/login/clerk");
        }
    } else {
        //not login -> login
        res.render("General/login", {
            title: "Login"
        });
    }
});
//cart - delete
router.post("/userdelete/:id", (req, res) => {
    console.log(`req.body.param: :${req.params.id}`);
    console.log(`req.body.new quan:${req.body.product_quantity}`);
    console.log(`${req.session.user._id}`);
    SignUpModel.findById(req.session.user._id).then((user) => {
        console.log(`catched`);
        console.log(`user.cart.length: ${user.cart.length}`);
        console.log(`req.params.id: ${req.params.id}`);

        for (let index = 0; index < user.cart.length; index++) {
            if (user.cart[index]._id == req.params.id) {
                //detect product in array
                user.cart.splice(index, 1); //delete 1 element start at index
                console.log(`index: ${index}`);
                break;
            }

        }
        user.save(); //update user cart
        res.redirect("/login");
    });

});

router.get("/checkout", (req, res) => {
    if (req.session.user) {
        //user only
        if (!req.session.user.isClerk) {
            //render user
            //get cart from server
            //concept: extend the tempcart from {_id,quantity} -> {_id,quantity,name,price} to show in user's cart

            //email
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.sendgridapi);
            const msg = {
                to: `${req.session.user.email}`,
                from: `ntphuonghoa84@gmail.com`,
                subject: 'Thank you for shopping',
                html: req.session.user.tempreceipt
            };
            sgMail.send(msg).then(() => {
                console.log(`successfully email`);
                //delete user cart
                SignUpModel.findById(req.session.user._id).then((user) => {
                    console.log(`phat hien user la :${user.email}`);

                    user.cart = []; //clean, delete the current cart
                    user.save(); //debug neu khong run, findidandupdate

                    SignUpModel.findOne({ _id: req.session.user._id }).then((user) => {
                        var temp_cart = [];
                        var total_bill = 0;
                        var total_products = 0;
                        req.session.user.tempreceipt = `Your receipt:<br>`;
                        //sumuser
                        user.cart.forEach(element => {
                            temp_cart.push(element);
                        });
                        //get all item
                        product_model.find().then((list_product) => {
                            temp_cart.forEach(element => {
                                list_product.forEach(element_product => {
                                    if (element._id == element_product._id) {
                                        //match, then add more product information to temp_cart
                                        element.product_name = element_product.product_name;
                                        element.product_price = element_product.product_price;
                                        element.product_picture = element_product.product_picture;
                                    }
                                });
                                total_bill += (element.product_price * element.product_quantity);
                                total_products += 1;
                                req.session.user.tempreceipt += element.product_name + ` ` + element.product_price.toFixed(2) + `$    x    ` + element.product_quantity + `<br>`;
                            });
                            req.session.user.tempreceipt += `HST:13%`
                            req.session.user.tempreceipt += `total: ` + total_bill.toFixed(2) + `<br>` + `Thank you for shopping`
                            console.log(`mail: ${req.session.user.tempreceipt}`);
                            //render confirmation, your order has been proceeded
                            res.render("General/confirmation", {
                                title: "Comfirmation",

                                message: `Your order has been sent to your email, thank you ` + req.session.user.name


                            });
                        });
                    });

                });
            }).catch(err => {
                console.log(`Error ${err}`);
            });

        } else {
            //clerk
            res.redirect("/login/clerk");
        }
    } else {
        //not login -> login
        res.render("General/login", {
            title: "Login"
        });
    }
});


module.exports = router;