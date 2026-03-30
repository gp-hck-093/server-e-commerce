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
