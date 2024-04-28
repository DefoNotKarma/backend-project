import { Router } from "express";
import {
    UpdateUserAvatar, 
    UpdateUserCover, 
    UpdateUserDetails, 
    changePassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser 
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    //middleware injection
    upload.fields([
        {
            "name" : "avatar",
            maxCount : 1
        },
        {
            "name" : "coverImage",
            maxCount : 1
        }
    ]),
    //param of post, function to execute when url is ../register
    registerUser
)

router.route("/login").post(
    loginUser
)

// Secured Router :

router.route("/logout").post(verifyJWT ,logoutUser)
        // runs verifyJWT method, 
        // next() func is called in verifyJWT,
        // logoutUser is run when next() is hit

router.route("/refreshToken").post(refreshAccessToken)

router.route("/changePassword").post(verifyJWT, changePassword)

router.route("/getUser").get(verifyJWT, getCurrentUser)

router.route("/updateAccount").patch(verifyJWT, UpdateUserDetails)

router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    UpdateUserAvatar)

router.route("/cover").patch(
        verifyJWT,
        upload.single("cover"),
        UpdateUserCover)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)



export default router;