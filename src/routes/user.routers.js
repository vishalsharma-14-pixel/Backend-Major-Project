import { Router } from 'express';
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loggedOutUser, loginUser, registerUser, updateAccountDetails, updateUserCoverImage , updateUserAvatar , generateAccessAndRefreshToken } from '../controller/user.controller.js';
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
router.route("/change-password").post(verifyJW, changeCurrentUserPassword)
router.route("/current-user").get(verifyJW, getCurrentUser)
router.route("/update-account").patch(verifyJW, updateAccountDetails)
router.route("/update-avatar").patch(verifyJW, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJW, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJW, getUserChannelProfile)
router.route("/history").get(verifyJW, getWatchHistory)

export default router