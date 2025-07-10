import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/protected'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/protected'
  }

  // Handle OAuth errors
  if (error) {
    const errorParams = new URLSearchParams({
      error: error,
      error_description: errorDescription || 'An authentication error occurred'
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Handle specific authentication errors
      let errorMessage = exchangeError.message
      let isEmailVerification = false
      
      // Check if this is an email verification issue
      if (errorMessage.toLowerCase().includes('email') || 
          errorMessage.toLowerCase().includes('verify') ||
          errorMessage.toLowerCase().includes('confirmation') ||
          errorMessage.toLowerCase().includes('confirm')) {
        isEmailVerification = true
        errorMessage = 'Please check your email and click the verification link to complete your account setup.'
      }
      
      const errorParams = new URLSearchParams({
        error: isEmailVerification ? 'email_verification_required' : 'authentication_failed',
        error_description: errorMessage
      })
      
      return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
    }
  }
  
  // return the user to an error page with instructions
  const errorParams = new URLSearchParams({
    error: 'missing_code',
    error_description: 'No authorization code was provided in the callback.'
  })
  return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams}`)
}