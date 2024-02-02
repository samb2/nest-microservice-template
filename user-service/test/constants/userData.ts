import { RegisterDto } from '../../src/auth/dto/register.dto';

export const validUser: RegisterDto = {
  email: 'testUser1@test.com',
  password: 'TestPassword',
};

export const notActiveUser: any = {
  email: 'testUser1@test.com',
  password: 'TestPassword',
};
export const inValidEmailUser: RegisterDto = {
  email: 'invalid',
  password: 'TestPassword',
};

export const unRegisterEmail: RegisterDto = {
  email: 'unregister@test.com',
  password: 'WrongPassword',
};
export const wrongPassword: RegisterDto = {
  email: 'testUser1@test.com',
  password: 'WrongPassword',
};
export const emptyEmailPasswordUser: RegisterDto = {
  email: '',
  password: '',
};

export const emptyEmailUser: RegisterDto = {
  email: '',
  password: 'TestPassword',
};

export const emptyPasswordUser: RegisterDto = {
  email: 'testUser1@test.com',
  password: '',
};

export const shortPasswordUser: RegisterDto = {
  email: 'test@example.com',
  password: 'short',
};

export const intPasswordUser: object = {
  email: 'test@example.com',
  password: 12345678,
};

export const validUser2: RegisterDto = {
  email: 'testUser2@test.com',
  password: 'TestPassword',
};

export const validUser3: RegisterDto = {
  email: 'testUser3@test.com',
  password: 'TestPassword',
};

export const validUser4: RegisterDto = {
  email: 'testUser4@test.com',
  password: 'TestPassword',
};

export const validUser5: RegisterDto = {
  email: 'testUser5@test.com',
  password: 'TestPassword',
};

export const resetPasswordInf = {
  password: 'NewPassword',
};
