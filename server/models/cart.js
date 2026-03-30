"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Cart.belongsTo(models.User, { foreignKey: "UserId" });
      Cart.belongsTo(models.Product, { foreignKey: "ProductId" });
    }
  }
  Cart.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User is required" },
          isInt: { msg: "User must be valid" },
        },
      },
      ProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Product is required" },
          isInt: { msg: "Product must be valid" },
        },
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Quantity is required" },
          isInt: { msg: "Quantity must be a number" },
          min: {
            args: [1],
            msg: "Minimum quantity is 1",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Cart",
    },
  );
  return Cart;
};
