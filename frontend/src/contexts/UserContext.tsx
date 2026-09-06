/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

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
  login: (email: string, name: string) => void;
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

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
  };

  const login = (email: string, name: string) => {
    setProfile(prev => {
      const next = { ...prev, email, fullName: name || 'Operator' };
      return next;
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

