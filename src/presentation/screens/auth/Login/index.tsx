import React, { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "../../../../styles/login.module.css";
import { getPostsUseCase } from "../../../../application/useCases/auth/getPostsUseCase";

const Login: FC = () => {
  const [isLoadedData, setIsLoadedData] = useState<boolean>(false);

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["Posts"],
    queryFn: getPostsUseCase,
    enabled: isLoadedData,
  });

  return (
    <>
      <div className={styles.getpost}>
        <h1>Posts Data Sample</h1>
        <p>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Perferendis
          a dolorum ad modi quas facilis.
        </p>
        <div className={styles.functionbuttons}>
          <button className={styles.btn} onClick={() => setIsLoadedData(true)}>
            Get Posts
          </button>
          <button className={styles.btn} onClick={() => refetch()}>
            Refetch
          </button>
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p>Something Went Wrong</p>}

        <div className={styles.postitemwrapper}>
          {posts &&
            posts.slice(0, 6).map((post, index) => (
              <div key={index} className={styles.postitem}>
                <h1>{post.title}</h1>
                <p>{post.body}</p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Login;
