import { User } from '../../user/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
  roles: number[];
}
