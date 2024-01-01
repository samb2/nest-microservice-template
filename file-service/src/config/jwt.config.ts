const jwtConfig: object = {
  access_key: process.env.JWT_ACCESSKEY,
  refresh_key: process.env.JWT_REFRESHKEY,
  email_key: process.env.JWT_EMAILKEY,
};

export { jwtConfig as jwt };
