const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const middleware = require("../middleware/auth");
const productController = require("../controllers/productController")

router.post("/register", userController.createUser);

router.post("/login", userController.userLogin);

router.get("/user/:userId/profile", middleware.authenticate, middleware.authorise,  userController.getUserById);

router.put("/user/:userId/profile", middleware.authenticate, middleware.authorise, userController.updateUser)



//***************product apis*************************************************************





router.post("/products", productController.createProduct)








module.exports = router;
