//import
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//create new schema
const product = new Schema({
    product_name:
    {type:String,
        required:true},
    product_price:
    {type:Number,
        required:true},
    product_description:
    {
        type:String,
        required:true
    },
    product_quantity:
    {
        type:Number,
        required:true
    },
    isBest:
    {
        type:String,
    },
    seller:
    {
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    product_picture:{
        type:String,
        required:true
    },
    dateCreated:{
        type:Date,
        default:Date.now()
    }
});

const model_product = mongoose.model("product_list",product);
//export
module.exports=model_product;