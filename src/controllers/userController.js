const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const aws = require("aws-sdk");
const validator = require("../validator/validator");
const bcrypt = require("bcryptjs");
const { findOne } = require("../models/userModel");


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
      //   console.log(data)
      //   console.log("File uploaded successfully.");
      return resolve(data.Location);
    });
  });
};



//******************************CREATE USER*****************************************************************



const createUser = async function(req, res){

  try{

    const userInfo = req.body
    const files = req.files

    if(!(validator.isValidBody(userInfo))){
     return  res.status(400).send({status : false , msg : "please provide user details"})
    }

    
    const {fname, lname, email, phone, password, address} = userInfo 

    if(!fname){
     return res.status(500).send({status : false , msg : "please provide first name"})
    }

    if(!(validator.isValidName(fname))){
     return res.status(400).send({status : false , msg : "please provide valid name"})
    }

    if(!lname){
     return res.status(500).send({status : false , msg : "please provide last name"})
    }

    if(!(validator.isValidName(lname))){
     return res.status(400).send({status : false , msg : "please provide valid name"})
    }

    if(!email){
     return res.status(500).send({status : false , msg : "please provide email id"})
    }

    if(!(validator.isValidEmail(email))){
     return res.status(400).send({status : false , msg : "please provide valid email id"})
    }

    const duplicateEmail = await userModel.findOne({email : email})

    if (duplicateEmail){
    return  res.status(400).send({status : false, msg : "email id already exist. Please provide another email id"})
    }

    if(!phone){
    return  res.status(500).send({status : false , msg : "please provide phone no"})
    }

    if(!(validator.isValidNumber(phone))){
     return res.status(400).send({status : false , msg : "please provide valid phone number"})
    }

    const duplicatePhone =  await userModel.findOne({phone : phone})

    if(duplicatePhone){
    return res.status(400).send({status : false , msg : "phone no already exist. Please provide another phone no"})
    }
     
    if(!password){
    return  res.status(500).send({status : false , msg : "please provide password"})
    }
    
    
    if(!(validator.isValidPassword(password))){
    return  res.status(400).send({status : false , msg : "please provide valid and strong password"})
    }

      // encrypted password
      const encryptPassword = await bcrypt.hash(password,10)


    if(!validator.isValid(address)) {
      return res.status(400).send({status: false, message: "Address is required"})
    }

    // Validate shipping address
    if(!validator.isValid(address.shipping)) {
      return res.status(400).send({status: false, message: "Shipping address is required"})
    }
  
    // Validate street, city, pincode of shipping
    if(!validator.isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
      return res.status(400).send({status: false, message: "street , city and pincode are mandatory "})
    }

    // Validate billing address
    if(!validator.isValid(address.billing)) {
      return res.status(400).send({status: false, message: "Billing address is required"})
    }

    // Validate street, city, pincode of billing
    if(!validator.isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
      return res.status(400).send({status: false, message: "Billing address details is/are missing"})
    }

    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile( files[0] );  

      profileImage = uploadedFileURL

      const userData = {fname, lname, email, profileImage, phone, password: encryptPassword, address}
      const savedData = await userModel.create(userData)
      return res.status(201).send({status: true, message: "User created successfully", data: savedData})
      }
      else {
          return res.status(400).send({ status: false, msg: "Please provide profile image" });
      }

  }
  catch(err){
    res.status(500).send({status : false, msg : err.message})
  }
}





// //***********************************LOGIN USER***************************************************************



const userLogin = async function (req, res) {
  try {
    let loginBody = req.body;
    let { email, password } = loginBody;
    if (Object.keys(loginBody) == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide email or password" });
    }
    if (!(validator.isValid(email))) {
      return res
        .status(400)
        .send({ status: false, message: "Email is required" });
    }

    if(!(validator.isValidEmail(email))){
      return res.status(400).send({status : false , msg : "please provide valid email id"})
    }

    if (!(validator.isValid(password))) {
      return res
        .status(400)
        .send({ status: false, message: "Password is required" });
    }

    if(!(validator.isValidPassword(password))){
     return res.status(400).send({status : false , msg : "please provide valid and strong password"})
    }


    if(email && password){
      let user = await userModel.findOne({email})
      if(!user) {
        return res.status(400).send({status: false, message: "user does not exist"})
       }

       let pass = await bcrypt.compare(password , user.password)

       if(pass){
       let payload = { _id: user._id };
       let token = jwt.sign(payload, "my-secret" , { expiresIn: "300m" });

       return res.status(200).send({status : true , msg : "User login successfull", data : token})

      }
       else{
          return res.status(400).send({status : false , msg : "Invalid password"})
        }
     }

  } 
  catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
}



//*******************************GET USER BY ID**************************************************************




const getUserById = async function (req, res) {
  try {
    const userId = req.params.userId;

    if (!(validator.isValidobjectId(userId))) {
      return res.status(400).send({ status: false, message: "please provide valid user Id" });
    }

    const userInfo = await userModel.findById({_id: userId, isDeleted: false});

    if (!userInfo) {
      return res.status(404).send({ status: false, message: "user for this id not found" });
    }

    return res.status(200).send({ status: true, message: "User profile details", data: userInfo });
  } 
  catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};



//*********************************UPDATE USER***************************************************************




const updateUser = async function(req,res) {
  try {
      // Validate body
      const body = req.body
      // const reqBody = JSON.parse(req.body.data)
      if(!validator.isValidBody(body)) {
          return res.status(400).send({status: false, msg: "Details must be present to update"})
      }

      // Validate params
     const userId = req.params
      if(!validator.isValidobjectId(userId)) {
          return res.status(400).send({status: false, msg: `${userId} is invalid`})
      }

      const userFound = await userModel.findOne({_id: userId})
      if(!userFound) {
          return res.status(404).send({status: false, msg: "User does not exist"})
      }


      // AUTHORISATION
      if(userId !== req.user.userId) {
          return res.status(401).send({status: false, msg: "Unauthorised access"})
      }

      // Destructuring
      let{fname, lname, email, phone, password, address} = body;
      let updatedData = {}
      if(validator.isValid(fname)) {
          updatedData['fname'] = fname
      }
      if(validator.isValid(lname)) {
          updatedData['lname'] = lname
      }

      // Updating of email
      if(validator.isValid(email)) {
          if(!validator.isValidEmail(email)) {
              return res.status(400).send({status: false, msg: "Invalid email id"})
          }

          // Duplicate email
          const duplicatemail = await UserModel.find({email:email})
          if(duplicatemail.length) {
              return res.status(400).send({status: false, msg: "email id already exist"})
          }
          updatedData['email'] = email
      }

      // Updating of phone
      if(validator.isValid(phone)) {
          if(!validator.isValidNumber(phone)) {
              return res.status(400).send({status: false, msg: "Invalid phone number"})
          }

          // Duplicate phone
          const duplicatePhone = await userModel.find({phone:phone})
          if(duplicatePhone.length) {
              return res.status(400).send({status: false, msg: "phone number already exist"})
          }
          updatedData['phone'] = phone
      }

      // Updating of password
      if(validator.isValid(password)) {
          const encryptedPassword = await bcrypt.hash(password, 10)
          updatedData['password'] = encryptedPassword
      }

      // Updating address
      if (address) {
          if (address.shipping) {
              if (address.shipping.street) {
                  if (!validator.isValid(address.shipping.street)) {
                      return res.status(400).send({ status: false, message: 'Please provide street' })
                  }
                  updatedData['address.shipping.street'] = address.shipping.street
              }
              if (address.shipping.city) {
                  if (!validator.isValid(address.shipping.city)) {
                      return res.status(400).send({ status: false, message: 'Please provide city' })
                  }
                  updatedData['address.shipping.city'] = address.shipping.city
              }
              if (address.shipping.pincode) {
                  if (typeof address.shipping.pincode !== 'number') {
                      return res.status(400).send({ status: false, message: 'Please provide pincode' })
                  }
                  updatedData['address.shipping.pincode'] = address.shipping.pincode
              }
          }
          if (address.billing) {
              if (address.billing.street) {
                  if (!validator.isValid(address.billing.street)) {
                      return res.status(400).send({ status: false, message: 'Please provide street' })
                  }
                  updatedData['address.billing.street'] = address.billing.street
              }
              if (address.billing.city) {
                  if (!validator.isValid(address.billing.city)) {
                      return res.status(400).send({ status: false, message: 'Please provide city' })
                  }
                  updatedData['address.billing.city'] = address.billing.city
              }
              if (address.billing.pincode) {
                  if (typeof address.billing.pincode !== 'number') {
                      return res.status(400).send({ status: false, message: 'Please provide pincode' })
                  }
                  updatedData['address.billing.pincode'] = address.billing.pincode
              }
          }
      }
     

      let files = req.files;
      if (files && files.length > 0) {
          let uploadedFileURL = await uploadFile( files[0] );
          if(uploadedFileURL) {
              updatedData['profileImage'] = uploadedFileURL
          }
      }
      const updated = await userModel.findOneAndUpdate({_id:userId}, updatedData, {new:true})
      return res.status(201).send({status:true, data: updated})
  }
  catch (err) {
      res.status(500).send({ msg: "Error", error: err.message })
  }
}





module.exports = { createUser, userLogin, getUserById, updateUser };
