import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

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

export default router;