const allowedOrigins = [
  '*',
  'http://localhost:3000',
  'https://www.alvacus.com',
  'https://alvacus.com',
  `${process.env.DEVELOPMENT_IP}:3000`,
  `https://alvacus-frontend.vercel.app`,
];

export default allowedOrigins;
