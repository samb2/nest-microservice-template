import * as bcrypt from 'bcrypt';

export async function bcryptPassword(password: string): Promise<string> {
  // Bcrypt with 15 salt
  const salt = await bcrypt.genSalt(15);
  // Bcrypt Password with Salt
  return bcrypt.hashSync(password, salt);
}

export async function comparePassword(
  password: string,
  userPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, userPassword);
}
