import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext({});
let activeGooglePrompt = null;

const loadGoogleIdentityScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), {
        once: true,
      });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

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

  const normalizeAuthUser = (userData = {}) => {
    const rawRole = userData.role || userData.roles?.[0] || "Student";
    return {
      ...userData,
      id: userData.id || userData.userId || userData._id,
      userId: userData.userId || userData.id || userData._id,
      fullName: userData.fullName || userData.name,
      emailConfirmed: userData.emailConfirmed,
      role: rawRole,
    };
  };

  const getApiOriginUrl = () =>
    (api.defaults.baseURL || "").replace(/\/+$/, "").replace(/(?:\/api)+$/i, "");

  const startOAuthLogin = (provider, role = "Student") => {
    const params = new URLSearchParams({ role });
    window.location.href = `${getApiOriginUrl()}/api/Account/oauth/${provider}?${params}`;
  };

  const completeOAuthLogin = ({ accessToken, refreshToken, user: oauthUser }) => {
    const userData =
      typeof oauthUser === "string" ? JSON.parse(oauthUser) : oauthUser;
    const normalizedUser = normalizeAuthUser(userData);

    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const completeCredentialsLogin = (credentials) => {
    const payload = credentials?.data?.credentials || credentials;
    return completeOAuthLogin(payload);
  };

  const signupWithGmail = async (idToken, role = "Student") => {
    const response = await api.post("/api/Account/signup/gmail", {
      idToken,
      role,
    });
    return completeCredentialsLogin(response.data);
  };

  const loginWithGmail = async (idToken) => {
    const response = await api.post("/api/Account/login/gmail", { idToken });
    return completeCredentialsLogin(response.data);
  };

  const loginWithGoogleIdToken = signupWithGmail;

  const renderGmailButton = async ({
    container,
    mode = "login",
    role = "Student",
    onSuccess,
    onError,
  }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("VITE_GOOGLE_CLIENT_ID is not configured");
    }
    if (!container) return;

    const google = await loadGoogleIdentityScript();
    container.innerHTML = "";
    google.accounts.id.initialize({
      client_id: clientId,
      use_fedcm_for_prompt: true,
      callback: async (response) => {
        try {
          if (!response?.credential) {
            throw new Error("Google did not return an ID token");
          }

          const userData =
            mode === "signup"
              ? await signupWithGmail(response.credential, role)
              : await loginWithGmail(response.credential);
          onSuccess?.(userData);
        } catch (error) {
          onError?.(error);
        }
      },
    });

    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signup" ? "signup_with" : "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 320,
    });
  };

  const startGmailIdTokenFlow = async (mode = "login", role = "Student") => {
    if (activeGooglePrompt) return activeGooglePrompt;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("VITE_GOOGLE_CLIENT_ID is not configured");
    }

    activeGooglePrompt = (async () => {
      const google = await loadGoogleIdentityScript();

      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error("Google sign-in was not completed. Please try again."));
        }, 60000);

        google.accounts.id.cancel();
        google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: true,
          cancel_on_tap_outside: false,
          callback: async (response) => {
            try {
              if (!response?.credential) {
                throw new Error("Google did not return an ID token");
              }

              const userData =
                mode === "signup"
                  ? await signupWithGmail(response.credential, role)
                  : await loginWithGmail(response.credential);
              window.clearTimeout(timeout);
              resolve(userData);
            } catch (error) {
              window.clearTimeout(timeout);
              reject(error);
            }
          },
        });

        google.accounts.id.prompt();
      });
    })();

    try {
      return await activeGooglePrompt;
    } finally {
      activeGooglePrompt = null;
    }
  };

  const login = async (email, password) => {
    const response = await api.post("/api/Account/Login", { email, password });
    const { accessToken, refreshToken, user: loginUser } = response.data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    try {
      const profileResponse = await api.get("/api/Account/Account/GetProfile");
      const userData = profileResponse.data?.data || profileResponse.data || loginUser;
      const userWithRole = normalizeAuthUser(userData);

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
      const userWithRole = normalizeAuthUser(userData);

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
        startOAuthLogin,
        completeOAuthLogin,
        loginWithGoogleIdToken,
        signupWithGmail,
        loginWithGmail,
        renderGmailButton,
        startGmailIdTokenFlow,
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
