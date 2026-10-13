const prisma = require('../db/prisma');

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

async function create(userData) {
  return prisma.user.create({
    data: userData
  });
}

module.exports = {
  findByEmail,
  create
};
