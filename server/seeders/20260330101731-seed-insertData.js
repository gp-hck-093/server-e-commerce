"use strict";

const { hashPassword } = require("../helpers/bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const usersData = require("../data/users.json").map((el) => {
      el.createdAt = el.updatedAt = new Date();
      el.password = hashPassword(el.password);
      return el;
    });

    const categoriesData = require("../data/categories.json").map((el) => {
      el.createdAt = el.updatedAt = new Date();
      return el;
    });

    const brandsData = require("../data/brands.json").map((el) => {
      el.createdAt = el.updatedAt = new Date();
      return el;
    });

    const productsData = require("../data/products.json").map((el) => {
      el.createdAt = el.updatedAt = new Date();
      return el;
    });

    await queryInterface.bulkInsert("Users", usersData);
    await queryInterface.bulkInsert("Categories", categoriesData);
    await queryInterface.bulkInsert("Brands", brandsData);
    await queryInterface.bulkInsert("Products", productsData);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("Products", null, {});
    await queryInterface.bulkDelete("Brands", null, {});
    await queryInterface.bulkDelete("Categories", null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
