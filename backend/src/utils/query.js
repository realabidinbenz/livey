import { supabaseAdmin } from '../config/supabase.js';

/**
 * Seller Query Helper
 * Ensures seller_id filtering is ALWAYS applied for data isolation.
 * Primary defense against cross-tenant data leaks.
 *
 * RLS is a backup layer; this helper is the primary isolation mechanism
 * since all queries use the admin client (which bypasses RLS).
 */

/**
 * Create a Supabase query pre-filtered by seller_id
 * @param {string} table - Table name
 * @param {string} sellerId - Seller UUID (from req.user.id)
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder} Filtered query builder
 */
export const sellerQuery = (table, sellerId) => {
  if (!sellerId) {
    throw new Error('sellerId is required for data isolation');
  }
  return supabaseAdmin.from(table).select('*').eq('seller_id', sellerId);
};

/**
 * Create a Supabase query with custom select, pre-filtered by seller_id
 * @param {string} table - Table name
 * @param {string} sellerId - Seller UUID
 * @param {string} columns - Column selection string (e.g. '*, count')
 * @param {object} options - Supabase select options (e.g. { count: 'exact' })
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export const sellerSelect = (table, sellerId, columns = '*', options = {}) => {
  if (!sellerId) {
    throw new Error('sellerId is required for data isolation');
  }
  return supabaseAdmin.from(table).select(columns, options).eq('seller_id', sellerId);
};
