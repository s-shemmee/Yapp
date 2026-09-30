import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext, ReactNode } from "react";
import AuthContext from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import "./App.scss";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useContext(AuthContext);
  return user && Object.keys(user).length !== 0 ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
