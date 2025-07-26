import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";

const Layout = () => {
  const location = useLocation();
  const hideTopBar = location.pathname === "/login";
  return (
    <>
      {!hideTopBar && <TopBar />}
      <div>
        {/* Padding top to avoid overlap if TopBar is fixed */}
        <Outlet /> {/* renders matched child routes */}
      </div>
    </>
  );
};

export default Layout;
