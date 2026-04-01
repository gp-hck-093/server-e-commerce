"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Payment.belongsTo(models.Order, { foreignKey: "OrderId" });
    }
  }
  Payment.init(
    {
      OrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Order is required" },
          isInt: { msg: "Order must be valid" },
        },
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Method is required" },
          notNull: { msg: "Method is required" },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          notEmpty: { msg: "Status is required" },
          notNull: { msg: "Status is required" },
        },
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Amount is required" },
          isInt: { msg: "Amount must be a number" },
          min: {
            args: [1],
            msg: "Amount must be greater than 0",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Payment",
    },
  );
  return Payment;
};
