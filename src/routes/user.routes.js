import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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

export default router;