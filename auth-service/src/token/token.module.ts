import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service'; // Assuming this is your service file

@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
