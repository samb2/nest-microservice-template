import * as request from 'supertest';
import authTestController from './controllers/AuthTestController';

beforeEach(async () => {});
describe('RefreshController (e2e)', () => {
  it('should Refresh Token give Access Token Successfully', async (): Promise<void> => {
    const refreshToken: string = await authTestController.getRefreshToken();
    const response: request.Response =
      await authTestController.refresh(refreshToken);

    authTestController.expectSuccessResponse(response);
    expect(response.body.statusCode).toEqual(200);
    expect(response.body.message).toEqual('OK');
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveProperty('access_token');
  });

  it('should Fail Invalid Token by Fake Token', async (): Promise<void> => {
    const fake = authTestController.fakeToken();
    const response: request.Response = await authTestController.refresh(fake);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
  });

  it('should Fail Unauthorized by null Refresh Token', async (): Promise<void> => {
    const response: request.Response = await authTestController.refresh(null);

    authTestController.expectFailResponse(response);
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.error).toEqual('Unauthorized');
  });
});
