const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            ref: "user",
        },

        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    unique: true,
                    ref: "product",
                },
                quantity: { type: Number, required: true, minlength: 1 },
            },
        ],

        totalPrice: {
            type: Number,
            required: true,
            comment: "Holds total price of all the items in the cart",
        },
        totalItems: {
            type: Number,
            required: true,
            comment: "Holds total number of items in the cart",
        },
        totalQuantity: {
            type: Number,
            required: true,
            comment: "Holds total number of items in the cart",
        },
        cancellable: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            default: false,
            enum: ["pending", "completed", "cancelled"],
        },

        isdeleted: {
            type: Boolean,
            default: false,
        },
    },

    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);