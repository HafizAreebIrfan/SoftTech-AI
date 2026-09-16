import { Outlet } from "@tanstack/react-router";
import styles from '../../styles/authlayout.module.css';
import React from "react";

const AuthLayout: React.FC<{}> = () => {
    return (
        <div className={styles.layout}>
            <div className={styles.contentWrapper}>
                <Outlet />
            </div>
        </div>
    )
}
export default AuthLayout;
