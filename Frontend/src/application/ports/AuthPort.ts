import { PostData } from "../../domain/entities/Post";

export interface AuthPort {
  getPosts: () => Promise<PostData[]>;
  createPost: (payload: PostData) => Promise<PostData>;
}
