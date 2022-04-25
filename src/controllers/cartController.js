const cartModel = require("../models/cartModel")
const validator = require("../validator/validator")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")




//************************************CREATE CART***********************************************************************





const creatingCart = async (req, res) => {
    try {
        const userId = req.params.userId;   
        const requestBody = req.body;
        const { productId, quantity } = requestBody;


        if (!validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please provide valid request body" });
        }

        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Please provide valid User Id" });
        }

        if (!(validator.isValidobjectId(productId) || validator.isValid(productId))) {
            return res.status(400).send({ status: false, msg: "Please provide valid Product Id" });
        }

        if (!(validator.validQuantity(quantity))) {
            return res.status(400).send({ status: false, msg: "Please provide valid quantity & it must be greater than zero." });
        }

        const findUser = await userModel.findById({ _id: userId });

        if (!findUser) {
            return res.status(400).send({ status: false, msg: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) {
            return res.status(400).send({ status: false, msg: `Product doesn't exist by ${productId}` });
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId });

        if (!findCartOfUser) {
            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity,
                    },
                ],
                totalPrice: findProduct.price * quantity,
                totalItems: 1,
               
            };
            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, msg: `Cart created successfully`, data: createCart });
        }

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + req.body.quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;
                    //arr[i].quantity = arr[i].quantity + quantity

                    let updatedCart = {
                        items: arr,
                        totalPrice: price,
                        totalItems: arr.length,
                    };

                    let responseData = await cartModel.findOneAndUpdate(
                        { _id: findCartOfUser._id },
                        updatedCart,
                        { new: true }
                    );
                    return res.status(200).send({ status: true, msg: `Product added successfully`, data: responseData });
                }
            }
            arr.push({ productId: productId, quantity: quantity });

            let updatedCart = {
                items: arr,
                totalPrice: price,
                totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
            return res.status(200).send({ status: true, msg: `Product added successfully`, data: responseData });
        }

    } catch (error) {
        res.status(500).send({ status: false, data: error.msg });
    }
};






//*****************************************UPDATE CART***********************************************************************






const updateCart = async function (req, res) {
    try {
      let userId = req.params.userId
      
      if (!validator.isValidobjectId(userId)) {
        return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
      }
  

      let data = req.body
      const { cartId, productId, removeProduct } = data
  
      if (!validator.isValidBody(data)) {
        return res.status(400).send({ status: false, msg: "Enter value to be updating.." })
      }
      if (!validator.isValid(cartId)) {
        return res.status(400).send({ status: false, msg: "cartId is required" })
      }
      if (!validator.isValidobjectId(cartId)) {
        return res.status(400).send({ status: false, msg: "cartId is not a valid objectId" })
      }
      if (!validator.isValid(productId)) {
        return res.status(400).send({ status: false, msg: "productId is required" })
      }
      if (!validator.isValidobjectId(productId)) {
        return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
      }
      if (!(removeProduct == 0 || removeProduct == 1)) {
        return res.status(400).send({ status: false, msg: "removeProduct value should be either 0 or 1" })
      }
  
      const userDetails = await userModel.findOne({ _id: userId })
      if (!userDetails) {
        return res.status(404).send({ status: false, msg: "user not exist with this userId" })
      }
      const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
      if (!productDetails) {
        return res.status(404).send({ status: false, msg: "product not exist or deleted" })
      }
      const cartDetails = await cartModel.findOne({ _id: cartId })
      if (!cartDetails) {
        return res.status(400).send({ status: false, msg: "cart is not added for this cardId, create cart first" })
      }
  
      if (removeProduct == 1) {
        for (let i = 0; i < cartDetails.items.length; i++) {
          if (cartDetails.items[i].productId == productId) {
            let newPrice = cartDetails.totalPrice - productDetails.price
            if (cartDetails.items[i].quantity > 1) {
              cartDetails.items[i].quantity -= 1
              let updateCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice }, { new: true })
              return res.status(200).send({ status: true, msg: "cart updated successfully", data: updateCartDetails })
            }
            else {
              totalItem = cartDetails.totalItems - 1
              cartDetails.items.splice(i, 1)
  
              let updatedDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice, totalItems: totalItem }, { new: true })
              return res.status(200).send({ status: true, msg: "cart removed successfully", data: updatedDetails })
            }
          }
        }
      }
  
      if (removeProduct == 0) {
        for (let i = 0; i < cartDetails.items.length; i++) {
          if (cartDetails.items[i].productId == productId) {
            let newPrice = cartDetails.totalPrice - (productDetails.price * cartDetails.items[i].quantity)
            let totalItem = cartDetails.totalItems - 1
            cartDetails.items.splice(i, 1)
            let updatedCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalItems: totalItem, totalPrice: newPrice }, { new: true })
            return res.status(200).send({ status: true, msg: "item removed successfully", data: updatedCartDetails })
          }
        }
      }
  
    }
    catch (error) {
      return res.status(500).send({ status: false, msg: error.msg })
    }
  }
  





//*****************************************DELETE CART************************************************************************






const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId in params." });
        }
        const findUser = await userModel.findById({ _id: userId });
        if (!findUser) {
            return res.status(400).send({ status: false, msg: `User doesn't exists by ${userId} ` });
        }
        const findCart = await cartModel.findOne({ userId: userId }).populate("items.productId", {
            _id: 1,
            title: 1,
            price: 1,
            productImage: 1,
            availableSizes: 1,
        }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

        if (!findCart) {
            return res.status(400).send({ status: false, msg: `Cart doesn't exists by ${userId} ` });
        }

        return res.status(200).send({ status: true, msg: "Successfully fetched cart.", data: findCart });
    } catch (err) {
        return res.status(500).send({ status: false, msg: "Error is : " + err });
    }
};







//***************************************DELETE CART*************************************************************************






const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId in params " });
        }
        const findUser = await userModel.findById({ _id: userId });
        if (!findUser) {
            return res.status(400).send({ status: false, msg: `User does not exits by ${userId}` });
        }

        const findCart = await cartModel.findOne({ userId: userId });
        if (!findCart) {
            return res.status(400).send({ status: false, msg: `Cart doesn't exits by ${userId}` });
        }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId },
            {
                $set: {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                },
            }, { new: true }).select({ items: 1, totalPrice: 1, totalItems: 1, _id: 0 });
        return res.status(200).send({ status: true, msg: "Cart deleted successfully", data: deleteCart });

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message});
    }
}





module.exports = {creatingCart, getCart, deleteCart , updateCart}

