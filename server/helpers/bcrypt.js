const bcrypt = require("bcryptjs");

const hashPassword = (inPassword) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(inPassword, salt);
  return hash;
};

const comparePassword = (inPassword, hashPassword) => {
  return bcrypt.compareSync(inPassword, hashPassword);
};

module.exports = { hashPassword, comparePassword };
