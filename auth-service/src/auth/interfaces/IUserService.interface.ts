import { User } from '../entities';
import { UpdateResult } from 'typeorm';

export interface IUserServiceInterface {
  validateUserByAuthId(id: string): Promise<User | undefined>;

  updateUser(id: string, data: Partial<User>): Promise<UpdateResult>;

  updatePassword(id: string, data: object);
}
