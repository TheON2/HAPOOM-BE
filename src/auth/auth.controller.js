const AuthService = require('./auth.service');
const passport = require("passport");
const {Users} = require("../models");
const authService = new AuthService();

class AuthController {
  constructor() {
  }
  async getUserToken(req, res, next) {
    try {
      const userResponse = await authService.getUserToken(req.user.email);
      res.status(200).json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = await authService.refreshToken(req.user.email);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  }

  async signup(req, res, next) {
    try {
      const userResponse = await authService.signup(req.body);
      res.json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    passport.authenticate('local', async (err, user, info) => {
      try {
        if (err) {
          console.log(err);
          return next(err);
        }
        if (info) {
          // 클라이언트에 에러 메시지 전송
          return res.status(401).send(info.errorMessage);
        }
        const { userResponse, token } = await authService.login(req, user);
        const user = await Users.findOne({ where: { email: userResponse.email } });
        if (user) {
          res.locals.user = user;
          next();
        } else {
          res.status(404).send('User not found.');
        }
        res.status(200).json({ email:userResponse.email,nickname:userResponse.nickname, token });
      } catch (error) {
        console.log(error);
        return next(error);
      }
    })(req, res, next);
  }

  async logout(req, res, next) {
    req.session.destroy(err => {
      if (err) return next(err);
      res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true, sameSite: 'None', secure: true });
      res.send("ok");
    });
  }
}

module.exports = AuthController;
