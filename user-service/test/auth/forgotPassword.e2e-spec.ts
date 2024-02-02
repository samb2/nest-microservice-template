import * as request from 'supertest';
import {
  forgotPasswordEmailNotRegister,
  forgotPasswordEmptyEmail,
  forgotPasswordInvalidEmail,
} from '../constants/ForgotPasswordData';
import { ResetPassword } from '../../src/auth/entities/reset-password.entity';
import authTestController from './controllers/AuthTestController';

beforeEach(async () => {});
describe('ForgotPasswordController (e2e)', () => {
  it('should Forgot Password Successfully', async (): Promise<void> => {
    await authTestController.register();
    const response: request.Response =
      await authTestController.forgotPassword();
    const { ResetPassword } = authTestController.getRepositories();
    const resetPassword: ResetPassword[] = await ResetPassword.find();

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(200);
    expect(response.body.message).toEqual('OK');
    expect(response.body.data).toBeDefined();
    expect(resetPassword).toHaveLength(1);
  });

  it('should return 400 if email must be an email', async () => {
    const response: request.Response = await authTestController.forgotPassword(
      forgotPasswordEmptyEmail,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should return 400 if email must be an email', async () => {
    const response: request.Response = await authTestController.forgotPassword(
      forgotPasswordInvalidEmail,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should not create resetPassword for UnRegistered User', async (): Promise<void> => {
    // const response: request.Response = await authTestController.forgotPassword(
    //   forgotPasswordEmailNotRegister,
    // );
    // const { ResetPassword } = authTestController.getRepositories();
    // const resetPassword: ResetPassword[] = await ResetPassword.find();
    //
    // authTestController.expectSuccessResponse(response);
    // expect(response.body.statusCode).toEqual(200);
    // expect(response.body.message).toEqual('OK');
    // expect(response.body.data).toBeDefined();
    // expect(resetPassword).toHaveLength(0);
  });

  it('should not create resetPassword for deActivate User', async (): Promise<void> => {
    // await authTestController.register();
    // await authTestController.deActivateUser();
    // const response: request.Response =
    //   await authTestController.forgotPassword();
    // const { ResetPassword } = authTestController.getRepositories();
    // const resetPassword: ResetPassword[] = await ResetPassword.find();
    //
    // authTestController.expectSuccessResponse(response);
    // expect(response.body.statusCode).toEqual(200);
    // expect(response.body.message).toEqual('OK');
    // expect(response.body.data).toBeDefined();
    // expect(resetPassword).toHaveLength(0);
  });
});
