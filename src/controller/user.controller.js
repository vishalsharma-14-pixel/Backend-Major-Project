import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose,{Schema}  from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req , res) => {
    //1 get user datails from frontend 
    //2  validation not empty
    //3  check if user already exists
    //4  check for images ,check for avatar
    //5  upload them to cloudinary, avatar
    //6  create user object - create entry in db
    //7  remove password and refresh token field from response 
    //8  check for user creation 
    //9  return res


    const {fullName , email , username , password } = req.body 
    // console.log ("email", email);

    // if(
    //     [fullName, email, username, password].some((field) =>
    //     field?.trim() === "") 
    // ){
    //     throw new ApiError(400, "All fields are required")
    // }

    if(fullName === ""){
        throw new ApiError(400,"fullname is required")
    }
     if(email === ""){
        throw new ApiError(400,"Email is required")
    }
     if(username === ""){
        throw new ApiError(400,"Username is required")
    }
     if(password === ""){
        throw new ApiError(400,"Password is required")
    }
// 3 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    //console.log("existedUser",existedUser);
    
    if(existedUser){
        throw new ApiError(409, "USer with email or username already exists")
    }

// 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
//     console.log(req.files);
// console.log(req.body);
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && 
    req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

// 5

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     
    if(!avatar){
         throw new ApiError(400,"Avatar file is required")
    }
    
// 6

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

// 7

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

// 8 

    if(!createdUser){
        throw new ApiError(500 ,"Something went wrong while registering the user")
    }

// 9

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Sucessfully!")
    )
})

const loginUser = asyncHandler(async (req , res) => {
    // req body -> data
    // username or email 
    // find user
    // password check
    // access and refresh token 
    // send cookies

    const {email , username , password } = req.body

    if(!(username || email)){
        throw new ApiError(400,"Username or email required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(200,
            { 
                user: loggedInUser, accessToken, refreshToken
            },
         "User logged in successfully"
        )
    )


})

const loggedOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 // remove the refresh token from db
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {} ,"User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentUserPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed sucessfully"))
})

const getCurrentUser = asyncHandler(async(req, res) =>{
    return res 
    .status(200)
    .json(200, req.user, "Current user fetched sucessfully")
})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName , email} =req.body

    if(!fullName || !email){
        throw new ApiError(400, "fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {   
           $set: {
            fullName,
            email: email
            }
        },
        {new: true} // return the updated user 
    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated sucessfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = res.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
         throw new ApiError(400, "Error while uploading the avatar file")
    }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponse(200, user, "avatarImage  updated sucessfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = res.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
         throw new ApiError(400, "Error while uploading the coverImage file")
    }

     const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated sucessfully"))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is misssing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channal",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberdTo"
            }
        },
        {
            $addFields:{
                subscribersCounts: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscriberdTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},// check if current user id is in the list of subscribers
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCounts: 1,
                channelsSubscribedToCount: 1,
                isSubscribed:1 ,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 ,channel[0], "channel fetched sucessfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project:{
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
         user[0].watchHistory,
         "Watch history fetched sucessfully")
    )
})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    generateAccessAndRefreshToken
}
