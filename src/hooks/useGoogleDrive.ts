import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

interface DriveTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const STORAGE_KEY = 'google_drive_tokens';

export function useGoogleDrive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Load tokens from storage
  const loadTokens = useCallback((): DriveTokens | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const tokens = JSON.parse(stored) as DriveTokens;
        // Check if token is still valid (with 5 min buffer)
        if (tokens.expiresAt > Date.now() + 300000) {
          return tokens;
        }
      }
    } catch {
      console.error('Failed to load Drive tokens');
    }
    return null;
  }, []);

  // Save tokens to storage
  const saveTokens = useCallback((tokens: DriveTokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    setIsConnected(true);
  }, []);

  // Clear tokens
  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsConnected(false);
    setFiles([]);
    setNextPageToken(null);
  }, []);

  // Check connection on mount
  useEffect(() => {
    const tokens = loadTokens();
    setIsConnected(!!tokens);
  }, [loadTokens]);

  // Get the redirect URI for OAuth
  const getRedirectUri = useCallback(() => {
    return `${window.location.origin}/`;
  }, []);

  // Start OAuth flow
  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { 
          action: 'get-auth-url',
          redirectUri: getRedirectUri(),
        },
      });

      if (error) throw error;
      
      // Store state for OAuth callback
      sessionStorage.setItem('oauth_state', 'google_drive');
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      toast.error('Failed to connect to Google Drive');
      setIsConnecting(false);
    }
  }, [getRedirectUri]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string) => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'exchange-code',
          code,
          redirectUri: getRedirectUri(),
        },
      });

      if (error) throw error;

      const tokens: DriveTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      saveTokens(tokens);
      toast.success('Connected to Google Drive');
      
      // Clear OAuth state
      sessionStorage.removeItem('oauth_state');
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Failed to complete Google Drive connection');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [getRedirectUri, saveTokens]);

  // Refresh access token
  const refreshToken = useCallback(async () => {
    const tokens = loadTokens();
    if (!tokens?.refreshToken) {
      disconnect();
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'refresh-token',
          refreshToken: tokens.refreshToken,
        },
      });

      if (error) throw error;

      const newTokens: DriveTokens = {
        accessToken: data.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      saveTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      disconnect();
      return null;
    }
  }, [loadTokens, saveTokens, disconnect]);

  // Get valid access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = loadTokens();
    if (!tokens) return null;

    // If token expires in less than 5 minutes, refresh it
    if (tokens.expiresAt < Date.now() + 300000) {
      return refreshToken();
    }

    return tokens.accessToken;
  }, [loadTokens, refreshToken]);

  // List files from Drive
  const listFiles = useCallback(async (loadMore = false) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error('Please connect to Google Drive first');
      return;
    }

    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'list-files',
          accessToken,
          pageToken: loadMore ? nextPageToken : undefined,
        },
      });

      if (error) throw error;

      if (loadMore) {
        setFiles(prev => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (error) {
      console.error('Failed to list files:', error);
      toast.error('Failed to load Drive files');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [getAccessToken, nextPageToken]);

  // Import a file from Drive
  const importFile = useCallback(async (
    file: DriveFile,
    datasetName?: string
  ): Promise<string | null> => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error('Please connect to Google Drive first');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: {
          action: 'import-file',
          accessToken,
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          datasetName,
        },
      });

      if (error) throw error;

      toast.success('File imported from Google Drive');
      return data.datasetId;
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import file from Drive');
      return null;
    }
  }, [getAccessToken]);

  return {
    isConnected,
    isConnecting,
    files,
    isLoadingFiles,
    hasMoreFiles: !!nextPageToken,
    connect,
    disconnect,
    handleCallback,
    listFiles,
    importFile,
  };
}
