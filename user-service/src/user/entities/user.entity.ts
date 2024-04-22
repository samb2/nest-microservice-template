import { Exclude } from 'class-transformer';

export class User {
  id: string;

  email: string;

  auth_id: string;

  avatar: string;

  first_name: string;

  last_name: string;

  @Exclude()
  is_active: boolean;

  @Exclude()
  is_delete: boolean;

  @Exclude()
  super_admin: boolean;

  @Exclude()
  admin: boolean;

  created_at: Date;

  updated_at: Date;
}
