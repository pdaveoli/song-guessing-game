"use client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getAccessToken, getAllArtistSongs, getAllArtistSongsById, getRandomSavedTrack, getRandomSongByArtist } from "@/app/spotify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Music, Clock, Trophy, Play, Shield, Target, Flame, Star, Search, User } from "lucide-react";
import SongGuesser from "@/components/song-guesser";
import type { SpotifyTrack, SpotifyArtist } from "@/app/types";



export default function ArtistPage() {
    const [loading, isLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [artist, setArtist] = useState<string>('');
    const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [tracksDone, setTracksDone] = useState<SpotifyTrack[]>([]);
    
    // Autocomplete states
    const [artistSuggestions, setArtistSuggestions] = useState<SpotifyArtist[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

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

    // Add search artists function
    const searchArtists = async (query: string) => {
        if (!query.trim() || !accessToken) return;
        
        setSearchLoading(true);
        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            setArtistSuggestions(data.artists.items);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Artist search error:', error);
            setArtistSuggestions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (artist.length > 1) {
                searchArtists(artist);
            } else {
                setArtistSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [artist, accessToken]);

    // Handle artist selection
    const handleArtistSelect = (selectedArtist: SpotifyArtist) => {
        setSelectedArtist(selectedArtist);
        setArtist(selectedArtist.name);
        setShowSuggestions(false);
    };

    // Handle input change
    const handleArtistInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setArtist(value);
        
        // Clear selected artist if input doesn't match
        if (selectedArtist && value !== selectedArtist.name) {
            setSelectedArtist(null);
        }
    };

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
        
        if (!selectedArtist) {
            alert('Please select an artist first!');
            return;
        }

        setStarted(true);
        console.log("Starting artist game with artist:", selectedArtist.name, "ID:", selectedArtist.id);

        // Use the artist ID instead of name for more accurate results
        const artistSongs = await getAllArtistSongsById(selectedArtist.id, accessToken);
        if (!artistSongs || artistSongs.length === 0) {
            console.error('No songs found for artist:', selectedArtist.name);
            alert('No songs found for this artist. Please try another artist.');
            setStarted(false);
            return;
        }
        setTracks(artistSongs || []);
        setTracksDone([]);

        try {
            const randomTrack = await getRandomSongByArtist(artistSongs, tracksDone);
            setTrack(randomTrack);
            if (randomTrack) {
                setTracksDone(prev => [...prev, randomTrack]);
            }
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
            const randomTrack = await getRandomSongByArtist(tracks, tracksDone);
            setTrack(randomTrack);
            if (randomTrack) {
                setTracksDone(prev => [...prev, randomTrack]);
            }
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
                            <p className="text-lg">Loading artist music....</p>
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
                                        Artist Mode
                                    </Badge>
                                </div>
                                
                                <div className="text-center">
                                    <h1 className="text-5xl font-bold mb-4">🎵 Artist Mode</h1>
                                    <p className="text-xl text-blue-100 mb-8">
                                        How well do you know your favourite artists?
                                    </p>
                                    
                                    {/* Feature highlights */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Music className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-semibold mb-2">Choose an artist</h3>
                                            <p className="text-sm text-blue-100">You will be tested on an artist of your choice</p>
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
                                    
                                    {/* Enhanced Artist Selection */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 relative">
                                        <h3 className="text-lg font-semibold mb-4">Select Your Artist</h3>
                                        <p className="text-sm text-blue-100 mb-4">
                                            Search for any artist on Spotify to test your knowledge
                                        </p>
                                        
                                        {/* Artist Search Input */}
                                        <div className="relative">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search for an artist..." 
                                                    value={artist} 
                                                    onChange={handleArtistInputChange}
                                                    onFocus={() => artist.length > 1 && setShowSuggestions(true)}
                                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/30 transition-all"
                                                />
                                                {searchLoading && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && artistSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                                                    {artistSuggestions.map((suggestion, index) => (
                                                        <div
                                                            key={suggestion.id}
                                                            onClick={() => handleArtistSelect(suggestion)}
                                                            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                        >
                                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                                                                {suggestion.images[0] ? (
                                                                    <img 
                                                                        src={suggestion.images[0].url} 
                                                                        alt={suggestion.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {suggestion.name}
                                                                </p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {suggestion.followers.total.toLocaleString()} followers
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {suggestion.genres.slice(0, 2).join(', ')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Selected Artist Display */}
                                        {selectedArtist && (
                                            <div className="mt-4 p-4 bg-white/20 rounded-lg border border-white/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                                                        {selectedArtist.images[0] ? (
                                                            <img 
                                                                src={selectedArtist.images[0].url} 
                                                                alt={selectedArtist.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-6 h-6 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-white">
                                                            {selectedArtist.name}
                                                        </h4>
                                                        <p className="text-sm text-blue-100">
                                                            {selectedArtist.followers.total.toLocaleString()} followers
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className="bg-green-500 text-white">
                                                            ✓ Selected
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                        disabled={!selectedArtist}
                                        className={`px-12 py-6 text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 ${
                                            selectedArtist 
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                                                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        }`}
                                    >
                                        <Play className="w-6 h-6 mr-2" />
                                        {selectedArtist ? 'Start Playing' : 'Select an Artist'}
                                    </Button>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                        {selectedArtist ? (
                                            <>
                                                Playing: <span className="font-semibold">{selectedArtist.name}</span> • 
                                                Difficulty: <span className="font-semibold capitalize">{difficulty}</span>
                                            </>
                                        ) : (
                                            'Please select an artist to continue'
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Rest of the leaderboard sidebar remains the same */}
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

    // Game playing state remains the same...
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
                                            {selectedArtist?.name} - Round {roundNumber}
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
                                        This track is by <span className="font-semibold">{selectedArtist?.name}</span>
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

                    {/* Sidebar - same as before */}
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
