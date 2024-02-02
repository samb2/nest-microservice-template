import * as request from 'supertest';
import {
  emptyEmailPasswordUser,
  intPasswordUser,
  inValidEmailUser,
  shortPasswordUser,
  validUser,
} from '../constants/userData';
import authTestController from './controllers/AuthTestController';

describe('RegisterController (e2e)', () => {
  it('should register a new user successfully', async (): Promise<void> => {
    const response: request.Response = await authTestController.register();

    // -------- Check DATABASE ------------------
    const { User } = authTestController.getRepositories();
    const user = await User.findOne({
      where: { email: validUser.email },
    });

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(201);
    expect(response.body.message).toEqual('Created');
    expect(response.body.data.message).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toEqual(validUser.email);
  });

  it('should fail email and password should not be empty', async (): Promise<void> => {
    const response: request.Response = await authTestController.register(
      emptyEmailPasswordUser,
    );

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(2);
  });

  it('should fail email must be an email', async (): Promise<void> => {
    const response: request.Response =
      await authTestController.register(inValidEmailUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should fail Password length must be between 8 and 20 characters', async (): Promise<void> => {
    const response: request.Response =
      await authTestController.register(shortPasswordUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(1);
  });

  it('should fail Password must be a string', async (): Promise<void> => {
    const response: request.Response =
      await authTestController.register(intPasswordUser);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(400);
    expect(response.body.error).toEqual('Bad Request');
    expect(response.body.message).toHaveLength(2);
  });

  it('should fail This user is already registered!', async (): Promise<void> => {
    await authTestController.register();
    const response: request.Response = await authTestController.register();

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(409);
    expect(response.body.error).toEqual('Conflict');
    expect(response.body.message).toEqual('This user is already registered!');
  });
});
