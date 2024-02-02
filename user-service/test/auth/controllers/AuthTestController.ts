import * as request from 'supertest';
import { TestController } from './TestController';
import { validUser } from '../../constants/userData';
import { forgotPasswordEmail } from '../../constants/ForgotPasswordData';

class AuthTestController extends TestController {
  async register(data: any = validUser): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/register')
      .send(data);
  }

  async login(data: any = validUser): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/login')
      .send(data);
  }

  async forgotPassword(
    data: any = forgotPasswordEmail,
  ): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/forgotPassword')
      .send(data);
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/resetPassword')
      .send({ password, token });
  }

  async refresh(refreshToken: string): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);
  }

  async logout(accessToken: string): Promise<request.Response> {
    return request(TestController.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async deActivateUser(user: any = validUser): Promise<void> {
    const { User } = this.getRepositories();
    await User.update({ email: user.email }, { isActive: false });
  }

  async getAccessToken(user: any = validUser): Promise<string> {
    await this.register(user);
    const login: request.Response = await this.login(user);
    return login.body.data.access_token;
  }

  async getRefreshToken(user: any = validUser): Promise<string> {
    await this.register(user);
    const login: request.Response = await this.login(user);
    return login.body.data.refresh_token;
  }
}

export default new AuthTestController();
