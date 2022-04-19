const express = require("express");
const router = express.Router();
const middleware = require("../middleware/auth");
const userController = require("../controllers/userController");
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")




//**********************************user apis******************************************************************



router.post("/register", userController.createUser);

router.post("/login", userController.userLogin);

router.get("/user/:userId/profile", middleware.authenticate, middleware.authorise,  userController.getUserById);

router.put("/user/:userId/profile", middleware.authenticate, middleware.authorise, userController.updateUser)



//********************************product apis************************************************************************



router.post("/products", productController.createProduct)

router.get("/products", productController.getProduct)

router.get("/products/:productId", productController.getProductById)

router.put("/products/:productId", productController.updateProduct)

router.delete("/products/:productId", productController.deleteProduct)



//******************************cart apis*****************************************************************************



router.post("/users/:userId/cart" ,  middleware.authenticate, middleware.authorise, cartController.creatingCart)

router.put("/users/:userId/cart", middleware.authenticate, middleware.authorise, cartController.updateCart)

router.get("/users/:userId/cart", middleware.authenticate, middleware.authorise, cartController.getCart)

router.delete("/users/:userId/cart", middleware.authenticate, middleware.authorise, cartController.deleteCart)



//*********************************order apis**********************************************************************



router.post("/users/:userId/orders",  middleware.authenticate, middleware.authorise, orderController.createOrder)

router.put("/users/:userId/orders",  middleware.authenticate, middleware.authorise,  orderController.updateOrder)




module.exports = router;
