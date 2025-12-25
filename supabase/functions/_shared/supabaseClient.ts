/**
 * Supabase Client Setup for Edge Functions
 * 
 * This module provides a configured Supabase client instance
 * that Edge Functions can import to interact with PostgreSQL.
 * 
 * Features:
 * - Connection pooling for better performance
 * - Error handling and logging
 * - Environment variable configuration (no hardcoded secrets)
 * - Type-safe database access
 * 
 * Usage:
 * ```typescript
 * import { supabaseClient } from '../_shared/supabaseClient.ts';
 * 
 * const { data, error } = await supabaseClient
 *   .from('table_name')
 *   .select('*');
 * ```
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

/**
 * Validates that required environment variables are set
 * @throws Error if required variables are missing
 */
function validateEnvironment(): void {
    if (!SUPABASE_URL) {
        throw new Error('SUPABASE_URL environment variable is not set');
    }

    if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
        throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set');
    }
}

/**
 * Creates a Supabase client with connection pooling and error handling
 * 
 * @param useServiceRole - If true, uses service role key (bypasses RLS). Default: false
 * @returns Configured Supabase client instance
 */
export function createSupabaseClient(useServiceRole: boolean = false): SupabaseClient {
    try {
        validateEnvironment();

        const apiKey = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY! : SUPABASE_ANON_KEY!;

        const client = createClient(SUPABASE_URL!, apiKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: false, // Edge Functions are stateless
                detectSessionInUrl: false,
            },
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-application-name': 'edge-function',
                },
            },
        });

        return client;
    } catch (error) {
        console.error('Error creating Supabase client:', error);
        throw error;
    }
}

/**
 * Default Supabase client instance with anonymous key (RLS enforced)
 * Use this for most Edge Functions that respect Row Level Security
 */
export const supabaseClient = createSupabaseClient(false);

/**
 * Admin Supabase client instance with service role key (bypasses RLS)
 * Use this with caution, only when you need admin-level access
 */
export const supabaseAdmin = createSupabaseClient(true);

/**
 * Helper function to verify user authentication from request
 * 
 * @param req - The incoming request
 * @returns User object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            return null;
        }

        const token = authHeader.replace('Bearer ', '');
        const client = createSupabaseClient(false);

        const { data: { user }, error } = await client.auth.getUser(token);

        if (error || !user) {
            console.error('Authentication error:', error?.message);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error verifying authentication:', error);
        return null;
    }
}

/**
 * Helper function to create a CORS-enabled response
 * 
 * @param body - Response body (will be JSON stringified)
 * @param status - HTTP status code
 * @returns Response with CORS headers
 */
export function createCorsResponse(body: any, status: number = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
        },
    });
}

/**
 * Helper function to handle CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
        },
    });
}
