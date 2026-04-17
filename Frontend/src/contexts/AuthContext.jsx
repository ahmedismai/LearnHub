import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/api/axios";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms_user");
    const storedToken = localStorage.getItem("lms_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.removeItem("lms_user");
      localStorage.removeItem("lms_token");
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: authenticatedUser } = response.data;

      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_user", JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, role) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
        role,
      });
      const { token, user: registeredUser } = response.data;

      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_user", JSON.stringify(registeredUser));
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_token");
  };

  const updateProfile = async (data) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.patch("/auth/profile", data);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem("lms_user", JSON.stringify(updatedUser));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
