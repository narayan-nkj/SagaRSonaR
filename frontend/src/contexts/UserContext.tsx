/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
  login: (email: string, name: string, role?: string) => void;
  logout: () => void;
}

const defaultProfile: UserProfile = {
  fullName: 'Operator 04',
  email: 'operator04@sagar.gov.in',
  avatarUrl: null,
  role: 'Senior Analyst',
};

export const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  updateProfile: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('sagar_token');
    const userStr = sessionStorage.getItem('sagar_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setProfile({
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || null
        });
        setIsAuthenticated(true);
      } catch (e) {
        sessionStorage.removeItem('sagar_token');
        sessionStorage.removeItem('sagar_user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      
      // Persist to sessionStorage
      const userStr = sessionStorage.getItem('sagar_user');
      if (userStr) {
          try {
              const user = JSON.parse(userStr);
              sessionStorage.setItem('sagar_user', JSON.stringify({ ...user, ...updates }));
          } catch (e) {}
      }
      
      return next;
    });
  };

  const login = (email: string, name: string, role?: string) => {
    setProfile(prev => {
      const next = { ...prev, email, fullName: name || 'Operator', role: role || prev.role };
      return next;
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('sagar_token');
    sessionStorage.removeItem('sagar_user');
    setIsAuthenticated(false);
  };

  if (isLoading) return null; // Or a small spinner

  return (
    <UserContext.Provider value={{ profile, updateProfile, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

