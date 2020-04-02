const express = require('express');
const router = express.Router();
const product_model = require("../module/product")
const SignUpModel = require("../module/signup")

// route /product => /product/product
router.get("/", (req, res) => {
    //get all product
    var allproducts = [];
    product_model.find().then((best_selling) => {
        best_selling.forEach(element => {
            console.log(`best seller items:`);
            allproducts.push(element);
        });
        res.render("General/product", {
            title: "Products",
            allP: allproducts.reverse()
        });
    });

});
//get id
router.get("/:id", (req, res) => {

    product_model.findById(req.params.id)
        .then((item_got) => {
            console.log(`items's name just got: ${item_got.product_name}`);
            res.render("General/detail", {
                _id: item_got._id,
                product_name: item_got.product_name,
                product_price: item_got.product_price,
                product_description: item_got.product_description,
                product_quantity: item_got.product_quantity,
                product_picture: item_got.product_picture,
                isBest: item_got.isBest,
                category: item_got.category,
            })

        })
        .catch(err => console.log(`Error happened when pulling from the database :${err}`));
})

router.post("/addcart/:id", (req, res) => {
    console.log(`req.body.param: :${req.params.id}`);
    console.log(`req.body.new quan:${req.body.product_quantity}`);
    //add to cart
    const newitem = {
        _id: req.params.id,
        product_quantity: req.body.product_quantity
    };
    //get cart from user
    if (req.session.user) {
        SignUpModel.findById(req.session.user._id).then((user) => {
            //push, update and save
            user.cart.push(newitem);
            user.save();
            res.redirect("/login");
        });
    } else {
        res.redirect("/login");
    }


});
/*search module*/
//category home
router.get("/search/homecategory", (req, res) => {
    //get home
    var allproducts = [];
    product_model.find({ category: "Home" }).then((Home) => {
        if (Home == null) {
            res.render("General/product", {
                title: "Products",
                allP: []
            });
        } else {
            Home.forEach(element => {
                allproducts.push(element);
            });
            res.render("General/product", {
                title: "Products",
                allP: allproducts
            });
        }


    });

});
router.get("/search/electronics", (req, res) => {
    //get elec
    var allproducts = [];
    product_model.find({ category: "Electronics" }).then((Electronics) => {
        if (Electronics == null) {
            res.render("General/product", {
                title: "Products",
                allP: []
            });
        } else {
            Electronics.forEach(element => {
                allproducts.push(element);
            });
            res.render("General/product", {
                title: "Products",
                allP: allproducts.reverse()
            });
        }


    });

});
router.get("/search/decor", (req, res) => {
    //get Decor
    var allproducts = [];

    product_model.find({ category: "Decor" }).then((Decor) => {
        if (Decor == null) {
            res.render("General/product", {
                title: "Products",
                allP: []
            });
        } else {
            Decor.forEach(element => {
                allproducts.push(element);
            });
            res.render("General/product", {
                title: "Products",
                allP: allproducts.reverse()
            });
        }


    });

});
router.get("/search/cosmetic", (req, res) => {
    //get elec
    var allproducts = [];
    product_model.find({ category: "Cosmetic" }).then((Cosmetic) => {
        if (Cosmetic == null) {
            res.render("General/product", {
                title: "Products",
                allP: []
            });
        } else {
            Cosmetic.forEach(element => {
                allproducts.push(element);
            });
            //
            res.render("General/product", {
                title: "Products",
                allP: allproducts.reverse()
            });
        }


    });

});
//search by keyword
router.post("/search", (req, res) => {
    //get elec
    var allproducts = [];
    console.log(`product: ${req.body.product_name}`);

    filter = { product_name: { $regex: `.*${req.body.product_name}.*`, $options: 'i' } }; //i: case sensitive


    product_model.find(filter).then((key_item) => {
        if (key_item == null) {
            res.render("General/product", {
                title: "Products",
                allP: []
            });
        } else {
            key_item.forEach(element => {
                allproducts.push(element);
            });
            res.render("General/product", {
                title: "Products",
                allP: allproducts
            });
        }


    });

});
module.exports = router;