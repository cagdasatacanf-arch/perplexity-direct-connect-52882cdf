/**
 * Data Type Interfaces for Market and Raw Data Ingestion
 * 
 * Includes interfaces for standard financial data structures (OHLC),
 * metal prices, and generic wrappers for flexible data handling.
 */

/**
 * Standard Open-High-Low-Close (OHLC) market price object
 * Represents a single period of price action for a financial instrument.
 */
export interface OHLCData {
    /** The opening price for the period */
    open: number;

    /** The highest price reached during the period */
    high: number;

    /** The lowest price reached during the period */
    low: number;

    /** The closing price for the period */
    close: number;

    /** The volume traded during the period (optional) */
    volume?: number;

    /** The timestamp for this data point (ISO 8601 format) */
    timestamp: string;

    /** The currency code (e.g., 'USD', 'EUR') */
    currency?: string;
}

/**
 * Metal price object
 * Specific structure for precious metals which might interpret data differently than stocks.
 */
export interface MetalPriceData {
    /** The metal symbol (e.g., 'XAU' for Gold, 'XAG' for Silver) */
    symbol: string;

    /** The spot price per unit */
    price: number;

    /** The unit of measurement (e.g., 'oz', 'kg') */
    unit: string;

    /** The bid price (optional) */
    bid?: number;

    /** The ask price (optional) */
    ask?: number;

    /** The timestamp for this price quote (ISO 8601 format) */
    timestamp: string;

    /** Additional metadata specific to the metal market (optional) */
    metadata?: Record<string, unknown>;
}

/**
 * Generic JSON Object Wrapper
 * Used for handling unstructured or semi-structured data payloads.
 * Allows for any JSON-compatible structure.
 */
export interface GenericPayload {
    /** The type of data contained (for validation/routing purposes) */
    dataType?: string;

    /** The actual data payload, allowing any key-value pairs */
    data: Record<string, unknown> | Array<Record<string, unknown>>;

    /** Optional source identifier */
    source?: string;

    /** Optional creation timestamp */
    createdAt?: string;

    /** Allow any other properties */
    [key: string]: unknown;
}

/**
 * Interface for the response of an ingestion operation
 */
export interface IngestionResponse {
    /** Whether the ingestion was successful */
    imported: boolean;

    /** The ID of the created record in the database */
    record_id?: string;

    /** Any error message if failed */
    error?: string;
}
