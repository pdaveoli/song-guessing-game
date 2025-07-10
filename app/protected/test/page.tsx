"use client";
import { getAccessToken, getRandomSavedTrack } from "@/app/spotify";
import { Button } from "@/components/ui/button";
import { UniversalMusicPlayer } from "@/components/universal-music-player";
import { useEffect, useState } from "react";

export default function TestPage() {
    const [loading, setLoading] = useState(true);
    const [track, setTrack] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrack = async () => {
            try {
                const token = await getAccessToken();
                setAccessToken(token);

                if (!token) {
                    console.error('No access token found');
                    return;
                }

                const randomTrack = await getRandomSavedTrack(token);
                setTrack(randomTrack);
            } catch (error) {
                console.error('Error fetching random track:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrack();
    }, []);

    const randomSong = async () => {
        setLoading(true);
        try {
            if (!accessToken) return;
            const randomTrack = await getRandomSavedTrack(accessToken);
            setTrack(randomTrack);
        } catch (error) {
            console.error('Error fetching random track:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">🎵 Song Guessing Game</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="space-y-6">
                    {/* Universal Music Player */}
                    {track && (
                        <UniversalMusicPlayer
                            trackName={track.name}
                            artistName={track.artists[0]?.name || 'Unknown Artist'}
                        />
                    )}

                    {/* Controls */}
                    <div className="text-center">
                        <Button onClick={randomSong} disabled={loading} size="lg">
                            {loading ? "Loading..." : "🎲 Get New Mystery Song"}
                        </Button>
                    </div>

                    {/* Debug info */}
                    {track && (
                        <details className="text-sm text-gray-600">
                            <summary className="cursor-pointer">Debug Info</summary>
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                <p><strong>Spotify Track:</strong> {track.name}</p>
                                <p><strong>Artist:</strong> {track.artists[0]?.name}</p>
                                <p><strong>Album:</strong> {track.album.name}</p>
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}