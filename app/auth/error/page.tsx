import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {params?.error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    {params.error}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  An unspecified error occurred during authentication.
                </p>
              )}
              
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                If this problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
