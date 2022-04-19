const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel")


let authenticate= async function (req,res,next){
    try{
        let token = req.headers['x-api-key']
        if(!token)
        return res.status(400).send({status: false, msg: "please provide token" })
        
        let validateToken = jwt.verify(token, 'my-secret')
        if(!validateToken)
        return res.status(401).send({status: false, msg: "authentication failed"})
        
        next()
    } 
    catch (err) {  
        return res.status(500).send({ status : false, error: err.msg })
    }
    }

let authorise= async function (req,res,next){
    try{
        let id = req.params.userId
        let jwtToken = req.headers['x-api-key']

        if(!jwtToken)
        return res.status(400).send({status: false, msg: "please provide token" })
    
        let userInfo = await userModel.findById(id)
        if(!userInfo)
        return res.status(400).send({status: false, msg: "please provide valid user ID"})
        
        if(userInfo.isDeleted == true)
        return res.status(404).send({status: false, msg: "no such user found"})
  
        let verifiedToken = jwt.verify(jwtToken, 'my-secret')

        if(verifiedToken.userId != userInfo.userId)

        return res.status(403).send({status: false, msg: "unauthorize access "})

        next()
    }
    catch (err) {
        return res.status(500).send({ status : false, error: err.msg })
    }
}
    

module.exports = {authenticate , authorise }
