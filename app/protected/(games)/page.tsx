"use client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { getAccessToken, getUsersTopOrRecentTracks } from "@/app/spotify";
import { SpotifyTrack } from "../../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Zap, Trophy, Users, Music, Clock, Star, Shuffle, Target, Calendar
} from "lucide-react";

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
            const tracks = await getUsersTopOrRecentTracks(token, 10);
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

  const gameModesData = [
    {
      id: 'classic',
      title: 'Classic Mode',
      description: 'How well do you know your liked songs? Test yourself, this quiz goes through all your liked songs!',
      icon: <Play className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      route: '/protected/classic'
    },
    {
      id: 'speed',
      title: 'Speed Round',
      description: '10 seconds per song',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      route: '/protected/speed'
    },
    {
      id: 'artist',
      title: 'Artist Challenge',
      description: 'Guess songs by specific artists',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      route: '/protected/artist'
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer',
      description: 'Play with friends',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      route: '/protected/multiplayer'
    },
    {
      id: 'genre',
      title: 'Genre Challenge',
      description: 'Rock, Pop, Hip-Hop & more',
      icon: <Music className="w-6 h-6" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      route: '/protected/genre'
    },
    {
      id: 'marathon',
      title: 'Marathon Mode',
      description: 'Play until you lose',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-red-500 hover:bg-red-600',
      route: '/protected/marathon'
    },
    {
      id: 'daily',
      title: 'Daily Challenge',
      description: 'New challenge every day',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      route: '/protected/daily'
    },
    {
      id: 'random',
      title: 'Random Mix',
      description: 'Surprise me!',
      icon: <Shuffle className="w-6 h-6" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      route: '/protected/random'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Top Songs */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Your Top Songs
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Songs from your library
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {tracks.length > 0 ? (
                  <>
                    {tracks.slice(0, 8).map((track, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="relative">
                          <img 
                            src={track.album.images[0]?.url} 
                            alt={track.name} 
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {track.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {track.artists.map(artist => artist.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {tracks.length > 8 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-gray-500">
                          +{tracks.length - 8} more songs
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No saved tracks found
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Save some songs on Spotify first!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Game Modes */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Game Mode
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select from various challenge types to test your music knowledge
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameModesData.map((mode) => (
                <Card key={mode.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${mode.color} text-white group-hover:scale-110 transition-transform`}>
                        {mode.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{mode.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {mode.description}
                        </p>
                        <Button 
                          className={`w-full ${mode.color} text-white border-none`}
                          onClick={() => {
                            redirect(mode.route);
                          }}
                        >
                          Play Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Games Played</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Correct Guesses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Best Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
