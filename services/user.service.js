const userRepository = require("../repositories/user.repository");
const { redisClient } = require("../config/redis");

const USERS_CACHE_KEY = "users:all";

const getUsers = async () => {
  // Check Redis
  const cachedUsers = await redisClient.get(USERS_CACHE_KEY);

  if (cachedUsers) {
    console.log("Redis HIT");

    return JSON.parse(cachedUsers);
  }

  console.log("Redis MISS");

  // Get from MySQL
  const users = await userRepository.findAll();

  // Store in Redis for 60 seconds
  await redisClient.setEx(
    USERS_CACHE_KEY,
    60,
    JSON.stringify(users)
  );

  return users;
};

const getUserById = async (id) => {
  const cacheKey = `user:${id}`;

  const cachedUser = await redisClient.get(cacheKey);

  if (cachedUser) {
    console.log("Redis HIT");

    return JSON.parse(cachedUser);
  }

  console.log("Redis MISS");

  const user = await userRepository.findById(id);

  if (!user) {
    return null;
  }

  await redisClient.setEx(
    cacheKey,
    60,
    JSON.stringify(user)
  );

  return user;
};

const createUser = async (userData) => {
  const user = await userRepository.create(userData);

  // Invalidate users list cache
  await redisClient.del(USERS_CACHE_KEY);

  return user;
};

const updateUser = async (id, userData) => {
  const user = await userRepository.update(id, userData);

  if (!user) {
    return null;
  }

  // Invalidate both caches
  await redisClient.del(
    USERS_CACHE_KEY,
    `user:${id}`
  );

  return user;
};

const deleteUser = async (id) => {
  const deleted = await userRepository.remove(id);

  if (!deleted) {
    return false;
  }

  // Invalidate caches
  await redisClient.del(
    USERS_CACHE_KEY,
    `user:${id}`
  );

  return true;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};