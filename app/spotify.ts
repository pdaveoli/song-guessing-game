"use client";
import { createClient } from "@/lib/supabase/client";
import type { 
  SpotifyUserTracksResponse, 
  SpotifyTrack, 
  GameTrack 
} from "./types";
const spotifyPreviewFinder = require('spotify-preview-finder');

export const getAccessToken = async (): Promise<string | null> => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Session error:', error);
        throw new Error(`Session error: ${error.message}`);
    }
    
    if (!session) {
        throw new Error("User is not authenticated");
    }

    if (!session.provider_token) {
        console.error('No provider token found in session:', session);
        throw new Error("No Spotify access token found. Please re-authenticate.");
    }

    return session.provider_token;
}

export const getUserSavedTracks = async (accessToken: string): Promise<SpotifyTrack[]> => {
  console.log('Fetching saved tracks with token:', accessToken?.substring(0, 10) + '...');
  
  try {
    const response = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify API error:', errorText);
      throw new Error(`Failed to fetch saved tracks: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: SpotifyUserTracksResponse = await response.json();
    console.log('Fetched tracks:', data.items?.length || 0);
    return data.items.map(item => item.track);
    
  } catch (error) {
    console.error('getUserSavedTracks error:', error);
    throw error;
  }
}

export const getTrackPreviewUrl = async (trackName: string, trackArtist: string): Promise<string | null> => {
    const result = await spotifyPreviewFinder(trackName, trackArtist, 1);
    if (result && result.length > 0) {
        console.log(`Found preview URL for "${trackName}" by ${trackArtist}:`, result[0].preview_url);
        return result[0].preview_url;
    } else {
        console.warn(`No preview URL found for "${trackName}" by ${trackArtist}`);
        return null;
    }
}

// Helper function to convert Spotify tracks to game format
export const convertToGameTracks = (spotifyTracks: SpotifyTrack[]): GameTrack[] => {
  return spotifyTracks.map(track => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0]?.name || 'Unknown Artist',
    album: track.album.name,
    albumImageUrl: track.album.images[0]?.url || '',
    previewUrl: track.preview_url,
    duration: track.duration_ms,
    popularity: track.popularity
  }));
}

export const getRandomSavedTrack = async (accessToken: string): Promise<SpotifyTrack> => {
  console.log('Fetching random saved track...');
  
  try {
    // First, get total count of saved tracks
    const countResponse = await fetch("https://api.spotify.com/v1/me/tracks?limit=1", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!countResponse.ok) {
      throw new Error(`Failed to get track count: ${countResponse.status}`);
    }

    const countData: SpotifyUserTracksResponse = await countResponse.json();
    const totalTracks = countData.total;
    
    if (totalTracks === 0) {
      throw new Error("No saved tracks found");
    }

    console.log(`Found ${totalTracks} total saved tracks`);

    // Generate random offset
    const randomOffset = Math.floor(Math.random() * totalTracks);
    
    // Fetch one random track
    const randomResponse = await fetch(
      `https://api.spotify.com/v1/me/tracks?limit=1&offset=${randomOffset}`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!randomResponse.ok) {
      throw new Error(`Failed to fetch random track: ${randomResponse.status}`);
    }

    const randomData: SpotifyUserTracksResponse = await randomResponse.json();
    
    if (!randomData.items || randomData.items.length === 0) {
      throw new Error("No track found at random offset");
    }

    console.log('Fetched random track:', randomData.items[0].track.name);
    return randomData.items[0].track;
    
  } catch (error) {
    console.error('getRandomSavedTrack error:', error);
    throw error;
  }
}