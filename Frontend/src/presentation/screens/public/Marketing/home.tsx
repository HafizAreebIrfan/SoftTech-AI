import React from "react";
import styles from "../../../../styles/home.module.css";

const Homescreen: React.FC = () => {
  return (
    <>
      <section id="home" className={styles.homewrapper}>
        <div className={styles.homecontent}>
          <h4 className={styles.taglinehome}>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit.
          </h4>
          <h1 className={styles.headlinehome}>
            Lorem ipsum dolor sit amet.
            <span className={styles.headlinehomebold}>Lorem Ipsum</span>{" "}
            Lorem, ipsum.
          </h1>
          <p className={styles.descriptionhome}>
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Molestiae maiores quis eligendi. Labore, nulla voluptates saepe ducimus enim et omnis.
          </p>
        </div>
      </section>
    </>
  );
};

export default Homescreen;
