import { PostData } from "../../../domain/entities/Post";
import { authPort } from "../../ports/authPortProvider";

export const createPostUseCase = async (newPost: PostData) => authPort.createPost(newPost);
