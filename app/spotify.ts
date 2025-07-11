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

export const getRandomSavedTracks = async (accessToken: string, count: number): Promise<SpotifyTrack[]> => {
  // Run a a loop to fetch multiple random tracks
  const tracks: SpotifyTrack[] = [];
  for (let i = 0; i < count; i++) {
    try {
      let track = await getRandomSavedTrack(accessToken);
      // make sure it is not already in the list
      if (tracks.some(t => t.id === track.id)) {
        track = await getRandomSavedTrack(accessToken);
        // If still a duplicate, skip this iteration
        if (tracks.some(t => t.id === track.id)) {
          console.warn(`Duplicate track found, skipping: ${track.name} by ${track.artists[0]?.name}`);
          continue;
        }
      }
      tracks.push(track);
    } catch (error) {
      console.error(`Error fetching random track ${i + 1}:`, error);
    }
  }

  return tracks;
}

export const getUsersTopTracks = async (accessToken: string, limit: number = 10): Promise<SpotifyTrack[]> => {
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify top tracks error:', errorText);
      throw new Error(`Failed to fetch top tracks: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error("No top tracks found");
    }

    // Top tracks API returns tracks directly, not wrapped in track objects
    return data.items;
    
  } catch (error) {
    console.error('getUsersTopTracks error:', error);
    throw error;
  }
}

export const getUsersTopOrRecentTracks = async (accessToken: string, limit: number = 10): Promise<SpotifyTrack[]> => {
  try {
    // Try to get top tracks first
    console.log('Attempting to fetch top tracks...');
    const topTracks = await getUsersTopTracks(accessToken, limit);
    if (topTracks.length > 0) {
      console.log(`Successfully fetched ${topTracks.length} top tracks`);
      return topTracks;
    }
  } catch (error) {
    console.warn('Top tracks failed, trying recently played:', error);
    
    try {
      // Fallback to recently played tracks
      const recentTracks = await getUsersRecentlyPlayed(accessToken, limit);
      if (recentTracks.length > 0) {
        console.log(`Successfully fetched ${recentTracks.length} recent tracks`);
        return recentTracks;
      }
    } catch (recentError) {
      console.warn('Recently played failed, using saved tracks:', recentError);
      
      // Final fallback to saved tracks
      const savedTracks = await getRandomSavedTracks(accessToken, limit);
      console.log(`Using ${savedTracks.length} saved tracks as fallback`);
      return savedTracks;
    }
  }
  
  throw new Error('Unable to fetch any tracks');
};

// Add recently played tracks function
export const getUsersRecentlyPlayed = async (accessToken: string, limit: number = 10): Promise<SpotifyTrack[]> => {
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recently played: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error("No recently played tracks found");
    }

    // Recently played API returns track objects wrapped in items
    return data.items.map((item: any) => item.track);
    
  } catch (error) {
    console.error('getUsersRecentlyPlayed error:', error);
    throw error;
  }
};


export const getAllArtistSongs = async (artistName: string, accessToken: string): Promise<SpotifyTrack[] | null> => {
  try {
    // First, get the artist ID
    const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!artistResponse.ok) {
      throw new Error(`Failed to fetch artist: ${artistResponse.status}`);
    }

    const artistData = await artistResponse.json();

    if (!artistData.artists || artistData.artists.items.length === 0) {
      console.warn(`No artist found for "${artistName}"`);
      return null;
    }

    const artistId = artistData.artists.items[0].id;
    console.log(`Found artist ID: ${artistId} for "${artistName}"`);

    // Get albums
    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=GB&limit=50`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!albumsResponse.ok) {
      throw new Error(`Failed to fetch albums: ${albumsResponse.status}`);
    }

    const albumsData = await albumsResponse.json();

    if (!albumsData.items || albumsData.items.length === 0) {
      console.warn(`No albums found for artist "${artistName}"`);
      return null;
    }

    console.log(`Found ${albumsData.items.length} albums for "${artistName}"`);

    // Get all tracks from all albums
    const allTracks: SpotifyTrack[] = [];
    const processedTrackNames = new Set<string>(); // Use Set for faster lookups

    for (const album of albumsData.items) {
      try {
        const tracksResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=GB&limit=50`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!tracksResponse.ok) {
          console.warn(`Failed to fetch tracks for album "${album.name}": ${tracksResponse.status}`);
          continue;
        }

        const tracksData = await tracksResponse.json();

        if (!tracksData.items || tracksData.items.length === 0) {
          console.warn(`No tracks found for album "${album.name}"`);
          continue;
        }

        for (const track of tracksData.items) {
          // Create a unique identifier for the track
          const trackKey = `${track.name.toLowerCase()}-${track.artists[0]?.name.toLowerCase()}`;
          
          // Check if we've already processed this track
          if (!processedTrackNames.has(trackKey)) {
            // Convert album track to full track format
            const fullTrack: SpotifyTrack = {
              id: track.id,
              name: track.name,
              artists: track.artists,
              album: {
                id: album.id,
                name: album.name,
                images: album.images || [],
                release_date: album.release_date,
                total_tracks: album.total_tracks,
                album_type: "album",
                artists: [],
                external_urls: album.external_urls || { spotify: "" },
                href: "",
                is_playable: false,
                release_date_precision: "month",
                type: "album",
                uri: ""
              },
              duration_ms: track.duration_ms,
              explicit: track.explicit,
              external_urls: track.external_urls,
              href: track.href,
              is_local: track.is_local || false,
              popularity: track.popularity || 0,
              preview_url: track.preview_url,
              track_number: track.track_number,
              type: track.type,
              uri: track.uri,
              disc_number: track.disc_number || 1,
              external_ids: track.external_ids || {},
              is_playable: track.is_playable !== undefined ? track.is_playable : true
            };

            allTracks.push(fullTrack);
            processedTrackNames.add(trackKey);
            console.log(`Added track: ${track.name} by ${track.artists[0]?.name}`);
          } else {
            console.log(`Skipped duplicate: ${track.name} by ${track.artists[0]?.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing album "${album.name}":`, error);
        continue;
      }
    }

    console.log(`Found ${allTracks.length} unique tracks for artist "${artistName}"`);
    return allTracks;
    
  } catch (error) {
    console.error('getAllArtistSongs error:', error);
    return null;
  }
}

export const getAllArtistSongsById = async (artistId: string, accessToken: string): Promise<SpotifyTrack[] | null> => {
  try {
    console.log(`Fetching songs for artist ID: ${artistId}`);

    // Get albums directly using artist ID
    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=GB&limit=50`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!albumsResponse.ok) {
      throw new Error(`Failed to fetch albums: ${albumsResponse.status}`);
    }

    const albumsData = await albumsResponse.json();

    if (!albumsData.items || albumsData.items.length === 0) {
      console.warn(`No albums found for artist ID: ${artistId}`);
      return null;
    }

    console.log(`Found ${albumsData.items.length} albums for artist ID: ${artistId}`);

    // Get all tracks from all albums
    const allTracks: SpotifyTrack[] = [];
    const processedTrackNames = new Set<string>();

    for (const album of albumsData.items) {
      try {
        const tracksResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=GB&limit=50`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!tracksResponse.ok) {
          console.warn(`Failed to fetch tracks for album "${album.name}": ${tracksResponse.status}`);
          continue;
        }

        const tracksData = await tracksResponse.json();

        if (!tracksData.items || tracksData.items.length === 0) {
          console.warn(`No tracks found for album "${album.name}"`);
          continue;
        }

        for (const track of tracksData.items) {
          // Verify this track is actually by the target artist
          const isCorrectArtist = track.artists.some((artist: any) => artist.id === artistId);
          
          if (!isCorrectArtist) {
            console.log(`Skipping track "${track.name}" - not by target artist (${artistId})`);
            continue;
          }

          // Create a unique identifier for the track
          const trackKey = `${track.name.toLowerCase()}-${track.artists[0]?.name.toLowerCase()}`;
          
          // Check if we've already processed this track
          if (!processedTrackNames.has(trackKey)) {
            // Convert album track to full track format
            const fullTrack: SpotifyTrack = {
              id: track.id,
              name: track.name,
              artists: track.artists,
              album: {
                id: album.id,
                name: album.name,
                images: album.images || [],
                release_date: album.release_date,
                total_tracks: album.total_tracks,
                album_type: "album",
                artists: [],
                external_urls: album.external_urls || { spotify: "" },
                href: "",
                is_playable: false,
                release_date_precision: "month",
                type: "album",
                uri: ""
              },
              duration_ms: track.duration_ms,
              explicit: track.explicit,
              external_urls: track.external_urls,
              href: track.href,
              is_local: track.is_local || false,
              popularity: track.popularity || 0,
              preview_url: track.preview_url,
              track_number: track.track_number,
              type: track.type,
              uri: track.uri,
              disc_number: track.disc_number || 1,
              external_ids: track.external_ids || {},
              is_playable: track.is_playable !== undefined ? track.is_playable : true
            };

            allTracks.push(fullTrack);
            processedTrackNames.add(trackKey);
            console.log(`Added track: ${track.name} by ${track.artists[0]?.name}`);
          } else {
            console.log(`Skipped duplicate: ${track.name} by ${track.artists[0]?.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing album "${album.name}":`, error);
        continue;
      }
    }

    console.log(`Found ${allTracks.length} unique tracks for artist ID: ${artistId}`);
    return allTracks;
    
  } catch (error) {
    console.error('getAllArtistSongsById error:', error);
    return null;
  }
}

export const getRandomSongByArtist = async (artistSongs: SpotifyTrack[], alreadyPlayedSongs: SpotifyTrack[]): Promise<SpotifyTrack | null> => {
  if (!artistSongs || artistSongs.length === 0) {
    console.warn('No artist songs provided');
    return null;
  }

  // Filter out already played songs using track ID
  const availableSongs = artistSongs.filter(song => 
    !alreadyPlayedSongs.some(played => played.id === song.id)
  );
  
  console.log(`Available songs: ${availableSongs.length} out of ${artistSongs.length}`);
  
  if (availableSongs.length === 0) {
    console.warn('No available songs left for this artist');
    return null;
  }

  // Filter out remixes, live versions, etc.
  const filteredSongs = availableSongs.filter(song => {
    const lowerName = song.name.toLowerCase();
    const isFiltered = !lowerName.includes('remix') && 
                      !lowerName.includes('sped up') && 
                      !lowerName.includes('slowed down') &&
                      !lowerName.includes('acoustic') &&
                      !lowerName.includes('live') &&
                      !lowerName.includes('demo') &&
                      !lowerName.includes('instrumental') &&
                      !lowerName.includes('karaoke');
                      !lowerName.includes('(slowed');
    
    if (!isFiltered) {
      console.log(`Filtered out: ${song.name} (contains unwanted keywords)`);
    }
    
    return isFiltered;
  });

  console.log(`Filtered songs: ${filteredSongs.length} out of ${availableSongs.length}`);

  if (filteredSongs.length === 0) {
    console.warn('No suitable songs left after filtering, using available songs');
    // If no songs pass the filter, use the available songs anyway
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const randomSong = availableSongs[randomIndex];
    console.log(`Selected random song (unfiltered): ${randomSong.name} by ${randomSong.artists[0]?.name}`);
    return randomSong;
  }

  // Pick a random song from filtered results
  const randomIndex = Math.floor(Math.random() * filteredSongs.length);
  const randomSong = filteredSongs[randomIndex];

  console.log(`Selected random song: ${randomSong.name} by ${randomSong.artists[0]?.name}`);
  return randomSong;
}