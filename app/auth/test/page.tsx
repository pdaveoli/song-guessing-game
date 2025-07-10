import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TestAuthPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-lg">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-900 dark:text-white">
              Test Auth Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600 dark:text-slate-400">
              Test different authentication scenarios:
            </p>
            
            <div className="grid gap-3">
              <Link href="/auth/auth-code-error?error=email_verification_required&error_description=Please check your email and click the verification link to complete your account setup.">
                <Button variant="outline" className="w-full">
                  Test Email Verification Flow
                </Button>
              </Link>
              
              <Link href="/auth/auth-code-error?error=access_denied&error_description=The user denied the authorization request.">
                <Button variant="outline" className="w-full">
                  Test Access Denied Error
                </Button>
              </Link>
              
              <Link href="/auth/auth-code-error?error=authentication_failed&error_description=Authentication failed due to an unknown error.">
                <Button variant="outline" className="w-full">
                  Test Generic Error
                </Button>
              </Link>
              
              <Link href="/auth/login">
                <Button className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
