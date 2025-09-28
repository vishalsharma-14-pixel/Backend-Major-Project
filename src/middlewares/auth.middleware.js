import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

import dotenv from "dotenv";
dotenv.config({ path: './.env' });

    export const verifyJW = asyncHandler(async(req , _ ,next) => {
        try {
            const token = req.cookies?.accessToken  || req.header
            ("Authorization")?.replace("Bearer", "").trim()
        
            if(!token){
                throw new ApiError(401,"Unauthorized requerst")
            }
        
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
            
            if(!user){
                throw new ApiError(401,"Invalid Acess Token")
            }
        
            req.user = user;
            next()
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid access token")
        }
    })
