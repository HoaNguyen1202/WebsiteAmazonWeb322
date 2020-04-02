const express = require('express')
const router = express.Router();// general routers
const product_model = require("../module/product")

//router to direct user to home page
const productModel = require("../module/product");
router.get("/", (req, res) => {
    //get best selling list
    var bestSeller = [];
    product_model.find({isBest:"true"}).then((best_selling)=>{
        best_selling.forEach(element => {
            console.log(`best seller items:`);
            bestSeller.push(element);
        });
        res.render("General/index", {
            title: "Home Page",
            bestSelling:bestSeller
        });
    });

    
});
module.exports = router;