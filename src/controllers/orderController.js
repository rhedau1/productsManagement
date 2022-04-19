const validator = require('../validator/validator')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel');


// create order
const createOrder = async function (req, res) {
    try {

        let userId = req.params.userId
        let orderBody = req.body
        let tokenUserId = req.userId

        if (!validator.isValidobjectId(userId.trim())) {
            return res.status(400).send({ status: false, message: 'Please provide valid user id in Params' })
        }

        let user = await userModel.findById(userId)

        if (!user) {
            return res.status(400).send({ status: false, message: `Provided UserId ${userId} does not exists` })
        }

      
        if (!validator.isValidBody(orderBody)) {
            return res.status(400).send({ status: false, message: 'Provide a order details in body to add craete a order' })
        }
        
        let { cartId, cancellable, status } = orderBody

        if (!cartId) {
            return res.status(400).send({ status: false, message: 'for create a order you have to put a cartId in body' })
        }

        if (!validator.isValidobjectId(cartId.trim())) {
            return res.status(400).send({ status: false, message: 'Please provide valid card id in body' })
        }

        const findCart = await cartModel.findOne({ _id: cartId, userId: userId })

        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't belongs to ${userId}` })
        }

        if (cancellable) {
            if ((typeof (cancellable) != 'boolean')) {
                return res.status(400).send({ status: false, message: 'Cancellable must be boolean , either true or false' })
            }
        }

        let arr = ['pending', 'completed', 'cancelled']
        if (status) {
            if(!(arr.includes(status))) {
                return res.status(400).send({ status: false, message: `Status must be among [${arr}]` })
            }
        }

        if (findCart.items.length==0) {
            return res.status(202).send({ status: false, message: 'Please add some products in cart to make an order'})
        }

        let count = 0
        for(let i=0; i<findCart.items.length; i++) {
            count = count + findCart.items[i].quantity
        }

        const orderDetails = { 
            userId: userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: count,
            cancellable,
            status,
        }

        const order = await orderModel.create(orderDetails)

        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, {$set: { items: [], totalPrice: 0, totalItems: 0 } })

        return res.status(200).send({ status: true, message: 'Order placed', data: order })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



// update order
const updateOrder = async function (req, res) {
    try {

        let userId = req.params.userId
        let updateBody = req.body
        let tokenUserId = req.userId

        if (!validator.isValidobjectId(userId.trim())) {
            return res.status(400).send({ status: false, message: 'Please provide valid user id in Params' })
        }

        let user = await userModel.findById(userId)

        if (!user) {
            return res.status(400).send({ status: false, message: `Provided UserId ${userId} Does not exists` })
        }
        
        
        if (!validator.isValidBody(updateBody)) {
            return res.status(400).send({ status: false, message: 'Provide a orderId in body to update a order' })
        }

        const { orderId, status } = updateBody

        if (!orderId) {
            return res.status(400).send({ status: false, message: 'for update a order you have to provide a orderId in body' })
        }
        
        if (!validator.isValidobjectId(orderId.trim())) {
            return res.status(400).send({ status: false, message: 'Please provide valid order id in body' })
        }

        let findOrder = await orderModel.findOne({ _id: orderId, userId: userId }) 

        if(!findOrder) {
            return res.status(404).send({ status: false, message: 'order not found' })
        }

        let arr = ['pending', 'completed', 'cancelled']

        if (!validator.isValid(status)) {
            return res.status(400).send({ status: false, message: 'status is required for order updation' })
        }

        if (!(arr.includes(status))) {
            return res.status(400).send({ status: false, message: `Status must be among [${arr}]` })
        }

        if (findOrder.cancellable == true) {

            if (findOrder.status == 'pending') {

                const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })

                return res.status(200).send({ status: true, message: 'Successfully updated the order details', data: updateStatus })
            }

            if (findOrder.status == 'completed') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in completed status.` })
            }

            if (findOrder.status == 'cancelled') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in cancelled status.` })
            }
        }


        if (findOrder.cancellable == false) {

            if (updateBody.status == 'cancelled') {
                return res.status(400).send({ status: false, message: 'You cannot cancel this order, because its not cancellable' })
            }

            if (findOrder.status == 'pending') {

                const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })

                return res.status(200).send({ status: true, message: 'Successfully updated the order details', data: updateStatus })
            }

            if (findOrder.status == 'completed') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in completed status` })
            }

            if (findOrder.status == 'cancelled') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in cancelled status` })
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder