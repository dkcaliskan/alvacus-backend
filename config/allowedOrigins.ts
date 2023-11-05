const allowedOrigins = [
  '*',
  'http://localhost:3000',
  'https://www.Alvacus.com',
  'https://Alvacus.com',
  `${process.env.DEVELOPMENT_IP}:3000`,
  `https://Alvacus-frontend.vercel.app`,
];

export default allowedOrigins;
