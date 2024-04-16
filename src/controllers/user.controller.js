import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinay.js";
import { ApiResponse } from "../utils/apiResponse.js";


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

    
    
    // 1.
    const {fullname, username, email, password} = req.body
    console.log(
        "email" , email,
        "\n username", username,
        "\n fullname", fullname,
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
    const existedUser = User.findOne({
        $or : [{ email } , { username }]
    })

    if (existedUser){
      throw new ApiError(409, "User already exists");
    }

    //4.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImgLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    //5.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const cover = await uploadOnCloudinary(coverImgLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
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
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken" 
        //by default everything is selected
    ) 

    //8.
    if(!createdUser){
        throw new ApiError(500,
             "Something went wrong during user creation")
    }

    //9.
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered")
    )

}) 

export {registerUser}