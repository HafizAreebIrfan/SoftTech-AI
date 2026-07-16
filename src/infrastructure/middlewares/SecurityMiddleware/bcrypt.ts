import bcrypt from "bcrypt";

export const Hashpassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
