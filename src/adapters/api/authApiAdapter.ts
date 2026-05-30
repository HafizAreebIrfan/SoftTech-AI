import { AuthPort } from "../../application/ports/AuthPort";
import { PostData } from "../../domain/entities/Post";
import { get, post } from "./httpClient";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

export const realAuthApiAdapter: AuthPort = {
  getPosts: async (): Promise<PostData[]> => {
    const data = await get(POSTS_URL);
    return data as PostData[];
  },
  createPost: async (newPost: PostData): Promise<PostData> => {
    const data = await post(POSTS_URL, newPost);
    return data as PostData;
  },
};
