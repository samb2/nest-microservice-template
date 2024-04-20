import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Response } from 'supertest';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpExceptionFilter, ResponseInterceptor } from '@irole/microservices';
import { ResetPassword, User } from '../../../src/auth/entities';

export class TestController {
  static app: INestApplication | undefined;

  static async init() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    const configService = this.app.get(ConfigService);
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const moduleRef = this.app.select(AppModule);
    const reflector = moduleRef.get(Reflector);
    // Using ResponseInterceptor as global Response
    this.app.useGlobalInterceptors(
      new ResponseInterceptor(reflector, configService),
    );
    // Using HttpExceptionFilter as global Error handler
    this.app.useGlobalFilters(new HttpExceptionFilter(configService));
    await this.app.init();
  }

  getRepositories() {
    const userRep: Repository<User> = TestController.app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    const resetRep: Repository<ResetPassword> = TestController.app.get<
      Repository<ResetPassword>
    >(getRepositoryToken(ResetPassword));
    // const userRep: Repository<User> = dataSource.manager.getRepository(User);
    // Add other Repository Here
    return { User: userRep, ResetPassword: resetRep };
  }

  fakeToken() {
    return jwt.sign({ email: test }, 'your-secret-key');
  }

  expectSuccessResponse(res: Response) {
    expect(res).toBeDefined();
    expect(res.body).toBeDefined();
    //------------------------------------------//
    expect(res.body).toHaveProperty('from');
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('statusCode');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    //------------------------------------------//
    expect(res.body.from).toEqual('AUTH-SERVICE');
    expect(res.body.success).toEqual(true);

    return res;
  }

  expectFailResponse(res: Response) {
    expect(res).toBeDefined();
    expect(res.body).toBeDefined();
    //------------------------------------------//
    expect(res.body).toHaveProperty('from');
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('statusCode');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    //------------------------------------------//
    expect(res.body.from).toEqual('AUTH-SERVICE');
    expect(res.body.success).toEqual(false);

    return res;
  }
}
