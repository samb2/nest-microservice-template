import * as request from 'supertest';
import { ResetPassword } from '../../src/auth/entities/reset-password.entity';
import { validUser } from '../constants/userData';
import authTestController from './controllers/AuthTestController';
import { Repository } from 'typeorm';

beforeEach(async () => {});
describe('ResetPasswordController (e2e)', () => {
  it('should Reset Password Successfully', async (): Promise<void> => {
    await authTestController.register();
    await authTestController.forgotPassword();
    let ResetPassword: Repository<ResetPassword>;
    ({ ResetPassword } = authTestController.getRepositories());
    const forgotPassword: ResetPassword = await ResetPassword.findOne({
      where: { user: { email: validUser.email } },
      select: { id: true, token: true, user: { password: true } },
      relations: ['user'],
    });

    const { token } = forgotPassword;
    const password: string = 'changePassword';
    const response: request.Response = await authTestController.resetPassword(
      token,
      password,
    );
    const resetPasswordResult: ResetPassword = await ResetPassword.findOne({
      where: { token },
      select: { id: true, token: true, use: true, user: { password: true } },
      relations: ['user'],
    });

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(200);
    expect(response.body.message).toEqual('OK');
    expect(response.body.data).toBeDefined();
    expect(resetPasswordResult.user.password).not.toEqual(
      forgotPassword.user.password,
    );
  });

  it('should return 400 password must be a string / token must be a jwt string', async (): Promise<void> => {
    const response: request.Response = await authTestController.resetPassword(
      null,
      null,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(2);
  });

  it('should return 400 password must be a string', async (): Promise<void> => {
    const fakeToken = authTestController.fakeToken();

    const response: request.Response = await authTestController.resetPassword(
      fakeToken,
      null,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should return 400 token must be a jwt string', async (): Promise<void> => {
    const response: request.Response = await authTestController.resetPassword(
      'test',
      'ChangePassword',
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should return 403 Invalid token by fake Token', async (): Promise<void> => {
    const fakeToken = authTestController.fakeToken();
    const response: request.Response = await authTestController.resetPassword(
      fakeToken,
      'ChangePassword',
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(403);
    expect(response.body.error).toEqual('Forbidden');
    expect(response.body.message).toBeDefined();
  });

  it('should return 403 This Token Expired because already used', async (): Promise<void> => {
    await authTestController.register();
    await authTestController.forgotPassword();
    const { ResetPassword } = authTestController.getRepositories();
    const forgotPassword: ResetPassword = await ResetPassword.findOne({
      where: { user: { email: validUser.email } },
      select: { id: true, token: true, user: { password: true } },
      relations: ['user'],
    });

    const { token } = forgotPassword;
    const password: string = 'changePassword';
    await authTestController.resetPassword(token, password);
    const response: request.Response = await authTestController.resetPassword(
      token,
      'changePassword2',
    );

    const resetPasswordResult: ResetPassword = await ResetPassword.findOne({
      where: { token },
      select: { id: true, use: true },
    });

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(403);
    expect(response.body.error).toEqual('Forbidden');
    expect(response.body.message).toBeDefined();
    expect(resetPasswordResult.use).toEqual(true);
  });

  it('should return 403 This Token Expired because forgot password 3 times', async (): Promise<void> => {
    const { ResetPassword } = authTestController.getRepositories();
    await authTestController.register();
    await authTestController.forgotPassword();
    //---- Forgot password
    await authTestController.forgotPassword();
    await authTestController.forgotPassword();
    const forgotPassword: ResetPassword = await ResetPassword.findOne({
      where: { user: { email: validUser.email } },
      select: {
        id: true,
        token: true,
        user: { password: true },
        createdAt: true,
      },
      order: { createdAt: 1 },
      relations: ['user'],
    });
    const { token } = forgotPassword;
    const password: string = 'changePassword';

    const response: request.Response = await authTestController.resetPassword(
      token,
      password,
    );
    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(403);
    expect(response.body.error).toEqual('Forbidden');
    expect(response.body.message).toBeDefined();
  });
});
