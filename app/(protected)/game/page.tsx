"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { getAccessToken, getRandomSavedTrack } from "@/app/spotify";
import { Button } from "@/components/ui/button";
import { SpotifyTrack } from "@/app/types";
import SongGuesser from "@/components/song-guesser";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";


export default function GamePage() {
    const [loading, isLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');


    // Round stats
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);

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

    const startGame = async () => {
        if (!accessToken) {
            console.error('No access token available');
            return;
        }
        setStarted(true);
        console.log("Starting game with access token:", accessToken);
        // Pick a random song
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
        console.log("Playing again with new track:", track);
    }


    const onQuestionRight = () => {
        setCorrectAnswers(prev => prev + 1);
        setQuestionsAnswered(prev => prev + 1);
        setRoundNumber(prev => prev + 1);
    }
    const onQuestionWrong = () => {
        setQuestionsAnswered(prev => prev + 1);
        setRoundNumber(prev => prev + 1);
    }

    if (loading) {
        return (
            <div className="p-4 max-w-2xl mx-auto min-h-screen flex flex-col items-center justify-center">
                <div className="h-[40vh] p-6 flex flex-col items-center justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold">Round {roundNumber}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {questionsAnswered} Questions
                            </span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {correctAnswers} Correct
                            </span>
                        </div>
                    </div>
                    <div className=" w-full items-center justify-center border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 h-full ">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-sm ml-4">Loading....</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!started) {
        return (
            <div className="p-4 max-w-2xl mx-auto min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">🎵 Song Guessing Game</h1>
                <p className="mb-4">Welcome to the Song Guessing Game! Click the button below to start playing.</p>
                <p className="mb-4"> How it works: You will listen to a short preview of a song and try to guess the title and artist. You have 30 seconds to guess!</p>
                <p>The game goes through your liked tracks on spotify and chooses one at random</p>
                <ToggleGroup type="single" defaultValue="easy" onValueChange={(e) => setDifficulty(e as 'easy' | 'medium' | 'hard')} className="my-4">
                    <ToggleGroupItem value="easy" className="bg-green-100 text-green-800 hover:bg-green-200">Easy</ToggleGroupItem>
                    <ToggleGroupItem value="medium" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Medium</ToggleGroupItem>
                    <ToggleGroupItem value="hard" className="bg-red-100 text-red-800 hover:bg-red-200">Hard</ToggleGroupItem>
                </ToggleGroup>
                <Button onClick={startGame} className="bg-blue-600 text-white hover:bg-blue-700">
                    Start Game
                </Button>
            </div>
        );
    }

    if (started && track) {
        return (
            <div className="p-4 w-full min-h-screen flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full items-center text-center rounded-lg shadow-md p-6 ">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold">Round {roundNumber}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                {questionsAnswered} Questions
                            </span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {correctAnswers} Correct
                            </span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">🎵 Guess the song </h1>
                    <SongGuesser trackName={track.name} difficulty={difficulty} artistName={track.artists[0].name} onGuessRight={onQuestionRight} onGuessWrong={onQuestionWrong} onPlayAgain={onPlayAgain} />
                </div>
            </div>
        )
    }

}