import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function AuthStatusPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-2xl">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-900 dark:text-white">
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Authentication Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Successfully Authenticated</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Welcome to Song Guessing Game!</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-3">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Email:</span>
                      <span className="text-slate-900 dark:text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Provider:</span>
                      <Badge variant="outline">{user.app_metadata.provider}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Email Verified:</span>
                      {user.email_confirmed_at ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Not Verified</Badge>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">User ID:</span>
                      <span className="text-slate-900 dark:text-white font-mono text-xs">{user.id}</span>
                    </div>
                  </div>
                </div>

                {user.user_metadata?.full_name && (
                  <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Spotify Profile</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Name:</span>
                        <span className="text-slate-900 dark:text-white">{user.user_metadata.full_name}</span>
                      </div>
                      {user.user_metadata.avatar_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Avatar:</span>
                          <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Profile"
                            className="w-8 h-8 rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Not Authenticated</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Please log in to continue</p>
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <a 
                href={user ? "/protected" : "/auth/login"}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full transition-colors"
              >
                {user ? "Go to Dashboard" : "Sign In"}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
