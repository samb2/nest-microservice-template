import { ForgotPasswordDto } from '../../src/auth/dto/forgot-password.dto';

export const forgotPasswordEmail: ForgotPasswordDto = {
  email: 'testUser1@test.com',
};

export const forgotPasswordEmailNotRegister: ForgotPasswordDto = {
  email: 'testUser2@test.com',
};
export const forgotPasswordInvalidEmail: ForgotPasswordDto = {
  email: 'testUser1',
};

export const forgotPasswordEmptyEmail: ForgotPasswordDto = {
  email: '',
};
