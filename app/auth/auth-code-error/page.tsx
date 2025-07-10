"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCodeError() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string>('');
    const [errorDescription, setErrorDescription] = useState<string>('');
    const [isEmailVerificationRequired, setIsEmailVerificationRequired] = useState(false);

    useEffect(() => {
        const errorParam = searchParams.get('error');
        const errorDescriptionParam = searchParams.get('error_description');
        
        setError(errorParam || 'Unknown error');
        setErrorDescription(errorDescriptionParam || 'An authentication error occurred');
        
        // Check if this is an email verification scenario
        if (errorParam === 'email_verification_required' ||
            errorParam === 'access_denied' && errorDescriptionParam?.toLowerCase().includes('email') ||
            errorDescriptionParam?.toLowerCase().includes('email') || 
            errorDescriptionParam?.toLowerCase().includes('verify') ||
            errorDescriptionParam?.toLowerCase().includes('confirmation') ||
            errorDescriptionParam?.toLowerCase().includes('confirm') ||
            errorDescriptionParam?.toLowerCase().includes('check your email')) {
            setIsEmailVerificationRequired(true);
        }
    }, [searchParams]);

    if (isEmailVerificationRequired) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="w-full max-w-lg">
                    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                    <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-slate-900 dark:text-white">
                                Check Your Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                        Almost there!
                                    </p>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    We've sent a verification link to your email address. Please check your inbox and click the link to complete your account setup.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                    <p className="mb-2">Didn't receive the email?</p>
                                    <ul className="text-xs space-y-1 text-slate-500 dark:text-slate-500">
                                        <li>• Check your spam/junk folder</li>
                                        <li>• Make sure the email address is correct</li>
                                        <li>• Wait a few minutes and try again</li>
                                    </ul>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <Link href="/auth/login">
                                        <Button className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white">
                                            Back to Login
                                        </Button>
                                    </Link>
                                    
                                    <Link href="/">
                                        <Button variant="outline" className="w-full">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Return to Home
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="w-full max-w-lg">
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
                    <CardContent className="text-center space-y-6">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="text-left">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                    Error: {error}
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {errorDescription}
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            <p>This could happen if:</p>
                            <ul className="text-xs mt-2 space-y-1 text-slate-500 dark:text-slate-500 text-left">
                                <li>• You denied permission to the application</li>
                                <li>• There was a network connectivity issue</li>
                                <li>• The authentication request expired</li>
                                <li>• There's a configuration issue with the service</li>
                            </ul>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <Link href="/auth/login">
                                <Button className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white">
                                    Try Again
                                </Button>
                            </Link>
                            
                            <Link href="/">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Return to Home
                                </Button>
                            </Link>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            If this problem persists, please contact support.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}