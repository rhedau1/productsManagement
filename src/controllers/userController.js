const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const aws = require("aws-sdk");
const validator = require("../validator/validator");
const bcrypt = require("bcryptjs");

//*****************************s3 aws configuration*********************************************************

aws.config.update({
  accessKeyId: "AKIAY3L35MCRVFM24Q7U", // id
  secretAccessKey: "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", // secret password
  region: "ap-south-1",
});

let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {
    let s3 = new aws.S3({ apiVersion: "2006-03-01" });

    var uploadParams = {
      ACL: "public-read",
      Bucket: "classroom-training-bucket",
      Key: "group39/profileImages/" + file.originalname,
      Body: file.buffer,
    };

    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ error: err });
      }
     
      return resolve(data.Location);
    });
  });
};

//******************************CREATE USER*******************************************************************



const createUser = async function (req, res) {
  try {
    const userInfo = req.body;
    const files = req.files;

    if (!validator.isValidBody(userInfo)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide user details" });
    }

    const { fname, lname, email, phone, password, address } = userInfo;

    if (!fname) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide first name" });
    }

    if (!validator.isValidName(fname)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid first name" });
    }

    if (!lname) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide last name" });
    }

    if (!validator.isValidName(lname)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid last name" });
    }

    if (!email) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide email id" });
    }

    if (!validator.isValidEmail(email)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid email id" });
    }

    const duplicateEmail = await userModel.findOne({ email: email });

    if (duplicateEmail) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "email id already exist. Please provide another email id",
        });
    }

    if (!phone) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide phone no" });
    }

    if (!validator.isValidNumber(phone)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid phone number" });
    }

    const duplicatePhone = await userModel.findOne({ phone: phone });

    if (duplicatePhone) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "phone no already exist. Please provide another phone no",
        });
    }

    if (!password) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide password" });
    }

    if (!validator.isValidPassword(password)) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "please provide strong and valid password including eg. 'A-Z , a-z , 0-9 , @'",
        });
    }

    // encrypted password
    const encryptPassword = await bcrypt.hash(password, 10);

    if (!validator.isValid(address)) {
      return res
        .status(400)
        .send({ status: false, msg: "Address is required" });
    }

    // Validate shipping address
    if (!validator.isValid(address.shipping)) {
      return res
        .status(400)
        .send({ status: false, msg: "Shipping address is required" });
    }

    // Validate street, city, pincode of shipping
    if (
      !validator.isValid(
        address.shipping.street &&
          address.shipping.city &&
          address.shipping.pincode
      )
    ) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "street , city and pincode are mandatory ",
        });
    }

    // Validate billing address
    if (!validator.isValid(address.billing)) {
      return res
        .status(400)
        .send({ status: false, msg: "Billing address is required" });
    }

    // Validate street, city, pincode of billing
    if (
      !validator.isValid(
        address.billing.street &&
          address.billing.city &&
          address.billing.pincode
      )
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "street , city and pincode are mandatory" });
    }

    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);

      profileImage = uploadedFileURL;

      const userData = {
        fname,
        lname,
        email,
        profileImage,
        phone,
        password: encryptPassword,
        address,
      };
      const savedData = await userModel.create(userData);
      return res
        .status(201)
        .send({
          status: true,
          msg: "User created successfully",
          data: savedData,
        });
    } else {
      return res
        .status(400)
        .send({ status: false, msg: "Please provide profile image" });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
};

//***************************************LOGIN USER***************************************************************

const userLogin = async function (req, res) {
  try {
    let { email, password } = req.body;
    if (Object.keys(req.body) == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide email or password" });
    }
    if (!validator.isValid(email)) {
      return res.status(400).send({ status: false, msg: "Email is required" });
    }

    if (!validator.isValidEmail(email)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid email id" });
    }

    if (!validator.isValid(password)) {
      return res
        .status(400)
        .send({ status: false, msg: "Password is required" });
    }

    if (!validator.isValidPassword(password)) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "please provide valid and strong password",
        });
    }

    if (email && password) {
      let user = await userModel.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .send({ status: false, msg: "user does not exist" });
      }

      let pass = await bcrypt.compare(password, user.password);

      if (pass) {
        let payload = { _id: user._id };
        let token = jwt.sign(payload, "my-secret", { expiresIn: "300m" });

        return res
          .status(200)
          .send({ status: true, msg: "User login successfull", data: token });
      } else {
        return res.status(400).send({ status: false, msg: "Invalid password" });
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

//*******************************GET USER BY ID**************************************************************

const getUserById = async function (req, res) {
  try {
    const userId = req.params.userId;

    if (!validator.isValidobjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide valid user Id" });
    }

    const userInfo = await userModel.findById({
      _id: userId,
      isDeleted: false,
    });

    if (!userInfo) {
      return res
        .status(404)
        .send({ status: false, msg: "user for this id not found" });
    }

    return res
      .status(200)
      .send({ status: true, msg: "User profile details", data: userInfo });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.msg });
  }
};

//*********************************UPDATE USER***************************************************************

const updateUser = async function (req, res) {
  try {
    // Validate body
    const body = req.body;
    // const reqBody = JSON.parse(req.body.data)
    if (!validator.isValidBody(body)) {
      return res
        .status(400)
        .send({ status: false, msg: "Details must be present to update" });
    }

    // Validate params
    userId = req.params.userId;
    if (!validator.isValidobjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, msg: `${userId} is invalid` });
    }

    const userFound = await userModel.findOne({ _id: userId });
    if (!userFound) {
      return res
        .status(404)
        .send({ status: false, msg: "User does not exist" });
    }

    // Destructuring
    let { fname, lname, email, phone, password, address } = body;

    let updatedData = {};
    if (validator.isValid(fname)) {
      updatedData["fname"] = fname;
    }
    if (validator.isValid(lname)) {
      updatedData["lname"] = lname;
    }

    // Updating of email
    if (validator.isValid(email)) {
      if (!validator.isValidEmail(email)) {
        return res.status(400).send({ status: false, msg: "Invalid email id" });
      }

      // Duplicate email
      const duplicatemail = await userModel.find({ email: email });
      if (duplicatemail.length) {
        return res
          .status(400)
          .send({ status: false, msg: "email id already exist" });
      }
      updatedData["email"] = email;
    }

    // Updating of phone
    if (validator.isValid(phone)) {
      if (!validator.isValidNumber(phone)) {
        return res
          .status(400)
          .send({ status: false, msg: "Invalid phone number" });
      }

      // Duplicate phone
      const duplicatePhone = await userModel.find({ phone: phone });
      if (duplicatePhone.length) {
        return res
          .status(400)
          .send({ status: false, msg: "phone number already exist" });
      }
      updatedData["phone"] = phone;
    }

    // Updating of password
    if (!validator.isValid(password)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide password" });
    }

    if (!validator.isValidPassword(password)) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "please provide strong and valid password including 'A , a , 1 , @'",
        });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Updating address

    let parseBody = JSON.parse(JSON.stringify(body));
    console.log(parseBody);
    if (parseBody.address == 0) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please add shipping or billing address to update",
        });
    }

    if (address) {
      let jsonAddress = JSON.parse(JSON.stringify(address));
      if (
        !(
          Object.keys(jsonAddress).includes("shipping") ||
          Object.keys(jsonAddress).includes("billing")
        )
      ) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please add shipping or billing address to update",
          });
      }

      let { shipping, billing } = parseBody.address;
      if (shipping == 0) {
        return res
          .status(400)
          .send({
            status: false,
            message:
              "Please add street, city or pincode to update for shipping",
          });
      }
      if (shipping) {
        if (
          !(
            Object.keys(shipping).includes("street") ||
            Object.keys(shipping).includes("city") ||
            Object.keys(shipping).includes("pincode")
          )
        ) {
          return res
            .status(400)
            .send({
              status: false,
              message:
                "Please add street, city or pincode for shipping to update",
            });
        }

        if (shipping.street == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide shipping address's Street`,
            });
        }

        if (shipping.city == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide shipping address's city`,
            });
        }

        if (shipping.pincode == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide shipping address's pincode`,
            });
        }
        if (shipping.pincode) {
          if (!/^[1-9][0-9]{5}$/.test(shipping.pincode)) {
            return res
              .status(400)
              .send({
                status: false,
                message: "Pleasee provide a valid pincode to update",
              });
          }
        }
        var shippingStreet = shipping.street;
        var shippingCity = shipping.city;
        var shippingPincode = shipping.pincode;
      }

      if (billing == 0) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please add street, city or pincode to update for billing",
          });
      }
      if (billing) {
        if (
          !(
            Object.keys(billing).includes("street") ||
            Object.keys(billing).includes("city") ||
            Object.keys(billing).includes("pincode")
          )
        ) {
          return res
            .status(400)
            .send({
              status: false,
              message:
                "Please add street, city or pincode for billing to update",
            });
        }

        if (billing.street == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide billing address's Street`,
            });
        }
        if (billing.city == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide billing address's city`,
            });
        }
        if (billing.pincode == 0) {
          return res
            .status(400)
            .send({
              status: false,
              message: `Please provide billing address's pincode`,
            });
        }
        if (billing.pincode) {
          if (!/^[1-9][0-9]{5}$/.test(billing.pincode)) {
            return res
              .status(400)
              .send({
                status: false,
                message: "Pleasee provide a valid pincode to update",
              });
          }
        }
        var billingStreet = billing.street;
        var billingCity = billing.city;
        var billingPincode = billing.pincode;
      }
    }

    // profileImage = await aws.uploadFile(files[0])

    let updateUserProfile = await userModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          fname: fname,
          lname: lname,
          email: email,
          profileImage: body.profileImage,
          phone: phone,
          password: encryptedPassword,
          "address.shipping.street": shippingStreet,
          "address.shipping.city": shippingCity,
          "address.shipping.pincode": shippingPincode,
          "address.billing.street": billingStreet,
          "address.billing.city": billingCity,
          "address.billing.pincode": billingPincode,
        },
      },
      { new: true }
    );

    return res.status(200).send({ status: true, data: updateUserProfile });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createUser, userLogin, getUserById, updateUser };
