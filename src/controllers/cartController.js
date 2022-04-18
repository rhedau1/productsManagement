const cartModel = require("../models/cartModel")
const validator = require("../validator/validator")
const userModel = require("../models/userModel")
const productModel = require("../Models/productModel")



const creatingCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const { quantity, productId } = requestBody;

        if (!validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }

        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        }

        if (!(validator.isValidobjectId(productId) || !validator.isValid(productId))) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
        }

        if (!(validator.validQuantity(quantity))) {
            return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
        }

        const findUser = await userModel.findById({ _id: userId });

        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
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
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + req.body.quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;

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
                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
                }
            }
            arr.push({ productId: productId, quantity: quantity });

            let updatedCart = {
                items: arr,
                totalPrice: price,
                totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
            return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
        }

    } catch (error) {
        res.status(500).send({ status: false, data: error.message });
    }
};






const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." });
        }
        const findUser = await userModel.findById({ _id: userId });
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} ` });
        }
        const findCart = await cartModel.findOne({ userId: userId }).populate("items.productId", {
            _id: 1,
            title: 1,
            price: 1,
            productImage: 1,
            availableSizes: 1,
        }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 });

        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId} ` });
        }

        return res.status(200).send({ status: true, message: "Successfully fetched cart.", data: findCart });
    } catch (err) {
        return res.status(500).send({ status: false, message: "Error is : " + err });
    }
};





const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params " });
        }
        const findUser = await userModel.findById({ _id: userId });
        if (!findUser) {
            return res.status(400).send({ status: false, message: "User does not exits by ${userId}" });
        }

        const findCart = await cartModel.findOne({ userId: userId });
        if (!findCart) {
            return res.status(400).send({ status: false, message: "Cart doesn't exits by ${userId}" });
        }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId },
            {
                $set: {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                },
            }, { new: true }).select({ items: 1, totalPrice: 1, totalItems: 1, _id: 0 });
        return res.status(200).send({ status: true, message: "Cart deleted successfully", data: deleteCart });

    }
    catch (err) {
        return res.status(500).send({ status: false, message: "Error is :" + err });
    }
}





module.exports = {creatingCart, getCart, deleteCart}

