const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
      trim : true
    },
    lname: {
      type: String,
      required: true,
      trim : true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim : true
      //valid email
    },
    
    profileImage: {
      type: String,
      required: true,
      trim : true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim : true
      // valid indian mobile number ko gegex me laga diya hu
    },
    password: {
      type: String,
      required: true,
      trim : true
      // minlength: 8,
      // maxlength: 15,
    },
    address: {
      shipping: {
        street: { type: String, required: true, trim : true },
        city: { type: String, required: true, trim : true },
        pincode: { type: Number, required: true, trim : true },
      },
      billing: {
        street: { type: String, required: true, trim : true },
        city: { type: String, required: true, trim : true },
        pincode: { type: Number, required: true, trim : true },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
