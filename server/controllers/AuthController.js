const {User} = require("../models")
const {comparePassword} = require("../helpers/bcrypt")
const {verifyToken} = require("../helpers/jwt")

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, googleId, phoneNumber, address } = req.body
      const data = await User.create({ username, email, password, googleId, phoneNumber, address })
      res.status(201).json({
        id: data.id,
        username: data.username,
        email: data.email,
        googleId: data.googleId,
        phoneNumber: data.phoneNumber,
        address: data.address
      })
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body
      if (!email) throw { name: "BadRequest", message: "Email is required" }
      if (!password) throw { name: "BadRequest", message: "Password is required" }

      const user = await User.findOne({ where: { email } })
      if (!user) throw { name: "Unauthorized", message: "Invalid email/password" }

      const verifyPassword = comparePassword(password, user.password)
      if (!verifyPassword) throw { name: "Unauthorized", message: "Invalid email/password" }

      const access_token = verifyToken({
        id: user.id,
        email: user.email,
      })
      res.status(200).json({ access_token })
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
