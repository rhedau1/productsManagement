const productModel = require("../models/productModel")
const aws = require("aws-sdk")

const validator = require("../validator/validator");

const currencySymbol = require("currency-symbol-map")

//--------------aws------------------


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
  


// productCreation
const productCreation = async function (req, res) {
    try {

        let files = req.files;
        let productBody = req.body;

        if (!validator.isValidBody(productBody)) {
            return res.status(400).send({ status: false, message: 'Please provide valid product body' })
        }

        let { title, description, productImage, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = productBody

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: 'Title is required' })
        }
        const titleAleadyUsed = await productModel.findOne({ title })
        if (titleAleadyUsed) {
            return res.status(400).send({ status: false, message: `${title} is alraedy in use. Please use another title` })
        }

        if (!validator.isValidBody(files)) {
            return res.status(400).send({ status: false, message: 'Product Image is required' })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: 'Description is required' })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: 'Price is required' })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: 'currencyId is required' })
        }

        if (currencyId != 'INR') {
            return res.status(400).send({ status: false, message: 'currencyId should be INR' })
        }

        if (!validator.isValid(currencyFormat)) {
            currencyFormat = currencySymbol('INR')
        }
        currencyFormat = currencySymbol('INR')


        if (style) {
            if (!validator.validString(style)) {
                return res.status(400).send({ status: false, message: 'style is required' })
            }
        }

        if (installments) {
            if (!validator.isValid(installments)) {
                return res.status(400).send({ status: false, message: 'installments required' })
            }
        }
        if (installments) {
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({ status: false, message: `installments can't be a decimal number` })
            }
        }

        if (isFreeShipping) {
            if (!(isFreeShipping != true)) {
                return res.status(400).send({ status: false, message: 'isFreeShipping must be a boolean value' })
            }
        }

        
                if (files && files.length > 0) {
                let productImage = await uploadFile( files[0] );
        // productImage = await uploadFile(files[0])

        const productData = { title, description, productImage, price, currencyId, currencyFormat: currencyFormat, isFreeShipping, style, availableSizes, installments, productImage: productImage }
        
        if (availableSizes) {
            let size = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < size.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
                }
            }
            if (size) {
                productData.availableSizes = size
            }
        }
        const saveProductDetails = await productModel.create(productData)
        return res.status(201).send({ status: true, message: 'Successfully saved product details', data: saveProductDetails })

    }
 }
 catch (error) {
        return res.status(500).send({ status: false, message: error.message})
    }
}


// getAllProducts
const getAllProducts = async function(req,res) {
    try {
        const queryParams = req.query
        const body = req.body

        if(validator.isValidBody(body)) {
            return res.status(400).send({ status: false, message: `Don't you understand about query params` })
        }

        const { name, priceGreaterThan, priceLessThan, priceSort, size } = queryParams

        const product = {}

        if(size) {

            const searchSize = await productModel.find({availableSizes: size, isDeleted: false}).sort({price: priceSort})

            if(searchSize.length !== 0) {
                return res.status(200).send({ status: true, message: 'Success', data: searchSize})
            }
            else {
                return res.status(400).send({status: false, message: `product not found with this ${size}`})
            }
        }

        if(name) {
            const searchName = await productModel.find({title: {$regex: name}, isDeleted: false}).sort({price: priceSort})

            if(searchName.length !== 0) {
                return res.status(200).send({status: true, message: 'Success', data: searchName})
            }
            else {
                return res.status(400).send({status: false, message: `product not found with this ${name}`})
            }
        }

        if(priceGreaterThan) {
            product["$gt"] = priceGreaterThan
        }

        if(priceLessThan) {
            product["$lt"] = priceLessThan 
        }

        if(priceLessThan || priceGreaterThan) {
            const searchPrice = await productModel.find({price: product, isDeleted: false}).sort({price: priceSort})

            if(searchPrice.length !== 0) {
                return res.status(200).send({status: true, message: 'Success', data: searchPrice})
            }
            else {
                return res.status(400).send({status: false, message: 'product not found with this range' })
            }                
        }

        const Products = await productModel.find({data: product, isDeleted: false}).sort({price: priceSort})
        if(Products !== 0) {
            return res.status(200).send({status: true, message: 'Success', count: Products.length, data: Products})
        }
        else {
            return res.status(404).send({status: false, message: 'No product exist in database'})
        }
    }
    catch (error) {
        res.status(500).send({status: false, error: error.message })
    }
}



// getProductsById
const getProductsById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidobjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, message: 'product does not exists' })
        }

        return res.status(200).send({ status: true, message: 'Product found successfully', data: product })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// updateProduct
const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) {
            return res.status(400).send({ status: false, message: 'Please provide valid product id in Params' })
        }

        let product = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            return res.status(400).send({ status: false, message: `Provided ProductId ${productId} Does not exists` })
        }

        let updateBody = req.body

        let { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = updateBody
        
        let files = req.files
        if(files) {
        if (Object.keys(files).length != 0) {
            const updateProductImage = await aws.uploadFile(files[0]);
            updateBody.productImage = updateProductImage;
        }
        }

        if (!validator.isValidBody(updateBody)) {
            return res.status(400).send({ status: false, message: 'Please, provide some data to update' })
        }

        if (!validator.validString(title)) {
            return res.status(400).send({ status: false, message: 'Title cannot be empty' })
        }

        let duplicateTitle = await productModel.findOne({ title: title })

        if (duplicateTitle) {
            return res.status(400).send({ status: false, message: 'Title is already exist' })
        }

        if (!validator.validString(description)) {
            return res.status(400).send({ status: false, message: 'Description cannot be empty' })
        }

        if (!validator.validString(currencyId)) {
            return res.status(400).send({ status: false, message: 'currencyId cannot be empty' })
        }

        if (currencyId) {
            if (!(currencyId == 'INR')) {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
        }
    }
        if (!validator.validString(style)) {
            return res.status(400).send({ status: false, message: 'style cannot be empty' })
        }

        if (!validator.validString(installments)) {
            return res.status(400).send({ status: false, message: 'installments cannot be empty' })
        }

        if(installments) {
            if (installments % 1 != 0) {
                return res.status(400).send({ status: false, message: 'installments cannot be a decimal value' })
            }
        }
        if (!validator.validString(price)) {
            return res.status(400).send({ status: false, message: 'price cannot be empty' })
        }

        if (Number(price) <= 0) {
            return res.status(400).send({ status: false, message: 'Price should be a valid number' })
        }

        if (!validator.validString(isFreeShipping)) {
            return res.status(400).send({ status: false, message: 'isFreeShipping cannot be empty' })
        }
        if (isFreeShipping) {
            if (!((isFreeShipping === 'true') || (isFreeShipping === 'false'))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }
        }

        let arr = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
        if (availableSizes == 0) {
            return res.status(400).send({ status: false, message: 'availableSizes cannot be empty' })
        }
        if (availableSizes) {
            let sizeArr = availableSizes.split(',').map(x => x.trim())
            for (let i = 0; i < sizeArr.length; i++) {
                if (!(arr.includes(sizeArr[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among [${arr}]` })
                }
            }
            updateBody.availableSizes = sizeArr
        }

        let updatedProduct = await productModel.findOneAndUpdate({ _id: productId },
            {
                $set:
                {
                    title: title,
                    description: description,
                    price: price,
                    currencyId: currencyId,
                    isFreeShipping: isFreeShipping,
                    style: style,
                    availableSizes: availableSizes,
                    productImage: updateBody.productImage,
                    installments:installments
                }
            }, { new: true })
        return res.status(201).send({ status: true, product: updatedProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


// deleteProduct
const deleteProduct = async function(req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidobjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, message: `Product doesn't exists by ${productId}` })
        }

        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })

            return res.status(200).send({ status: true, message: 'Product deleted successfully' })
        }
        return res.status(400).send({ status: true, message: 'Product has been already deleted' })
    } 
    catch (error) {
        return res.status(500).send({ status: false, message: error.message})
    }
}

module.exports.productCreation = productCreation
module.exports.getAllProducts = getAllProducts
module.exports.getProductsById = getProductsById
module.exports.updateProduct = updateProduct
module.exports.deleteProduct = deleteProduct