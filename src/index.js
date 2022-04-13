const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const route = require('./routes/route');
const multer = require('multer');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // postman hedader content type header hota hai
 // verify krra hia k header or raw me jo b data bhej rahe ho to vo same hona chaiye
 app.use(multer().any());
mongoose.connect("mongodb+srv://thorium-cohort:qwertyuiop@cluster0.xyklh.mongodb.net/group39Database?authSource=admin&replicaSet=atlas-wc30tm-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true", { useNewUrlParser: true })
    .then(() => console.log("MongoDB is connected"))
    .catch(err => console.log(err))

app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log("Express app in running on PORT " + (process.env.PORT || 3000))
});

// salt ko main password se mix krte hai is process ko hasing kehte hai
