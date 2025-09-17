'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function useAuthRedirect(redirectTo: string = '/') {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to:', redirectTo);
        // Use replace to prevent back button issues
        router.replace(redirectTo);
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        router.replace('/login');
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('User already logged in, redirecting to:', redirectTo);
        router.replace(redirectTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, redirectTo]);
}