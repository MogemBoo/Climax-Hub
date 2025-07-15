import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";

const Layout = () => {
  return (
    <>
      <TopBar />
      <div style={{ paddingTop: "60px" }}>
        {/* Padding top to avoid overlap if TopBar is fixed */}
        <Outlet /> {/* renders matched child routes */}
      </div>
    </>
  );
};

export default Layout;
