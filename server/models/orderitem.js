"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderItem.belongsTo(models.Order, { foreignKey: "OrderId" });
      OrderItem.belongsTo(models.Product, { foreignKey: "ProductId" });
    }
  }
  OrderItem.init(
    {
      OrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Order is required" },
          isInt: { msg: "Order must be valid" },
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
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Price is required" },
          isInt: { msg: "Price must be a number" },
          min: {
            args: [1],
            msg: "Price must be greater than 0",
          },
        },
      },
      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Subtotal is required" },
          isInt: { msg: "Subtotal must be a number" },
          min: {
            args: [1],
            msg: "Subtotal must be greater than 0",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
    },
  );

  OrderItem.beforeValidate((item) => {
    if (item.price && item.qty) {
      item.subtotal = item.price * item.qty;
    }
  });

  return OrderItem;
};
