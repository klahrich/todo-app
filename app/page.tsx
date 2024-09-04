"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginScreen from '@/components/login-screen';
import TodoList from '@/components/todo-list';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <TodoList userId={user.uid} />
        )}
      </div>
    </div>
  );
}
