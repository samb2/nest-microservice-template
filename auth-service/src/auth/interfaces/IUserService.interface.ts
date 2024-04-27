import { User } from '../entities';

export interface IUserServiceInterface {
  validateUserByAuthId(id: string): Promise<User | undefined>;
}
