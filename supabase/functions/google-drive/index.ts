import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange error:', error);
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

// Refresh access token
async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

// List files from Google Drive
async function listDriveFiles(accessToken: string, pageToken?: string): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: "mimeType='text/csv' or mimeType='application/json' or mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
    pageSize: '50',
    orderBy: 'modifiedTime desc',
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Drive API error:', error);
    throw new Error('Failed to list Drive files');
  }

  return response.json();
}

// Download file content from Google Drive
async function downloadDriveFile(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let url: string;
  let exportMimeType: string | null = null;

  // Google Sheets need to be exported as CSV
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    exportMimeType = 'text/csv';
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Download error:', error);
    throw new Error('Failed to download file');
  }

  return response.text();
}

// Stream and process large file in chunks
async function streamAndProcessFile(
  accessToken: string,
  fileId: string,
  fileName: string,
  mimeType: string
): Promise<{ rowCount: number; content: string }> {
  console.log(`Streaming file: ${fileName} (${mimeType})`);
  
  const content = await downloadDriveFile(accessToken, fileId, mimeType);
  console.log(`Downloaded ${content.length} bytes`);
  
  return { rowCount: 0, content };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...params } = await req.json();
    console.log(`Google Drive action: ${action}`);

    switch (action) {
      case 'get-auth-url': {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        if (!clientId) {
          throw new Error('Google Client ID not configured');
        }

        const { redirectUri } = params;
        const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.readonly');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${scope}` +
          `&access_type=offline` +
          `&prompt=consent`;

        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange-code': {
        const { code, redirectUri } = params;
        const tokens = await exchangeCodeForTokens(code, redirectUri);
        
        return new Response(
          JSON.stringify({ 
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh-token': {
        const { refreshToken } = params;
        const tokens = await refreshAccessToken(refreshToken);
        
        return new Response(
          JSON.stringify({ 
            accessToken: tokens.access_token,
            expiresIn: tokens.expires_in,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-files': {
        const { accessToken, pageToken } = params;
        const result = await listDriveFiles(accessToken, pageToken);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import-file': {
        const { accessToken, fileId, fileName, mimeType, datasetName } = params;
        
        // Create dataset record first
        const fileType = mimeType === 'application/vnd.google-apps.spreadsheet' ? 'csv' : 
                         mimeType === 'application/json' ? 'json' : 'csv';
        
        const { data: dataset, error: insertError } = await supabase
          .from('datasets')
          .insert({
            name: datasetName || fileName.replace(/\.(csv|json)$/i, ''),
            file_name: `gdrive_${fileId}_${Date.now()}`,
            file_size: 0,
            file_type: fileType,
            status: 'processing',
            description: `Imported from Google Drive: ${fileName}`,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        console.log(`Created dataset record: ${dataset.id}`);

        try {
          // Download and stream file content
          const { content } = await streamAndProcessFile(
            accessToken, 
            fileId, 
            fileName, 
            mimeType
          );

          // Store content in storage bucket
          const storedFileName = `gdrive_${dataset.id}.${fileType}`;
          const { error: uploadError } = await supabase.storage
            .from('datasets')
            .upload(storedFileName, content, {
              contentType: fileType === 'csv' ? 'text/csv' : 'application/json',
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to store file: ${uploadError.message}`);
          }

          // Update dataset with file info
          await supabase
            .from('datasets')
            .update({ 
              file_name: storedFileName,
              file_size: content.length,
              status: 'pending',
            })
            .eq('id', dataset.id);

          // Trigger processing
          const { error: processError } = await supabase.functions.invoke('process-dataset', {
            body: { datasetId: dataset.id },
          });

          if (processError) {
            console.error('Processing trigger error:', processError);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              datasetId: dataset.id,
              message: 'File imported and processing started',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          // Mark dataset as failed
          await supabase
            .from('datasets')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Import failed',
            })
            .eq('id', dataset.id);

          throw error;
        }
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Google Drive error:', errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
