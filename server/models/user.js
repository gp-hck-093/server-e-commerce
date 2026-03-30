"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../helpers/bcrypt");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      User.hasMany(models.Cart, { foreignKey: "UserId" });
      User.hasMany(models.Order, { foreignKey: "UserId" });
      User.hasMany(models.Product, { foreignKey: "UserId" });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Username is required" },
          notNull: { msg: "Username is required" },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Email already exists" },
        validate: {
          notEmpty: { msg: "Email is required" },
          notNull: { msg: "Email is required" },
          isEmail: { msg: "Invalid email format" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Password is required" },
          notNull: { msg: "Password is required" },
        },
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Phone number is required" },
          notNull: { msg: "Phone number is required" },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Address is required" },
          notNull: { msg: "Address is required" },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    },
  );

  User.beforeCreate((user) => {
    if (user.password) {
      user.password = hashPassword(user.password);
    }
  });

  return User;
};
