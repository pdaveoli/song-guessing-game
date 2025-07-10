"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Music } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if environment variables are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseKey && 
    supabaseUrl !== 'your-project-url' && 
    supabaseKey !== 'your-anon-key';

  const handleSpotifyLogin = async () => {
    if (!isConfigured) {
      setError("Supabase is not configured. Please set up your environment variables.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    console.log('Starting Spotify OAuth...');
    console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user-library-read user-read-email user-read-private'
        },
      });
      
      console.log('OAuth Response:', { data, error });
      
      if (error) {
        console.error('OAuth Error:', error);
        throw error;
      }
      
      console.log('OAuth initiated successfully, should redirect soon...');
      
      // The signInWithOAuth should redirect immediately
      // If we're still here after a short delay, something might be wrong
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          console.warn('Still on page after 3 seconds, redirect may have failed');
          setError("Redirect to Spotify failed. Please check if your Spotify OAuth is configured correctly in Supabase, or if popups are blocked.");
          setIsLoading(false);
        }
      }, 3000);
      
    } catch (error: unknown) {
      console.error('handleSpotifyLogin error:', error);
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <div className="flex flex-col items-center gap-6">
        {/* Spotify Logo/Brand */}
        <div className="flex items-center gap-2 text-[#1DB954]">
          <Music className="w-8 h-8" />
          <span className="text-2xl font-bold">Song Guessing Game</span>
        </div>
        
        {/* Main Login Card */}
        <Card className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
              Connect your Spotify account to start playing
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!isConfigured && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
                  ⚠️ Configuration Required
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                  Please set up your Supabase environment variables. See <code>ENV_SETUP.md</code> for instructions.
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}
            
            {/* Main Spotify Login Button */}
            <Button
              onClick={handleSpotifyLogin}
              disabled={isLoading || !isConfigured}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-full text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {!isConfigured ? (
                <span>Configuration Required</span>
              ) : isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.32 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Continue with Spotify</span>
                </div>
              )}
            </Button>
            
            
            {/* Footer */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p>
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-[#1DB954] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#1DB954] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don't have a Spotify account?{" "}
            <a 
              href="https://www.spotify.com/signup" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1DB954] hover:underline font-medium"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
