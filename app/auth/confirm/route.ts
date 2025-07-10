import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/protected";
  
  // Handle OAuth code exchange
  const code = searchParams.get("code");
  
  // Handle direct access token (from email links)
  const access_token = searchParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token");

  console.log('Auth confirm params:', {
    token_hash: !!token_hash,
    type,
    code: !!code,
    access_token: !!access_token,
    refresh_token: !!refresh_token
  });

  // Handle direct token exchange (from email verification)
  if (access_token && refresh_token) {
    const supabase = await createClient();
    
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      
      if (!error && data.session) {
        console.log('Session set successfully from email verification');
        redirect(next);
      } else {
        console.error('Session setting failed:', error);
        redirect(`/auth/error?error=${error?.message || 'Failed to set session'}`);
      }
    } catch (error) {
      console.error('Session setting exception:', error);
      redirect(`/auth/error?error=Failed to process email verification`);
    }
  }

  // Handle OAuth code exchange
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('OAuth code exchange successful');
      redirect(next);
    } else {
      console.error('OAuth code exchange failed:', error);
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // Handle OTP verification (email confirmation)
  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      console.log('OTP verification successful');
      redirect(next);
    } else {
      console.error('OTP verification failed:', error);
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // No valid parameters found
  console.log('No valid auth parameters found');
  redirect(`/auth/error?error=No valid authentication parameters provided`);
}
