import React from "react";
import CardWidget from "../../../widgets/card";
import styles from "../../../../styles/home.module.css";

const Homescreen: React.FC = () => {
  return (
    <section id="home" className={styles.homewrapper}>
      <div className={styles.homecontent}>
        <CardWidget />
      </div>
    </section>
  );
};

export default Homescreen;
