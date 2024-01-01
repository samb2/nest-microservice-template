import * as request from 'supertest';
import {
  emptyEmailPasswordUser,
  emptyEmailUser,
  emptyPasswordUser,
  unRegisterEmail,
  validUser,
  wrongPassword,
} from '../constants/userData';
import authTestController from './controllers/AuthTestController';

beforeEach(async () => {});
describe('LoginController (e2e)', () => {
  it('should Login a user successfully', async (): Promise<void> => {
    await authTestController.register();
    const response: request.Response = await authTestController.login();

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(200);
    expect(response.body.message).toEqual('OK');
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toEqual(validUser.email);
  });

  it('should return 400 if email is not provided', async () => {
    const response: request.Response =
      await authTestController.login(emptyEmailUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should return 400 if password is not provided', async () => {
    const response: request.Response =
      await authTestController.login(emptyPasswordUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should return 400 if email and password is not provided', async () => {
    const response: request.Response = await authTestController.login(
      emptyEmailPasswordUser,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(2);
  });

  it('should return 401 Unauthorized if invalid email provided', async (): Promise<void> => {
    const response: request.Response =
      await authTestController.login(unRegisterEmail);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
    expect(response.body.message).toEqual('Invalid username or password!');
  });

  it('should return 401 Unauthorized if invalid password provided', async (): Promise<void> => {
    await authTestController.register();
    const response: request.Response =
      await authTestController.login(wrongPassword);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
    expect(response.body.message).toEqual('Invalid username or password!');
  });

  it('should return 403 if user account is not activated', async (): Promise<void> => {
    await authTestController.register();
    // isActive False
    await authTestController.deActivateUser();
    const response: request.Response =
      await authTestController.login(validUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(403);
    expect(response.body.error).toEqual('Forbidden');
    expect(response.body.message).toEqual('your account is not active!');
  });
});
