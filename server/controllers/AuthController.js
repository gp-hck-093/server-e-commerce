const { OAuth2Client } = require("google-auth-library")
const {User} = require("../models")
const {comparePassword} = require("../helpers/bcrypt")
const {generateToken} = require("../helpers/jwt")

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

      const access_token = generateToken({
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
      const { credential } = req.body
      if (!credential) throw { name: "BadRequest", message: "Google credential is required" }

      const audience = process.env.GOOGLE_CLIENT_ID
      if (!audience) throw { name: "BadRequest", message: "GOOGLE_CLIENT_ID is not set" }

      const client = new OAuth2Client(audience)
      const ticket = await client.verifyIdToken({ idToken: credential, audience })
      const payload = ticket.getPayload()
      const { email, name, sub } = payload

      if (!email) throw { name: "Unauthorized", message: "Google account email not found" }

      let user = await User.findOne({ where: { email } })

      if (!user) {
        const randomPassword = `Google-${Math.random().toString(36).slice(-8)}A1!`
        user = await User.create({
          username: name || email.split("@")[0],
          email,
          password: randomPassword,
          googleId: sub || null,
          phoneNumber: "-",
          address: "-"
        })
      } else if (!user.googleId && sub) {
        await user.update({ googleId: sub })
      }

      const access_token = generateToken({
        id: user.id,
        email: user.email,
      })

      res.status(200).json({ access_token })
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
