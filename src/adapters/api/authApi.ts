import { LoginCredentials, LoginResponse } from "../../domain/entities/User";
import { env } from "../../infrastructure/config/env";
import { post } from "./httpClient";

const LOGIN_URL = `${env.devServer}/api/auth/login`;

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return post(LOGIN_URL, credentials);
};
