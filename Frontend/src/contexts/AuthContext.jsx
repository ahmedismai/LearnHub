import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password, role) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await api.patch("/auth/profile", data);
    const updatedUser = response.data;
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const newUser = { ...currentUser, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);