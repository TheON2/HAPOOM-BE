const express = require("express")
const router = express.Router()

const mainRouter = require('../main/main.route');
const userRouter = require('../profiles/profile.route');
const commentRouter = require('../comments/comment.route');
const likeRouter = require('../likes/like.route');
const reportRouter = require('../reports/report.route');
const authRouter = require('../auth/auth.route');
const postRouter = require('../posts/post.route');
const utilRouter = require('../util/util.route');

// 로그인 회원가입 관련
router.use('/auth', authRouter);
// 메인화면 관련
router.use('/main', mainRouter);
// 유저 프로필 관련
router.use('/user', userRouter);
// 게시글, 댓글, 좋아요 관련
router.use('/post', [postRouter, commentRouter, likeRouter]);
// 신고 관련
router.use('/report', reportRouter);
// 유틸 관련 [api관련]
router.use('/util', utilRouter);

module.exports = router;
