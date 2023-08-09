const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require("axios");
const fs = require('fs');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const { Posts, Users, Likes, Images,Comments,sequelize, Sequelize } = require('../models');

const uploadDir = './uploads/';

// 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 업로드할 디렉토리 설정
  },
  filename: function (req, file, cb) {
    const now = new Date().toISOString();
    const date = now.replace(/:/g, '-'); // ':' 문자를 '-' 문자로 대체
    cb(null, date + file.originalname); // 저장될 파일명 설정
  }
});

const upload = multer({storage: storage});

dotenv.config();

router.post('/post', upload.array('image', 5), async (req, res) => {
  const images = req.files;
  const { content, musicTitle, musicUrl, tag, latitude, longitude, placeName } = req.body;
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await Users.findOne({ email: decoded.email });

    console.log(tag)

    const post = await Posts.create({
      content,
      musicTitle,
      musicUrl,
      latitude,
      longitude,
      placeName,
      private:false,
      tag,
      userId: user.dataValues.userId
    });
    console.log(images)

    console.log(post.dataValues.postId)

    const imagePromises = images.map((image) => {
      return Images.create({
        url: req.protocol + '://' + req.get('host') + '/' + image.path, // 파일 경로를 URL로 변환
        postId: post.dataValues.postId,
        userId: user.dataValues.userId
      });
    });

    await Promise.all(imagePromises);

    res.status(200).send({ message: 'Post received' });
  } catch(err) {
    console.error(err);
    res.status(500).send({ error: 'Error creating post' });
  }
});

router.get('/user', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await Users.findOne({ email: decoded.email }, { password: 0 }); // 패스워드 필드를 제외

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.send({user});

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).send({ error: 'Error getting user' });
  }
});

router.get('/user/profile', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await Users.findOne({ email: decoded.email }, { password: 0 }); // 패스워드 필드를 제외

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const posts = Array.from({ length: 12 }).map((_, id) => ({
      id: id + 1,
      content: "ㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㅇ",
      musicTitle: "버즈(Buzz) - 가시 [가사/Lyrics]",
      musicUrl: "https://www.youtube.com/watch?v=1-Lm2LUR8Ss",
      tag: "도라에몽, 펀치",
      placeName: "전라남도 완도군 완도읍 신기길 56 3 ",
      latitude: 126.742,
      longitude: 34.3275,
      private: false,
      createdAt: "2023-08-03T07:51:46.000Z",
      updatedAt: "2023-08-03T07:51:46.000Z",
      userId: 1,
      image: {
        url: "https://avatars.githubusercontent.com/u/32028454?v=4"
      }
    }));
    const likePosts = Array.from({ length: 5 }).map((_, id) => ({
      id: id + 1,
      content: "ㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㅇ",
      musicTitle: "버즈(Buzz) - 가시 [가사/Lyrics]",
      musicUrl: "https://www.youtube.com/watch?v=1-Lm2LUR8Ss",
      tag: "도라에몽, 펀치",
      placeName: "전라남도 완도군 완도읍 신기길 56 3 ",
      latitude: 126.742,
      longitude: 34.3275,
      private: false,
      createdAt: "2023-08-03T07:51:46.000Z",
      updatedAt: "2023-08-03T07:51:46.000Z",
      userId: 1,
      image: {
        url: "https://avatars.githubusercontent.com/u/32028454?v=4"
      }
    }));

    res.send({user,posts,likePosts});

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).send({ error: 'Error getting user' });
  }
});

router.patch('/user', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // DB에서 사용자를 찾음
    const user = await Users.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const updates = Object.keys(req.body);

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.send({ user });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ error: 'Error updating user' });
  }
});

router.get('/post/comments/:postId', async (req, res) => {
  try {
    const comments = await Comments.findAll({ postId: req.params.postId });
    res.send({ comments });
  } catch (error) {
    console.error('Error get comments:', error);
    res.status(500).send({ error: 'Error get comments' });
  }
});

router.post('/post/comment', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // DB에서 사용자를 찾음
    const user = await Users.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const comment = await Comments.create({
      content: req.body.content,
      userId: user.dataValues.userId,
      postId: req.body.postId
    });
    res.status(200);
  } catch (error) {
    console.error('Error get comments:', error);
    res.status(500).send({ error: 'Error get comments' });
  }
});

router.get('/post/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Posts.findOne({
      where: {
        postId: postId
      }
    });

    const images = await Images.findAll({
      where: {
        postId: postId
      }
    });

    if (!post) {
      return res.status(404).send({ error: 'Post not found' });
    }

    res.send({post,images});

  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).send({ error: 'Error getting post' });
  }
});

router.post('/api/post/:postId/like', async (req, res) => {
  const { postId } = req.params; // URL 파라미터에서 postId를 추출
  const userId = "1";

  const like = await Likes.findOne({ where: { userId, postId } });

  if (like) {
    await like.destroy();
    res.json({ message: 'Like removed.' });
  } else {
    await Likes.create({ userId, postId });
    res.json({ message: 'Like added.' });
  }
});

// 신고 토글 API
router.post('/api/report/:postId', async (req, res) => {
  //const { userId } = req.body; // 요청 본문에서 userId를 추출
  const { postId } = req.params; // URL 파라미터에서 postId를 추출
  const userId = "1";

  const report = await Reports.findOne({ where: { userId, postId } });

  if (report) {
    await report.destroy();
    res.json({ message: 'Report removed.' });
  } else {
    await Reports.create({ userId, postId });
    res.json({ message: 'Report added.' });
  }
});

router.put('/post/:postId', upload.array('image', 5), async (req, res) => {
  const images = req.files;
  const { content, musicTitle, musicUrl, tag, latitude, longitude, placeName } = req.body;
  const postId = req.params.postId;

  try {
    // Find the existing post
    const post = await Posts.findByPk(postId);

    if (!post) {
      return res.status(404).send({ error: 'Post not found' });
    }

    // Update the post
    await post.update({
      content,
      musicTitle,
      musicUrl,
      latitude,
      longitude,
      placeName,
      private:false,
      tag
    });

    // Delete old images
    await Images.destroy({
      where: {
        postId: postId
      }
    });

    // Add new images
    const imagePromises = images.map((image) => {
      return Images.create({
        url: req.protocol + '://' + req.get('host') + '/' + image.path, // 파일 경로를 URL로 변환
        postId: postId,
        userId: post.dataValues.userId
      });
    });

    await Promise.all(imagePromises);

    res.status(200).send({ message: 'Post updated' });
  } catch(err) {
    console.error(err);
    res.status(500).send({ error: 'Error updating post' });
  }
});

router.get('/youtube/search', async (req, res) => {
  const { term } = req.query;
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        maxResults: 5,
        key: process.env.YOUTUBE_API_KEY,
        q: term,
        type: 'video',
      },
    });

    const items = response.data.items.map(item => {
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
      };
    });

    res.send(items);
  } catch (error) {
    console.error('Error searching YouTube:', error);
    res.status(500).send({ error: 'Error searching YouTube' });
  }
});

router.get('/map/reversegeocode', async (req, res) => {
  const { x, y } = req.query;
  try {
    const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc', {
      params: {
        coords: `${x},${y}`,
        orders: 'roadaddr',
        output: 'json',
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': `${process.env.R_GEO_API_KEY}`,
        'X-NCP-APIGW-API-KEY': `${process.env.R_GEO_API_SECRET_KEY}`,
      },
    });
    res.send(response.data);
  } catch (error) {
    console.error('Error getting geocode:', error);
    res.status(500).send({ error: 'Error getting geocode' });
  }
});

module.exports = router;
