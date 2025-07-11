"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { getAccessToken, getRandomSavedTrack } from "@/app/spotify";
import { Button } from "@/components/ui/button";
import { SpotifyTrack } from "@/app/types";
import SongGuesser from "@/components/song-guesser";
import { ArrowLeft, Trophy, Target, Music, Crown, Star, Users, Clock, Zap, Play, Shield, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ClassicModePage() {
    const [loading, isLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

    // Enhanced stats
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [sessionScore, setSessionScore] = useState(0);

    // Mock leaderboard data
    const [leaderboard] = useState([
        { rank: 1, name: "MusicMaster", score: 12450, streak: 28 },
        { rank: 2, name: "SongGenius", score: 11200, streak: 24 },
        { rank: 3, name: "BeatExpert", score: 10800, streak: 22 },
        { rank: 4, name: "You", score: 9650, streak: 18 },
        { rank: 5, name: "RhythmKing", score: 8900, streak: 16 },
    ]);

    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient();
            const { data: user, error } = await supabase.auth.getUser();
            if (error || !user) {
                console.error("Failed to fetch user data:", error);
                redirect("/auth/login");
            }
            const token = await getAccessToken();
            if (!token) {
                console.error('No access token found');
                redirect("/auth/login");
            }
            setAccessToken(token);
            isLoading(false);
        }
        loadData().catch((error) => {
            console.error("Error loading data:", error);
            redirect("/auth/login");
        });
    }, []);

    const calculateScore = (timeRemaining: number, difficulty: string) => {
        const baseScore = 100;
        const difficultyMultiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
        const timeBonus = Math.floor(timeRemaining * 2);
        const streakBonus = currentStreak * 10;
        return (baseScore + timeBonus + streakBonus) * difficultyMultiplier;
    };

    const startGame = async () => {
        if (!accessToken) {
            console.error('No access token available');
            return;
        }
        setStarted(true);
        console.log("Starting classic game with access token:", accessToken);
        try {
            const randomTrack = await getRandomSavedTrack(accessToken);
            setTrack(randomTrack);
        } catch (error) {
            console.error("Error fetching random track:", error);
            setTrack(null);
            return;
        }
    };

    const onPlayAgain = async () => {
        setTrack(null);
        isLoading(true);
        try {
            const randomTrack = await getRandomSavedTrack(accessToken!);
            setTrack(randomTrack);
        } catch (error) {
            console.error("Error fetching random track:", error);
            setTrack(null);
            return;
        }
        isLoading(false);
        setStarted(true);
    }

    const onQuestionRight = () => {
        const points = calculateScore(15, difficulty);
        setCorrectAnswers(prev => prev + 1);
        setQuestionsAnswered(prev => prev + 1);
        setRoundNumber(prev => prev + 1);
        setCurrentStreak(prev => prev + 1);
        setSessionScore(prev => prev + points);
        setTotalScore(prev => prev + points);
        
        if (currentStreak >= bestStreak) {
            setBestStreak(currentStreak + 1);
        }
    }
    
    const onQuestionWrong = () => {
        setQuestionsAnswered(prev => prev + 1);
        setRoundNumber(prev => prev + 1);
        setCurrentStreak(0);
    }

    const goBack = () => {
        // stop the game and go back to the start menu
        resetGame();
    };

    const resetGame = () => {
        setStarted(false);
        setTrack(null);
        setQuestionsAnswered(0);
        setCorrectAnswers(0);
        setRoundNumber(1);
        setCurrentStreak(0);
        setSessionScore(0);
    };

    const getDifficultyIcon = (level: string) => {
        switch (level) {
            case 'easy': return <Shield className="w-6 h-6" />;
            case 'medium': return <Target className="w-6 h-6" />;
            case 'hard': return <Flame className="w-6 h-6" />;
            default: return <Shield className="w-6 h-6" />;
        }
    };

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'easy': return 'from-green-500 to-emerald-600';
            case 'medium': return 'from-yellow-500 to-orange-500';
            case 'hard': return 'from-red-500 to-pink-600';
            default: return 'from-green-500 to-emerald-600';
        }
    };

    if (loading) {
        return (
            <div className="p-4 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
                <Card className="w-full max-w-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-4"></div>
                            <p className="text-lg">Loading your music library...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="p-4 max-w-7xl mx-auto min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8">
                    
                    {/* Main Game Setup */}
                    <div className="lg:col-span-3">
                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-8 text-white">
                                <div className="flex items-center justify-between mb-6">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => redirect('/protected')}
                                        className="text-white hover:bg-white/20 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Home
                                    </Button>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                        <Music className="w-4 h-4 mr-1" />
                                        Classic Mode
                                    </Badge>
                                </div>
                                
                                <div className="text-center">
                                    <h1 className="text-5xl font-bold mb-4">🎵 Classic Mode</h1>
                                    <p className="text-xl text-blue-100 mb-8">
                                        Challenge yourself with songs from your Spotify library
                                    </p>
                                    
                                    {/* Feature highlights */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Music className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-semibold mb-2">Your Music</h3>
                                            <p className="text-sm text-blue-100">Songs from your saved library</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Clock className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-semibold mb-2">30 Seconds</h3>
                                            <p className="text-sm text-blue-100">Listen to song previews</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Trophy className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-semibold mb-2">Score Points</h3>
                                            <p className="text-sm text-blue-100">Build streaks for bonuses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <CardContent className="p-8">
                                {/* Difficulty Selection */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                                        Choose Your Challenge
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['easy', 'medium', 'hard'].map((level) => (
                                            <div
                                                key={level}
                                                onClick={() => setDifficulty(level as 'easy' | 'medium' | 'hard')}
                                                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                                    difficulty === level 
                                                        ? 'ring-4 ring-blue-500 ring-opacity-50' 
                                                        : 'hover:shadow-lg'
                                                }`}
                                            >
                                                <Card className={`overflow-hidden border-2 ${
                                                    difficulty === level 
                                                        ? 'border-blue-500 shadow-lg' 
                                                        : 'border-gray-200 dark:border-gray-700'
                                                }`}>
                                                    <div className={`bg-gradient-to-r ${getDifficultyColor(level)} p-6 text-white`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                {getDifficultyIcon(level)}
                                                                <h3 className="text-2xl font-bold capitalize">{level}</h3>
                                                            </div>
                                                            {difficulty === level && (
                                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm">Attempts:</span>
                                                                <span className="font-bold">
                                                                    {level === 'easy' ? '3' : level === 'medium' ? '2' : '1'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm">Point Multiplier:</span>
                                                                <span className="font-bold">
                                                                    {level === 'easy' ? '1x' : level === 'medium' ? '2x' : '3x'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-gray-800">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                                            {level === 'easy' && 'Perfect for beginners. More chances to guess correctly.'}
                                                            {level === 'medium' && 'Balanced challenge. Good for regular players.'}
                                                            {level === 'hard' && 'Ultimate challenge. One shot to prove your skills.'}
                                                        </p>
                                                    </div>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Start Game Button */}
                                <div className="text-center">
                                    <Button 
                                        onClick={startGame} 
                                        size="lg"
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                                    >
                                        <Play className="w-6 h-6 mr-2" />
                                        Start Playing
                                    </Button>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                        Selected: <span className="font-semibold capitalize">{difficulty}</span> Mode
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leaderboard Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Top Players
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {leaderboard.map((player, index) => (
                                        <div 
                                            key={index} 
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                                player.name === 'You' 
                                                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 shadow-md' 
                                                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                player.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                                                player.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' :
                                                player.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                                                'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                                            }`}>
                                                {player.rank === 1 ? '👑' : player.rank}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{player.name}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {player.score.toLocaleString()} pts
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                    🔥 {player.streak}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                                    <h4 className="font-semibold text-sm mb-2">🎯 Your Goal</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Beat the current #4 position with 9,650 points!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Rest of the component remains the same for when game is started...
    if (started && track) {
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
        
        return (
            <div className="p-4 max-w-7xl mx-auto min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Main Game Area */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Stats Header */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={goBack}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Music className="w-4 h-4" />
                                            Round {roundNumber}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-purple-600">
                                                {questionsAnswered}
                                            </div>
                                            <div className="text-xs text-gray-500">Questions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {correctAnswers}
                                            </div>
                                            <div className="text-xs text-gray-500">Correct</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">
                                                {accuracy}%
                                            </div>
                                            <div className="text-xs text-gray-500">Accuracy</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-orange-600">
                                                🔥 {currentStreak}
                                            </div>
                                            <div className="text-xs text-gray-500">Streak</div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={resetGame}
                                            className="text-sm"
                                        >
                                            Restart
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Game Content */}
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-bold mb-2">🎵 Guess the Song</h1>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        This track is from your Spotify library
                                    </p>
                                    <div className="mt-4 flex justify-center">
                                        <Badge variant="outline" className="text-sm">
                                            Session Score: {sessionScore.toLocaleString()} pts
                                        </Badge>
                                    </div>
                                </div>
                                
                                <SongGuesser 
                                    trackName={track.name} 
                                    difficulty={difficulty} 
                                    artistName={track.artists[0].name} 
                                    onGuessRight={onQuestionRight} 
                                    onGuessWrong={onQuestionWrong} 
                                    onPlayAgain={onPlayAgain} 
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Session Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Session Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {sessionScore.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600">Session Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-orange-600">
                                        🔥 {currentStreak}
                                    </div>
                                    <div className="text-sm text-gray-600">Current Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                        {bestStreak}
                                    </div>
                                    <div className="text-sm text-gray-600">Best Streak</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leaderboard */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    {leaderboard.slice(0, 5).map((player, index) => (
                                        <div 
                                            key={index} 
                                            className={`flex items-center gap-2 p-2 rounded ${
                                                player.name === 'You' 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                    : 'bg-gray-50 dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                player.rank === 1 ? 'bg-yellow-500 text-white' :
                                                player.rank === 2 ? 'bg-gray-400 text-white' :
                                                player.rank === 3 ? 'bg-orange-500 text-white' :
                                                'bg-gray-300 text-gray-700'
                                            }`}>
                                                {player.rank}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{player.name}</p>
                                                <p className="text-xs text-gray-600">
                                                    {player.score.toLocaleString()} pts
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}