const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const COST_FACTOR = Math.min(
  14,
  Math.max(10, Number.parseInt(process.env.BCRYPT_COST, 10) || 12)
);

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function badRequest() {
  return new AppError(400, 'INVALID_INPUT', 'Required fields are missing or invalid');
}

function invalidCredentials() {
  return new AppError(
    401,
    'INVALID_CREDENTIALS',
    'Invalid email or password'
  );
}

function validateFields(fields) {
  for (const field of fields) {
    if (typeof field !== 'string' || field.trim().length === 0) {
      throw badRequest();
    }
  }
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

const dummyHashPromise = bcrypt.hash(
  'dummy-authentication-password',
  COST_FACTOR
);

async function register({ name, email, password } = {}) {
  validateFields([name, email, password]);

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError(
      409,
      'EMAIL_EXISTS',
      'An account with this email already exists'
    );
  }

  const passwordHash = await bcrypt.hash(password, COST_FACTOR);

  try {
    const user = await userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash
    });

    return safeUser(user);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError(
        409,
        'EMAIL_EXISTS',
        'An account with this email already exists'
      );
    }

    throw error;
  }
}

async function login({ email, password } = {}) {
  validateFields([email, password]);

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    const dummyHash = await dummyHashPromise;
    await bcrypt.compare(password, dummyHash);
    throw invalidCredentials();
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw invalidCredentials();
  }

  return safeUser(user);
}

module.exports = {
  register,
  login,
  AppError
};
