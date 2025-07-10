"use client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getUserSavedTracks, getAccessToken } from "../spotify";
import { SpotifyTrack } from "../types";

export default function ProtectedPage() {

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  useEffect(() => {
    const loadPage = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session. Please try again.');
        setIsLoading(false);
        redirect('/auth/login');
        return;
      }
      if (!session) {
        console.log('No active session found, redirecting to login');
        redirect('/auth/login');
        return;
      } else {
        console.log('Session loaded successfully:', session);
        
      }

      // Get the user's saved tracks
      if (session) {
        const token = await getAccessToken();
        setAccessToken(token);
        if (!token) {
          console.error('No access token found, redirecting to login');
          setError('Failed to retrieve access token. Please log in again.');
          setIsLoading(false);
          redirect('/auth/login');
          return;
        } else {
          try {
            const tracks = await getUserSavedTracks(token);
            console.log('User saved tracks:', tracks);
            setTracks(tracks);
          } catch (fetchError) {
            console.error('Error fetching user saved tracks:', fetchError);
            setError('Failed to fetch user saved tracks.');
          }
        }
      }
      setIsLoading(false);
    };
    
    loadPage();
  }, []);

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            ) : (
              <div>
                {tracks.length > 0 ? (
                  <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4">Your Saved Tracks</h1>
                    <ul className="space-y-4">
                      {tracks.map((track, index) => (
                        <li key={index} className="flex items-center gap-4">
                          <img src={track.album.images[0].url} alt={track.name} className="w-16 h-16 rounded" />
                          <div>
                            <h2 className="text-lg font-semibold">{track.name}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{track.artists.map(artist => artist.name).join(', ')}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    </div>
                ) : (
                  <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4">No Saved Tracks Found</h1>
                    <p className="text-gray-600 dark:text-gray-400">You have not saved any tracks yet.</p>
                  </div>
                )}
              </div>
            )}
      </div>
    </div>
  );
}
