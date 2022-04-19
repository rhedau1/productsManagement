const productModel = require("../Models/productModel")
const aws = require("aws-sdk")
//const mongoose = require("mongoose")
const validator = require('../validator/validator');


// ********************************************* AWS-S3 ****************************************************************** //

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",  // id
    secretAccessKey: "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",  // secret password
    region: "ap-south-1" 
  });
  
  
  // this function uploads file to AWS and gives back the url for the file
  let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { 
      
      let s3 = new aws.S3({ apiVersion: "2006-03-01" });
      var uploadParams = {
        ACL: "public-read", 
        Bucket: "classroom-training-bucket", // HERE
        Key: "group39/profileImages/" + file.originalname, // HERE    
        Body: file.buffer, 
      };
  
      s3.upload(uploadParams , function (err, data) {
        if (err) {
          return reject( { "error": err });
        }
        console.log(data)
        console.log("File uploaded successfully.");
        return resolve(data.Location); //HERE 
      });
    });
  };


// ************************************** POST /products ************************************************************ //



const createProduct = async function(req,res) {
    try {
        const body = req.body
       
        // Validate body
        if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Product details must be present"})
        }

       

         //--------destructuring------------------------
         
        const {title, description, price, currencyId, currencyFormat,isFreeShipping,style, availableSizes,installments} = body

        // Validate title
        if(!validator.isValid(title)) {
            return res.status(400).send({ status: false, msg: "Title is required"})
        }

        // Validate description
        if(!validator.isValid(description)) {
            return res.status(400).send({ status: false, msg: "Description is required"})
        }

        // Validate price
        if(!validator.isValidPrice(price)) {
        // if(typeof price !== "number") {
            return res.status(400).send({status: false, msg: "Invalid number"})
        }

        // Validate currencyId
        if(!validator.isValid(currencyId)) {
            return res.status(400).send({status: false, msg: "currencyId is required"})
        }

        // Validate currencyFormat
        if(!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, msg: "currencyFormat is required"})
        }

        // Validate availableSizes
        if(!validator.isValidSize(availableSizes)) {
            return res.status(400).send({status: false, msg: "Invalid Size"})
        }

        // Checking duplicate entry of title
        let duplicateTitle = await productModel.find({title:title})
        if(duplicateTitle.length != 0) {
            return res.status(400).send({status: false, msg: "Title already exist"})
        }

        let files = req.files;
        if (files && files.length > 0) {
        let uploadedFileURL = await uploadFile( files[0] );

        const product = {
            title, description, price, currencyId: "₹", currencyFormat: "INR",isFreeShipping, productImage: uploadedFileURL, style: style, availableSizes, installments
        }
        let productData = await productModel.create(product)
        return res.status(201).send({status: true, msg:"Product created successfully", data: productData})
        }
        else{
            return res.status(400).send({status: false, msg: "Product image is required"})
        }

    }
    catch (err) {
        console.log("This is the error :", err.msg)
        res.status(500).send({ msg: "Error", error: err.msg })
    }
}







// ******************************** GET /products ************************************************************ //




const getProduct = async function(req,res) {
    try{
        let size = req.query.size
        let name = req.query.name
        let priceGreaterThan = req.query.priceGreaterThan 
        let priceLessThan = req.query.priceLessThan
        let priceSort = req.query.priceSort


        let data = {}

        // To search size
        if(size) {
            let sizeSearch = await productModel.find({availableSizes: size, isDeleted: false}).sort({price: priceSort})

            if(sizeSearch.length !== 0) {
                return res.status(200).send({ status: true, msg: "Success", data: sizeSearch})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }
        }

        // To find products with name
        if(name) {
            let nameSearch = await productModel.find({title: {$regex: name}, isDeleted: false}).sort({price:priceSort})

            if(nameSearch.length !== 0) {
                return res.status(200).send({status: true, msg: "Success", data: nameSearch})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }
        }

        // To find the price
        if(priceGreaterThan) {
            data["$gt"] = priceGreaterThan
        }

        if(priceLessThan) {
            data["$lt"] = priceLessThan
        }

        if(priceLessThan || priceGreaterThan) {
            let searchPrice = await productModel.find({price:data, isDeleted: false}).sort({price: priceSort})

            if(searchPrice.length !== 0) {
                return res.status(200).send({status: true, msg: "Success", data: searchPrice})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }                
        }

        let finalProduct = await productModel.find(data).sort({price: priceSort})
        if(finalProduct !== 0) {
            return res.status(200).send({status: true, msg: "Success", data: finalProduct})
        }
        else{
            return res.status(404).send({status: false, msg: "No product exist"})
        }
        

    }
    catch (err) {
        console.log("This is the error :", err.msg)
        res.status(500).send({ msg: "Error", error: err.msg })
    }
}



//*******************************Get product by id ****************************************************************************




const getProductById = async function(req, res){

try{
     const productId = req.params.productId

     if (!(/^[0-9a-fA-F]{24}$/.test(productId))) {
        return res.status(400).send({ status: false, msg: 'please provide valid product Id' })
      }

     const productDetails = await productModel.findById({ _id: productId,  isDeleted: false})

     if(!productDetails){
        return res.status(404).send({status : false, msg : "Product not found"})
     }

       return res.status(200).send({status : false , msg : "success" , productDetails:productDetails})
    }
catch(err){
    res.status(500).send({msg : err.msg})
    }
}



//***********************************update Product************************************************************************

const updateProduct = async function(req,res) {
    try {
        // Validate body
        const body = req.body
         if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Product details must be present"})
        }

        const params = req.params;


        const {title, description, price, isFreeShipping, style, availableSizes, installments} = body
        const searchProduct = await productModel.findOne({_id: params.productId, isDeleted: false})
        if(!searchProduct) {
            return res.status(404).send({status: false, msg: "ProductId does not exist"})
        }

        let files = req.files;
        if (files && files.length > 0) {
        var uploadedFileURL = await uploadFile( files[0] );
        }
        const finalproduct = {
            title, description, price, currencyId: "₹", currencyFormat: "INR",isFreeShipping, productImage: uploadedFileURL, style: style, availableSizes, installments
        }

        let updatedProduct = await productModel.findOneAndUpdate({_id:params.productId}, finalproduct, {new:true})
        return res.status(200).send({status: true, msg: "Updated Successfully", data: updatedProduct}) 
        
    }
    catch (err) {
        console.log("This is the error :", err.msg)
        res.status(500).send({ msg: "Error", error: err.msg })
    }
}



//**************************************delete Product****************************************************************************

const deleteProduct = async function(req, res){

try{
     const productId = req.params.productId

     if (!(/^[0-9a-fA-F]{24}$/.test(productId))) {
        return res.status(400).send({ status: false, msg: 'please provide valid product Id' })
      }

     const productDetails = await productModel.findById({_id : productId})

     if(!productDetails){
         res.status(404).send({status : false, msg : "Product not found"})
     }

     if(productDetails.isDeleted == true){
         res.status(400).send({status : false, msg : "this product is already deleted"})
     }

     const deleteProduct = await productModel.findOneAndUpdate({_id : productId}, {$set: {isDeleted : true , deletedAt : new Date()} }  ,{new : true} )

     return res.status(200).send({status : true, msg : "Product deleted Successfully."})

    }
    catch(err){
        res.status(500).send({msg : err.msg})
    }

}








module.exports = {createProduct, getProduct, getProductById, updateProduct, deleteProduct}