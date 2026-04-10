if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

exports.jwtConstants = {
  secret: process.env.JWT_SECRET,
};
