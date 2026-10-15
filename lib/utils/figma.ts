// Import the type we defined in Phase 2
import { MockupType } from '../types/database';

/**
 * (Action Item 4) Checks if a given string is a valid Figma URL.
 * @param url The URL string to validate.
 * @returns True if the URL is a Figma URL, false otherwise.
 */
export const isFigmaUrl = (url: string): boolean => {
  try {
    // Use the URL constructor to safely parse the URL
    const parsedUrl = new URL(url);
    // Check if the hostname is exactly 'www.figma.com' or 'figma.com'
    return parsedUrl.hostname === 'www.figma.com' || parsedUrl.hostname === 'figma.com';
  } catch (error) {
    // If the URL is malformed (e.g., "not a url"), the constructor will throw an error.
    return false;
  }
};

/**
 * (Action Item 3) Detects the type of Figma file based on its URL path.
 * @param url The Figma URL string.
 * @returns The MockupType ('prototype', 'figjam', or 'design').
 */
export const detectMockupType = (url: string): MockupType => {
  if (url.includes('/proto/')) {
    return 'prototype';
  }
  if (url.includes('/board/')) {
    return 'figjam';
  }
  // Default to 'design' if no other type is detected
  return 'design';
};

/**
 * (Action Item 2) Converts a standard Figma share URL into an embeddable URL for iframes.
 * @param url The original Figma share URL.
 * @returns The embeddable URL string, or null if the input URL is invalid.
 */
export const convertFigmaUrlToEmbed = (url: string): string | null => {
  // 1. Validate it's a Figma URL
  if (!isFigmaUrl(url)) {
    return null;
  }

  // 2. URL-encode the original link (this is the key step)
  // e.g., 'https://...' becomes 'https%3A%2F%2F...'
  const encodedUrl = encodeURIComponent(url);

  // 3. Return the embed format using the encoded URL
  return `https://www.figma.com/embed?embed_host=share&url=${encodedUrl}`;
};