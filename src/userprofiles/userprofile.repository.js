const { Posts, Users, Likes, sequelize, Sequelize } = require('../models');

class UserprofileRepository {
  userPosts = async (userId) => {
    const userPosts = await Posts.findAll({
      where: { userId },
      include: { model: Users, attributes: ['nickname', 'userImage'] },
    });
    return userPosts;
  };

  userLikedPosts = async (userId) => {
    const likedPosts = await Posts.findAll({
      include: [
        {
          model: Likes,
          where: { userId },
        },
      ],
    });
    return likedPosts;
  };
}

module.exports = UserprofileRepository;
