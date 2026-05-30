import { AuthPort } from "../../application/ports/AuthPort";
import { PostData } from "../../domain/entities/Post";
import { get, post } from "./httpClient";

const LOCAL_POSTS_URL = "http://localhost:3000/posts";

export const localhostAuthApiAdapter: AuthPort = {
  getPosts: async (): Promise<PostData[]> => {
    const data = await get(LOCAL_POSTS_URL);
    return data as PostData[];
  },
  createPost: async (newPost: PostData): Promise<PostData> => {
    const data = await post(LOCAL_POSTS_URL, newPost);
    return data as PostData;
  },
};
