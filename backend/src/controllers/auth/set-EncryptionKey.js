import User from "../../models/user-model.js"
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js"

 export const EncryptionKeys= async (req,res)=>{
    try {
        const userId= extractAuthenticatedUserId(req)
     if(!userId){
        return res.json({
            success:false,
            message:"User not authenticated"

        })
     }
      const fetchUser= await User.findById(userId).select("publicKey privateKey")
      if (!fetchUser){
        return res.json({
            success:false,
            message:"User not found"
        })  
      }

      res.json({
         success:true,
         publicKey:fetchUser.publicKey,
         privateKey:fetchUser.privateKey
      
      })
       
        
    }catch(error) {
       res.json({
        status:false,
        message:error.message
       }) 
    }
 }