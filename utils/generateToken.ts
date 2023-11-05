import jwt from 'jsonwebtoken';

const generateToken = (id: string, expire: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: expire,
  });
};

export default generateToken;
