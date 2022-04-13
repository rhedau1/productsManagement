const userModel = require('../models/userModel')
const jwt = require("jsonwebtoken")
const aws = require("aws-sdk");
//const multer = require('multer');

const isValid = function (value) {
    if (typeof value === "undefined" || value == null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",  // id
    secretAccessKey: "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",  // secret password
    region: "ap-south-1"
});



let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {

        let s3 = new aws.S3({ apiVersion: "2006-03-01" });

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "tejas/" + file.originalname,
            Body: file.buffer,
        };

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            //   console.log(data)
            //   console.log("File uploaded successfully.");
            return resolve(data.Location);
        });
    });
};



const createUser = async function (req, res) {
    try {
        let userBody = req.body
        let files = req.files
        //console.log(userBody)
        //console.log(files)
        //const query = req.query
        let { fname, lname, email, phone, password, address } = userBody
        // let address = userBody.address
        // if (Object.keys(userBody) == 0) {
        //     return res.status(400).send({ status: false, msg: "please provide data in user body" })
        // }
        if (!isValidRequestBody(userBody)) {
            return res.status(400).send({ status: false, error: 'user details are missing' })
        }


        if (!isValid(fname)) {
            return res.status(400).send({ status: false, msg: "please provide  first name" })
        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, msg: "please provide  last name" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "please provide email" })
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(userBody.email))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }
        let duplicateEmail = await userModel.findOne({ email: userBody.email })
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: 'email already exists' })
        }
        //---------yaha par profile image ayegi-----------------

        if (!isValid(phone)) {
            return res.status(400).send({ status: false, msg: "please provide phone" })
        }
        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/
            .test(userBody.phone))) {
            return res.status(400).send({ status: false, msg: "please provide a valid phone Number" })
        }

        let duplicatePhone = await userModel.findOne({ phone: userBody.phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, msg: 'Phone already exists' })
        }
        if (!isValid(password)) {
              return res.status(400).send({ status: false, msg: "please provide password" })
        }

        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(userBody.password))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid password" })
        }

        if (Object.keys(address) == 0) {
            return res.status(400).send({ status: false, msg: "please provide address" });
        }
        // if (!isValidRequestBody(userBody.address)) {
        //     return res.status(400).send({ status: false, error: 'user details are missing' })
        // }

        if (!isValid(address)) {
            return res.status(400).send({ status: false, msg: "please provide  valid address" })
        }
        if (Object.keys(address.shipping) == 0) {
            return res.status(400).send({ status: false, msg: "please provide shipping address" })
        }
        if (!isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, msg: "please provide street" })
        }
        if (!isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, msg: "please provide city" })
        }
        if (!isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "please provide pincode" })
        }
        if (Object.keys(address.billing) == 0) {
            return res.status(400).send({ status: false, msg: "please provide billing address" })
        }
        if (!isValid(address.billing.street)) {
            return res.status(400).send({ status: false, msg: "please provide street" })
        }
        if (!isValid(address.billing.city)) {
            return res.status(400).send({ status: false, msg: "please provide city" })
        }
        if (!isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "please provide pincode" })
        }
        if (files && files.length > 0) {
            let uploadFileUrl = await uploadFile(files[0])

            let finalData = { fname, lname, email,profileImage:uploadFileUrl, phone,password, address }

            const newUser = await userModel.create(finalData)
            res.status(201).send({ status: true, msg: "user created successfully", data: finalData })
        } else {
            res.status(400).send({ msg: "no file found" })
        }

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
//------------userLogin--------------------------

const userLogin = async function (req, res) {
    try {
        let loginBody = req.body
        let { email, password } = loginBody
        if (Object.keys(loginBody) == 0) {
            return res.status(400).send({ status: false, msg: "please provide email or password" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email is required' })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        const userInfo = await userModel.findOne({ email: email , password: password});

        if (!userInfo) {
            return res.status(401).send({ status: false, message: 'Invalid Email' });
        }
       

        let payload = { _id: userInfo._id };
        let token = jwt.sign(payload, 'my-secret') //{ expiresIn: "30m" })

        return res.status(200).send({ status: true, message: 'User login successfull', token: token });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const getUserById = async function (req, res) {
    try {
        const userId = req.params.userId
       
        if (!(/^[0-9a-fA-F]{24}$/.test(userId))) {
            return res.status(400).send({ status: false, message: 'please provide valid user Id' })
          }
        const userInfo = await userModel.findById({ _id: userId,  isDeleted: false})

        if (!userInfo) {
          return res.status(404).send({ status: false, message: 'user not found' })
        }
    
        return res.status(200).send({ status: true, message: "User profile details", data: userInfo })
      }
    
    catch(error) {
        return res.status(500).send({status: false, error: error.message})
    }
}


// const updateUser = async function (req, res) {
//     try {
//       const userId = req.params.userId
  
//       if (!(/^[0-9a-fA-F]{24}$/.test(userId))) {
//         res.status(400).send({ status: false, message: 'please provide valid userId' })
//         return
//       }
  
//       const userInfo = await userModel.findById({ _id: userId, isDeleted: false })
      
  
//       if(!(userInfo)) {
//         res.status(404).send({ status: false, message: "No User found" })
//         return
//       }
  
//       if(Object.keys(req.body) == 0) {
//         res.status(400).send({status: false, message: 'please provide data for updation'})
//         return
//     }
  
//       const {fname, lname, email, phone ,password, address} = req.body
  
//       if (!(/^[a-z ,.'-]+$/.test(fname))) {
//         return  res.status(400).send({ status: false, message: 'please provide valid first name' })
        
//       }
       
//       if (!(/^[a-z ,.'-]+$/.test(lname))) {
//         return res.status(400).send({ status: false, message: 'please provide valid last name' })
        
//       }

//       if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))) {
//         return res.status(400).send({ status: false, msg: "Please provide a valid email" })
//       }

//       if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))) {
//         return res.status(400).send({ status: false, msg: "please provide a valid phone Number" })
//       }
  
//       if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password))) {
//         return res.status(400).send({ status: false, msg: "Please provide a valid password" })
//       }

//         const updateData = {fname, lname, email, phone ,password, address}
      
//       const updateduserInfo = await userModel.findOneAndUpdate({ _id: userId },{...updateData}, { new: true })
  
//       return res.status(200).send({ status: true, message: "userInfo updated successfully", data: updateduserInfo })
//     }
//     catch (err) {
//       console.log(err)
//       res.status(500).send({ status: false, msg: err.message })
//     }
//   }




































const updateUser = async function(req,res) {
    try {
        // Validate body
        const body = req.body
        // const reqBody = JSON.parse(req.body.data)
        if(!isValid(body)) {
            return res.status(400).send({status: false, msg: "Details must be present to update"})
        }

        // Validate params
        userId = req.params.userId

        if (!(/^[0-9a-fA-F]{24}$/.test(userId))) {
            return res.status(400).send({ status: false, message: 'please provide valid user Id' })
          }
       
        const userFound = await userModel.findOne({_id: userId})
        if(!userFound) {
            return res.status(404).send({status: false, msg: "User does not exist"})
        }


        // Destructuring
        let{fname, lname, email, phone, password, address} = body;
         let updatedData = {};

        if(isValid(fname)) {
            updatedData.fname = fname
        }
        if(isValid(lname)) {
            updatedData.lname = lname
        }

        // Updating of email

        if(!isValid(email)){
            res.status(400).send({status : false , msg : "please provide email"})
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }
    
            
         // Duplicate email
            const duplicatemail = await userModel.findOne({email:email})
            if(duplicatemail) {
                return res.status(400).send({status: false, msg: "email id already exist"})
            }
            updatedData.email = email
        

        // Updating of phone

        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))) {
        return res.status(400).send({ status: false, msg: "please provide a valid phone Number" })
        }


            // Duplicate phone
            const duplicatePhone = await userModel.findOne({phone:phone})
            if(duplicatePhone) {
                return res.status(400).send({status: false, msg: "phone number already exist"})
            }
            updatedData.phone = phone
        

        // Updating of password

        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid password" })
        }
          updatedData.password = password

        // Updating address
        if (address) {
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!isValid(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: 'Please provide street' })
                    }
                    updatedData['address.shipping.street'] = address.shipping.street
                }
                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) {
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
                    if (!isValid(address.billing.street)) {
                        return res.status(400).send({ status: false, message: 'Please provide street' })
                    }
                    updatedData['address.billing.street'] = address.billing.street
                }
                if (address.billing.city) {
                    if (!isValid(address.billing.city)) {
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


        // this function uploads file to AWS and gives back the url for the file
       
        let files = req.files;
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile( files[0] );
            if(uploadedFileURL) {
                updatedData['profileImage'] = uploadedFileURL
            }
        }

      // const updatedData = {fname,lname,email,phone,password}

        const updated = await userModel.findOneAndUpdate({_id:userId}, {...updatedData}, {new:true})
        return res.status(201).send({status:true, data: updated})
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}










module.exports ={ createUser , userLogin , getUserById , updateUser}
