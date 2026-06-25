import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [organization, setOrganization] = useState(null);
  const [orgType, setOrgType] = useState(null); // 'staffing_agency' | 'organization' | null (platform)

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
      } catch (appError) {
        // 404 means the endpoint doesn't exist — not a fatal error, continue normally
        if (appError.status !== 404) {
          console.warn('App public settings fetch failed:', appError.message);
        }
        // Only treat specific 403 reasons as blocking errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
          return;
        }
      }

      // Check user auth regardless of whether public-settings succeeded
      setIsLoadingPublicSettings(false);
      if (appParams.token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
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
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
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
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
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