import Navbar from "../components/common/navbar";
import { Outlet } from "@tanstack/react-router";
import Footer from "../components/common/footer";
import styles from '../../styles/publiclayout.module.css';
import React from "react";

const PublicLayout: React.FC<{}> = () => {
    return (
        <div className={styles.layout}>
            <Navbar />
            <div className={styles.contentWrapper}>
                <Outlet />
            </div>
            <Footer />
        </div>
    )
}
export default PublicLayout;
