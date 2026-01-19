import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loadApiSettings, clearSettingsCache } from '../utils/storage';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                let effectiveSession = initialSession ?? null;
                const expiresAtMs = effectiveSession?.expires_at ? effectiveSession.expires_at * 1000 : null;
                const needsRefresh = expiresAtMs !== null && expiresAtMs <= Date.now() + 30000;

                if (needsRefresh) {
                    const { data, error: refreshError } = await supabase.auth.refreshSession();
                    if (!refreshError) {
                        effectiveSession = data.session ?? null;
                    }
                }

                setSession(effectiveSession);
                setUser(effectiveSession?.user ?? null);

                if (effectiveSession?.user) {
                    await loadApiSettings(effectiveSession.user.id, effectiveSession.access_token);
                }
            } catch (err) {
                console.error('Error checking session:', err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session ?? null);
            setUser(session?.user ?? null);
            setLoading(false);
            // Load settings when user logs in
            if (session?.user) {
                await loadApiSettings(session.user.id, session.access_token);
            } else {
                // Clear cache when user logs out
                clearSettingsCache();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password) => {
        setError(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            setError(err.message);
            return { data: null, error: err };
        }
    };

    const signIn = async (email, password) => {
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            setError(err.message);
            return { data: null, error: err };
        }
    };

    const signOut = async () => {
        setError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setSession(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const resetPassword = async (email) => {
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            return { error: null };
        } catch (err) {
            setError(err.message);
            return { error: err };
        }
    };

    const value = {
        user,
        session,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isAuthenticated: !!session,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
