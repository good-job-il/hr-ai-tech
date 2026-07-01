import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { tokenStorage } from '@/api/client/tokenStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // unused with NestJS backend, kept for API compat
  const [organization, setOrganization] = useState(null);
  const [orgType, setOrgType] = useState(null); // 'staffing_agency' | 'organization' | null (platform)

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    // With the NestJS JWT backend there's no separate "app public settings"
    // handshake — we simply check whether a stored access token is valid.
    if (tokenStorage.hasToken()) {
      await checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      
      // עדכן last_login
      if (currentUser.user_type) {
        base44.auth.updateMe({ last_login: new Date().toISOString() }).catch(() => {});
      }
      
      setUser(currentUser);
      setIsAuthenticated(true);

      // Load organization context synchronously before releasing loading state
      // This prevents ProtectedRoute from evaluating orgType before it's set
      if (currentUser?.organization_id) {
        try {
          const results = await base44.entities.Organization.filter(
            { id: currentUser.organization_id }, '', 1
          );
          const org = results?.[0] || null;
          setOrganization(org);
          setOrgType(org?.org_type || null);
        } catch (_) {
          // org load failed — treat as no org (platform operator or orphaned user)
        }
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      // 401 / 403 just means the stored token is stale — not an app-level error.
      // Clear the stale token from storage and treat the user as unauthenticated.
      if (error.status === 401 || error.status === 403) {
        tokenStorage.clearTokens();
      } else {
        console.error('User auth check failed:', error);
      }
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      base44.auth.logout(`/login?from_url=${from}`);
    } else {
      // Just clear tokens, no navigation
      tokenStorage.clearTokens();
    }
  };

  const navigateToLogin = () => {
    const from = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?from_url=${from}`;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      organization,
      orgType,         // 'staffing_agency' | 'organization' | null
      isSuperAdmin: user?.role === 'super_admin' || user?.role === 'admin',
      isAgency: orgType === 'staffing_agency',
      isCompany: orgType === 'organization',
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
