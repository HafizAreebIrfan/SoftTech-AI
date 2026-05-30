import React, { FC, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import styles from "../../../../styles/signup.module.css";
import { createPostUseCase } from "../../../../application/useCases/auth/createPostUseCase";

const Signup: FC = () => {
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");

  const { mutate, data: newPost, isPending, isError, error } = useMutation({
    mutationFn: createPostUseCase,
  });

  return (
    <>
      <div className={styles.postdata}>
        <h1>Post The Data</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores
          beatae fugit, sequi nisi vitae est?
        </p>

        <div className={styles.forminputwrapper}>
          <input
            type="text"
            name="title"
            value={title}
            placeholder="Enter Title"
            id="title"
            onChange={(e) => setTitle(e.target.value)}
            className={styles.forminput}
          />
          <textarea
            name="body"
            value={body}
            id="body"
            placeholder="Enter Description"
            onChange={(e) => setBody(e.target.value)}
            className={styles.formtextarea}
          />
          <button
            className={styles.btn}
            type="submit"
            disabled={!title || !body}
            onClick={() => {
              mutate({ title, body, userId: 1 });
              setTitle("");
              setBody("");
            }}
          >
            Create Post
          </button>
        </div>

        {isPending && <p>Posting Data...</p>}
        {isError && <p>Something Went Wrong: {error.message}</p>}

        <div className={styles.posteddata}>
          <h1>Your Posts</h1>
          <div className={styles.posteddatacard}>
            {newPost && (
              <div className={styles.postedcard}>
                <h1>{newPost.title}</h1>
                <p>{newPost.body}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
