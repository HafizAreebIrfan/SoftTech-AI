import React from "react";
import styles from "../../../styles/navbar.module.css";

const Navbar: React.FC = () => {
  return (
    <div className={styles.navbarwrapper}>
      <div className={styles.logo}>
        <h1>LOGO</h1>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.menu}>
          <li>
            <a href="/" className={styles.active}>Home</a>
            <a href="/about" className={styles.menuitem}>About</a>
            <a href="/services" className={styles.menuitem}>Services</a>
            <a href="/contact" className={styles.menuitem}>Contact</a>
          </li>
        </ul>
      </nav>
      <div className={styles.button}>
        <button className={styles.loginbutton}>Login</button>
        <button className={styles.registerbutton}>Register</button>
      </div>
    </div>
  );
};

export default Navbar;
