"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Product.belongsTo(models.User, { foreignKey: "UserId" });
      Product.belongsTo(models.Category, { foreignKey: "CategoryId" });
      Product.belongsTo(models.Brand, { foreignKey: "BrandId" });

      Product.hasMany(models.Cart, { foreignKey: "ProductId" });
      Product.hasMany(models.OrderItem, { foreignKey: "ProductId" });
    }
  }
  Product.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Product name is required" },
          notNull: { msg: "Product name is required" },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Price is required" },
          isInt: { msg: "Price must be a number" },
          min: {
            args: [0],
            msg: "Price must be greater than or equal to 0",
          },
        },
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Stock is required" },
          isInt: { msg: "Stock must be a number" },
          min: {
            args: [0],
            msg: "Stock cannot be negative",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Description is required" },
          notNull: { msg: "Description is required" },
        },
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Image Url is required" },
          notNull: { msg: "Image Url is required" },
        },
      },
      CategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Category is required" },
          isInt: { msg: "Category must be valid" },
        },
      },
      BrandId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Brand is required" },
          isInt: { msg: "Brand must be valid" },
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User is required" },
          isInt: { msg: "User must be valid" },
        },
      },
    },
    {
      sequelize,
      modelName: "Product",
    },
  );
  return Product;
};
