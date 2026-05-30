import React from "react";
import Homescreen from "../presentation/screens/public/Marketing/home";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import Header from "../presentation/components/common/header";
import Footer from "../presentation/components/common/footer";
import Login from "../presentation/screens/auth/Login";
import Signup from "../presentation/screens/auth/Signup";
import "../App.css";

const App:React.FC = () => {
  useApplyGlobalThemeVars();

  return (
    <>
      <Header />
      <Homescreen />
      <Login />
      <Signup />
      <Footer />
    </>
  );
};

export default App;
