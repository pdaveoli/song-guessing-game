"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there are auth-related parameters in the URL
    const hasAuthParams = 
      searchParams.get('access_token') ||
      searchParams.get('refresh_token') ||
      searchParams.get('token_hash') ||
      searchParams.get('type') ||
      searchParams.get('code');

    if (hasAuthParams) {
      console.log('Auth parameters detected on home page, redirecting to auth handler...');
      
      // Construct the auth confirmation URL with all parameters
      const authUrl = new URL('/auth/confirm', window.location.origin);
      
      // Copy all search parameters to the auth URL
      searchParams.forEach((value, key) => {
        authUrl.searchParams.set(key, value);
      });
      
      console.log('Redirecting to:', authUrl.toString());
      
      // Redirect to the auth confirmation handler
      window.location.href = authUrl.toString();
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
