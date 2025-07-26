import React from "react";
import "./Admin.css";

const Admin = () => {
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Panel</h1>
      <div className="admin-content">
        <button className="add-content-btn">
          Add Movie/Series
        </button>
      </div>
    </div>
  );
};

export default Admin; 