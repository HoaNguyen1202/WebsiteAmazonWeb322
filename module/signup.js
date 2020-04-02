const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const signupSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isClerk: {
        type: Boolean,
        default: false
    },
    cart:{
        type:Array
    },
    inventoryClerk:{
        type:Array
    }
    

});

const SignUp = mongoose.model('signindb', signupSchema);
module.exports = SignUp;