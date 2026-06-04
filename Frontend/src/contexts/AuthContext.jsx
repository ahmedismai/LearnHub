import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!user;

  const login = async (email, password) => {
    const response = await api.post("/api/Account/Login", { email, password });
    const { accessToken, refreshToken, user: loginUser } = response.data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    try {
      const profileResponse = await api.get("/api/Account/Account/GetProfile");
      const userData = profileResponse.data?.data || profileResponse.data || loginUser;
      const rawRole = userData.role || userData.roles?.[0] || "Student";

      const userWithRole = {
        ...userData,
        id: userData.id || userData.userId || userData._id,
        userId: userData.userId || userData.id || userData._id,
        fullName: userData.fullName || userData.name,
        emailConfirmed: userData.emailConfirmed,
        role: rawRole,
      };

      localStorage.setItem("user", JSON.stringify(userWithRole));
      setUser(userWithRole);
      return userWithRole;
    } catch (error) {
      console.error("Failed to fetch profile after login", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const profileResponse = await api.get("/api/Account/Account/GetProfile");
      const userData = profileResponse.data?.data || profileResponse.data;
      const rawRole = userData.role || userData.roles?.[0] || "Student";

      const userWithRole = {
        ...userData,
        id: userData.id || userData.userId || userData._id,
        userId: userData.userId || userData.id || userData._id,
        fullName: userData.fullName || userData.name,
        emailConfirmed: userData.emailConfirmed,
        role: rawRole,
      };

      localStorage.setItem("user", JSON.stringify(userWithRole));
      setUser(userWithRole);
      return userWithRole;
    } catch (error) {
      console.error("Failed to refresh user profile", error);
      // If profile fetch fails, we might want to logout or just ignore
    }
  };

  const register = async (name, email, password, confirmPassword, role = "Student") => {
    const response = await api.post("/api/Account/Register", {
      name,
      email,
      password,
      confirmPassword: confirmPassword || password,
      role,
    });
    return response.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/api/Account/Logout", { refreshToken });
      } catch (error) {
        console.error("Failed to logout from server", error);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateProfile = async (data) => {
    const payload = {
      name: data.fullName || data.name,
    };
    const response = await api.put("/api/Account/Account/UpdateProfile", payload);
    const body = response.data;
    
    // Check if update was successful
    if (body.success || response.status === 200) {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      
      // Use the name we sent if the server didn't return an object in the 'data' field
      const updatedFullName = (body.data && typeof body.data === 'object')
        ? body.data.fullName || body.data.name
        : payload.name;

      const newUser = {
        ...currentUser,
        fullName: updatedFullName || currentUser.fullName,
      };
      
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    }
    return { success: false, message: body.message || "Update failed" };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        refreshUser,
        register,
        logout,
        updateProfile,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
