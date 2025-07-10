"use client";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Eye, EyeOff, Volume2 } from 'lucide-react';

interface UniversalMusicPlayerProps {
  trackName: string;
  artistName: string;
}

interface TrackData {
  type: string;
  preview: string;
  title: string;
  artist: string;
  image: string;
}

export function UniversalMusicPlayer({ trackName, artistName }: UniversalMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hideAnswer, setHideAnswer] = useState(true);
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(null);

  const searchTrack = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `${trackName} ${artistName}`;
      const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const track = data.data[0];
        setTrackData({
          type: 'deezer',
          preview: track.preview,
          title: track.title,
          artist: track.artist.name,
          image: track.album.cover_medium
        });
      } else {
        setError('No preview found for this track');
      }
    } catch (error) {
      console.error('Track search error:', error);
      setError('Failed to find track preview');
    } finally {
      setLoading(false);
    }
  };

  const startPlayback = () => {
    if (!trackData?.preview || !audioRef.current) return;
    
    setIsPlaying(true);
    setTimeLeft(30);
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
    
    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopPlayback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setTimeLeft(30);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    searchTrack();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [trackName, artistName]);

  if (loading) {
    return (
      <div className="p-6 text-center border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm">🔍 Finding track preview...</p>
      </div>
    );
  }

  if (error || !trackData?.preview) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600">⚠️</span>
          <p className="font-medium text-yellow-800 dark:text-yellow-200">No Preview Available</p>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          {error || 'No audio preview found for this track'}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          Track: {trackName} by {artistName}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={trackData.preview} 
        preload="metadata"
        onEnded={stopPlayback}
      />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-900 dark:text-purple-100">Mystery Song Challenge</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setHideAnswer(!hideAnswer)}
          className="border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-900"
        >
          {hideAnswer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideAnswer ? 'Reveal' : 'Hide'}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <Button 
          onClick={startPlayback}
          disabled={isPlaying}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Play Preview
        </Button>
        
        <Button 
          onClick={stopPlayback}
          disabled={!isPlaying}
          variant="outline"
          className="border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-900"
        >
          <Pause className="w-4 h-4 mr-2" />
          Stop
        </Button>

        {isPlaying && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {timeLeft}s
            </span>
            <div className="w-32 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Game status */}
      <div className="text-center mb-4">
        {!isPlaying && timeLeft === 30 && (
          <p className="text-sm text-purple-600 dark:text-purple-400">
            🎵 Ready to play! Click "Play Preview" to start the 30-second challenge.
          </p>
        )}
        {isPlaying && (
          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
            🎧 Listen carefully... Can you guess this song?
          </p>
        )}
        {!isPlaying && timeLeft === 0 && (
          <p className="text-sm text-purple-600 dark:text-purple-400">
            ⏰ Time's up! Click "Reveal" to see the answer or try again.
          </p>
        )}
      </div>

      {/* Answer reveal */}
      {!hideAnswer && trackData && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3">
            {trackData.image && (
              <img 
                src={trackData.image} 
                alt="Album cover" 
                className="w-16 h-16 rounded-lg shadow-md" 
              />
            )}
            <div>
              <p className="font-bold text-green-600 dark:text-green-400">
                🎉 {trackData.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                by {trackData.artist}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Source: Deezer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}