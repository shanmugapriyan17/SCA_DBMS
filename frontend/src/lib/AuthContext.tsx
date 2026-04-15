/**
 * @file AuthContext.tsx
 * @description Authentication context provider
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

interface User {
    _id: string;
    username: string;
    email: string;
    profile?: {
        full_name?: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchUser() {
        try {
            const response: any = await authApi.getMe();
            setUser(response.data.user);
        } catch (error) {
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const response: any = await authApi.login(email, password);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    }

    async function signup(name: string, email: string, password: string) {
        const username = email.split('@')[0];
        const response: any = await authApi.register(username, email, password, name);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            signup,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
