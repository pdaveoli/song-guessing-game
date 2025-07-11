"use client";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Eye, EyeOff, Volume2 } from 'lucide-react';
import { Input } from './ui/input';

interface SongGuesserProps {
  trackName: string;
  artistName: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  onGuessRight?: () => void;
  onGuessWrong?: () => void;
  onPlayAgain?: () => void;
}

interface TrackData {
  type: string;
  preview: string;
  title: string;
  artist: string;
  image: string;
}

export default function SongGuesser({ trackName, artistName, difficulty = 'easy', onGuessRight, onGuessWrong, onPlayAgain }: SongGuesserProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(difficulty === 'easy' ? 20 : difficulty === 'medium' ? 10 : 5);
  const [guessesRemaining, setGuessesRemaining] = useState(difficulty === 'easy' ? 3 : difficulty === 'medium' ? 2 : 1);
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
    setTimeLeft(difficulty === 'easy' ? 20 : difficulty === 'medium' ? 10 : 5);

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);

    console.log('Starting playback for:', trackData.title, 'by', trackData.artist);
    console.log("Difficulty level:", difficulty);


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
    setTimeLeft(difficulty === 'easy' ? 20 : difficulty === 'medium' ? 10 : 5);

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

  // Advanced matching function
  const checkSongMatch = (guess: string, actualTitle: string): boolean => {
    // Step 1: Clean both strings
    const cleanGuess = cleanSongTitle(guess);
    const cleanActual = cleanSongTitle(actualTitle);

    // Step 2: Exact match after cleaning
    if (cleanGuess === cleanActual) {
      return true;
    }



    // Step 4: Word-based matching (majority of words match)
    const guessWords = cleanGuess.split(/\s+/).filter(word => word.length > 0);
    const actualWords = cleanActual.split(/\s+/).filter(word => word.length > 0);

    if (guessWords.length === 0 || actualWords.length === 0) {
      return false;
    }

    // Count matching words
    const matchingWords = guessWords.filter(guessWord =>
      actualWords.some(actualWord =>
        actualWord.includes(guessWord) || guessWord.includes(actualWord)
      )
    );

    // Consider it a match if 90% or more words match
    const matchPercentage = matchingWords.length / Math.max(guessWords.length, actualWords.length);
    return matchPercentage >= 0.9;
  };

  // Comprehensive title cleaning function
  const cleanSongTitle = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // remove anything in brackets
      .replace(/\[.*?\]|\(.*?\)|\{.*?\}/g, '')
      .replace(/[^\w\s]/gi, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  const submitGuess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const guess = formData.get('guess')?.toString().trim().toLowerCase();

    if (!guess) {
      setError('Please enter a guess');
      return;
    }

    // Check if the guess matches the track data
    if (trackData) {
      if (checkSongMatch(guess, trackData.title)) {
        setError(null);
        setHideAnswer(false);
        setIsPlaying(false);
        if (onGuessRight) onGuessRight();
      } else {
        setError(`Wrong guess! The correct answer was "${trackData.title}" by ${trackData.artist}`);
        if (guessesRemaining > 0) {
          setGuessesRemaining(prev => prev - 1);
          if (guessesRemaining === 1) {
            setError('Last guess remaining! Make it count!');
          } else {
            setError(`Incorrect! You have ${guessesRemaining - 1} guesses left.`);
          }
          return;
        }
        setHideAnswer(false);
        setIsPlaying(false);
        if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
        if (onGuessWrong) onGuessWrong();
      }
    }

    // Either got right or wrong, reset the state
    setIsPlaying(false);
    setTimeLeft(difficulty === 'easy' ? 20 : difficulty === 'medium' ? 10 : 5);
    setGuessesRemaining(difficulty === 'easy' ? 3 : difficulty === 'medium' ? 2 : 1);

    // Stop the audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  const giveUp = () => {
    if (!trackData) return;
    // set guesses remaining to 0
    setGuessesRemaining(0);
    setError(`Wrong guess! The correct answer was "${trackData.title}" by ${trackData.artist}`);
    setHideAnswer(false);
    setIsPlaying(false);
    // stop playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (onGuessWrong) onGuessWrong();

  }


  if (loading) {
    return (
      <div className=" w-full items-center justify-center border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 h-full ">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-sm ml-4">Loading....</p>
      </div>
    );
  }

  if (error && !trackData?.preview) {
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

  if (!trackData?.preview) {
    // something is wrong
    setError('No audio preview found for this track. Please try again later.');
    return (
      <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-300">
          No audio preview found for this track. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 h-full ">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={trackData.preview}
        preload="metadata"
        onEnded={stopPlayback}
      />

      {hideAnswer ? (
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
                  style={{ width: `${(timeLeft / (difficulty === "easy" ? 20 : difficulty === "medium" ? 10 : 5)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h1>The answer was:</h1>
        </div>
      )}
      <div className="text-center mb-4">

        {(!hideAnswer && trackData) ? (
          <>
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
            <Button className='mt-4 bg-purple-600 hover:bg-purple-700 text-white' onClick={onPlayAgain}>
              <Play className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </>
        ) : (
          <div className='p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700'>
            <form onSubmit={submitGuess} className="flex flex-col items-center">
              <Input
                placeholder="Type your guess here..."
                className="w-full mb-2"
                name='guess'
                required />
                <div className="flex items-center justify-center gap-2 mb-2">
              <Button type='submit' className="bg-purple-600 hover:bg-purple-700 text-white">
                Submit Guess
              </Button>
              <Button type='button' variant="outline" className="border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-900" onClick={() => giveUp()}>
                Give up
              </Button>
              </div>
            </form>
          </div>
        )}
        {error && (
          <div className="p-4 mt-6 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-center w-full flex flex-col gap-3 items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Answer Wrong</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {error || 'No audio preview found for this track'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}