import { Router } from 'express';
import { loggedOutUser, loginUser, registerUser } from '../controller/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJW } from '../middlewares/auth.middleware.js';
import { refreshAccessToken } from '../controller/user.controller.js';

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJW, loggedOutUser)

router.route("/refresh_token").post(refreshAccessToken)

export default router