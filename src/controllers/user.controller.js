import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.models.js";
import { deleteSingleFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinay.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";


const registerUser = asyncHandler(async (req, res) => {
    //1- get user details from frontend
    //2 - validations - not empty
    //3 - check is user already exists : username or email
    //4 - check if files are available - avatar is required
    //5 - upload to cloudinary
    //6 - create user object - create entry in db
    //7 - remove passwords and refresh tokens from response
    //8 - check for user creation
    //9 - return response

    console.log("request body : " , req.body)
    
    // 1.
    const {fullname, username, email, password} = req.body
    console.log(
        "username", username,
        "\n fullname", fullname,
        "\n email" , email,
        "\n password", password
    );

    //2.
    if (
        [fullname, username, email, password].some(
            (field) => field?.trim() === "" )
       ){
       throw new ApiError(400, "All fields are required");
        }
    //can add more validations
    
    //3.
    const existedUser = await User.findOne({
        $or : [{ email } , { username }]
    })

    if (existedUser){
      throw new ApiError(409, "User already exists");
    }

    //4.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImgLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) 
        && req.files.coverImage.length > 0){
            coverImgLocalPath = req.files.coverImage[0].path
    }

    console.log("request files : " , req.files)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    //5.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const cover = await uploadOnCloudinary(coverImgLocalPath)

    console.log(avatar);

    if(!avatar){
        throw new ApiError(400, "Avatar Not Uploaded");
    }

    //6.
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : cover?.url || "" ,
        email,
        password,
        username : username.toLowerCase()
    })

    //7.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
        //by default everything is selected
    ) 

    //8.
    if(!createdUser){
        throw new ApiError(500,
             "Something went wrong during user creation")
    }

    //9.
    console.log("\nUser", user.username, "has been regsitered")
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered")
    )
}) 

const generate_Access_And_Refresh_Token = async(userID) => {
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false }) 

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,
        "Something went wrong while generating ref and acc tokens")
    }
}

const loginUser = asyncHandler( async (req, res) => {
    // 1 - get user details from req.body
    // 2 - validate that fields are not empty (username or email)
    // 3 - check if user exists : if not return cant 
    // 4 - check password
    // 5 - generate access and refresh tokens
    // 6 - give user the tokens via secure cookies


    //1.
    const {email, username, password} = req.body

    if (!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if (!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPassValid = await user.isPasswordCorrect(password)


    if (!isPassValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generate_Access_And_Refresh_Token(user._id)

    const LoggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }   // cookie settings, can only be edited by backend


    return res.status(200)
    .cookie("accessToken" , accessToken, options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200,
           { user : LoggedInUser, refreshToken, accessToken},
           "User Logged In Successfully"
           // json if user wants his cookies ( not imp ) 
        ) 
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {} ,
                    "User Logged out Successfully")
            )
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = 
    req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = 
        jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            throw new ApiError(401, 
                "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, 
                "Refresh Token is Expired or Used")
        }
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken } =
        await generate_Access_And_Refresh_Token(user._id)
    
        return response.status(400)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken" , newRefreshToken)
        .json(new ApiResponse(
            200,
            {
                accessToken, refreshToken : newRefreshToken
            },
            "Access Token Refreshed"
        ))
    
    } catch (error) {
        throw new ApiError(401, 
        error?.message || "Invalid Refresh Token somewhere")
    }

})

const changePassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =
    await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200)
    .json(
        new ApiResponse(200, {} , "Password Changed Successfully")
    )

})

const getCurrentUser = asyncHandler( async (req, res) => {
    try {
        return res.status(200)
                .json(200, req.user, "Current User Fetched")
    } catch (error) {
        throw new ApiError(500, "Couldnt Fetch User")
    }
})

const UpdateUserDetails = asyncHandler(async (req, res) => {

    const {fullname, email} = req.body;

    if (!fullname || !email){
        throw new ApiError(400, "FullName and Email are Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname : fullname,
                email : email
            }
        },
        {new : true} // returns info after updation
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details Updated"))
})

const UpdateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const oldImgUser = await User.findById(req.user?._id);
    

    // deleting prev image from cloudinary

    if (oldImgUser){
        const oldImgURL = oldImgUser.avatar;
        await deleteSingleFileFromCloudinary(oldImgURL);
    }else{
        throw new ApiError(512, "Avatar Deletion error")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500, "Avatar Uploading error")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated in DB"))

})

const UpdateUserCover = asyncHandler(async (req, res) => {

    const coverImgLocalPath = req.file?.path

    if(!coverImgLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImgLocalPath)

    if(!coverImage.url){
        throw new ApiError(500, "Cover Image Uploading error")
    }

    const oldImgUser = await User.findById(req.user?._id);

    
    // deleting prev image from cloudinary

    if (oldImgUser){
        const oldImgURL = oldImgUser.coverImage;
        await deleteSingleFileFromCloudinary(oldImgURL);
    }else{
        throw new ApiError(512, "CoverImage Deletion error")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated in DB"))

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    UpdateUserDetails,
    UpdateUserAvatar,
    UpdateUserCover
}