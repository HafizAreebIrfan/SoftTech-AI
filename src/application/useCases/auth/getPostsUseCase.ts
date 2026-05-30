import { authPort } from "../../ports/authPortProvider";

export const getPostsUseCase = async () => authPort.getPosts();
