import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from '../token/token.module';
import { ResetPassword, User } from './entities';
import { MicroserviceModule } from '../microservice/microservice.module';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetPassword]),
    TokenModule,
    forwardRef(() => MicroserviceModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [UserService],
})
export class AuthModule {}
