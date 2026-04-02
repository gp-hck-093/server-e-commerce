const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { generateToken } = require("../helpers/jwt");
const { sendResetPasswordEmail } = require("../utils/mailer");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cloudinary = require("../helpers/cloudinary");

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, phoneNumber, address } = req.body;
      const data = await User.create({
        username,
        email,
        password,
        phoneNumber,
        address,
      });
      res.status(201).json({
        id: data.id,
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email) throw { name: "BadRequest", message: "Email is required" };
      if (!password)
        throw { name: "BadRequest", message: "Password is required" };

      const user = await User.findOne({ where: { email } });
      if (!user)
        throw { name: "Unauthorized", message: "Invalid email/password" };

      const verifyPassword = comparePassword(password, user.password);
      if (!verifyPassword)
        throw { name: "Unauthorized", message: "Invalid email/password" };

      const access_token = generateToken({
        id: user.id,
        email: user.email,
      });
      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { credential } = req.body;
      if (!credential)
        throw { name: "BadRequest", message: "Google credential is required" };

      const audience = process.env.GOOGLE_CLIENT_ID;
      if (!audience)
        throw { name: "BadRequest", message: "GOOGLE_CLIENT_ID is not set" };

      const client = new OAuth2Client(audience);
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken: credential, audience });
      } catch (verifyError) {
        throw {
          name: "Unauthorized",
          message: "Google token is invalid or client ID does not match",
        };
      }

      const payload = ticket.getPayload();
      const { email, name, sub } = payload;

      if (!email)
        throw {
          name: "Unauthorized",
          message: "Google account email not found",
        };

      let user = await User.findOne({ where: { email } });

      if (!user) {
        const randomPassword = `Google-${Math.random().toString(36).slice(-8)}A1!`;
        user = await User.create({
          username: name || email.split("@")[0],
          email,
          password: randomPassword,
          googleId: sub || null,
          phoneNumber: "-",
          address: "-",
        });
      } else if (!user.googleId && sub) {
        await user.update({ googleId: sub });
      }

      const access_token = generateToken({
        id: user.id,
        email: user.email,
      });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const email = req.body.email?.trim();

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }

      if (!emailRegex.test(email)) {
        throw { name: "BadRequest", message: "Invalid email format" };
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      const secret = process.env.JWT_SECRET + user.password;
      const token = jwt.sign({ email: user.email, id: user.id }, secret, {
        expiresIn: "15m",
      });
      const frontendUrl =
        process.env.NODE_ENV === "production"
          ? "https://zapshop.erwindw99.com"
          : "http://localhost:5173";
      const resetLink = `${frontendUrl}/reset-password?token=${token}&id=${user.id}`;

      await sendResetPasswordEmail(user.email, user.username, resetLink);

      res.status(200).json({
        message: "Password reset link has been sent to your email.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { id, token } = req.body;
      const newPassword = req.body.newPassword?.trim();

      if (!id || !token || !newPassword) {
        throw { name: "BadRequest", message: "Missing required fields" };
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      const secret = process.env.JWT_SECRET + user.password;

      try {
        const payload = jwt.verify(token, secret);
        if (payload.id !== user.id) {
          throw new Error("Invalid token");
        }
      } catch (verifyError) {
        throw {
          name: "BadRequest",
          message: "Token is invalid or has expired",
        };
      }

      if (newPassword.length < 6) {
        throw {
          name: "BadRequest",
          message: "Password must be at least 6 characters",
        };
      }

      user.password = hashPassword(newPassword);
      await user.save();

      res.status(200).json({
        message: "Password has been reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const { id } = req.user;

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { id } = req.user;
      const { username, phoneNumber, address } = req.body;

      const user = await User.findByPk(id);
      if (!user) throw { name: "NotFound" };

      let imageUrl = user.imageUrl;

      // ✅ ONLY upload if file exists
      if (req.file) {
        const base64 = req.file.buffer.toString("base64");

        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${base64}`,
        );

        imageUrl = result.secure_url;
      }

      await user.update({
        username,
        phoneNumber,
        address,
        imageUrl,
      });

      res.status(200).json({
        message: "Profile updated",
        data: user,
      });
    } catch (error) {
      console.log("🔥 UPDATE PROFILE ERROR:", error); // ADD THIS
      next(error);
    }
  }
}

module.exports = AuthController;
