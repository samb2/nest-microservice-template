import * as request from 'supertest';
import authTestController from './controllers/AuthTestController';

beforeEach(async () => {});
describe('LogoutController (e2e)', () => {
  it('should Logout Successfully', async (): Promise<void> => {
    const accessToken: string = await authTestController.getAccessToken();
    const response: request.Response =
      await authTestController.logout(accessToken);

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(200);
    expect(response.body.message).toEqual('OK');
  });

  it('should Fail Invalid Token by Fake Token', async (): Promise<void> => {
    const fake = authTestController.fakeToken();
    const response: request.Response = await authTestController.logout(fake);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
  });

  it('should Fail Unauthorized by null access Token', async (): Promise<void> => {
    const response: request.Response = await authTestController.logout(null);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
  });
});
