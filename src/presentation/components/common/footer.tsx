import React from "react";
import styles from "../../../styles/footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footerwrapper}>
      <div className={styles.footercontent}>
        <p>Copyright © SoftTech AI</p>
      </div>
    </footer>
  );
};

export default Footer;
