# Spec Requirements Document

> Spec: OpenAI API Key Settings
> Created: 2026-01-21

## Overview

Implement a user settings subapp where users can securely add and manage their personal OpenAI API key, which will be encrypted and stored in their Supabase user profile. When no key is configured, all AI-powered buttons across the application will be disabled with informative tooltips guiding users to add their key.

## User Stories

### Adding an API Key

As a user, I want to add my personal OpenAI API key in a settings page, so that I can use AI-powered features throughout the application.

The user navigates to the Settings subapp (accessible from the project sidebar under History). They see a form with a password-type input field for their OpenAI API key. After entering their key and clicking save, the key is encrypted and stored securely in their Supabase user profile. A success message confirms the key has been saved, and AI features become immediately available.

### Understanding Why AI is Disabled

As a user without a configured API key, I want to see clear feedback on disabled AI buttons, so that I understand why the feature is unavailable and how to enable it.

When viewing any subapp with AI features (Personas, User Stories, Journey Maps, or Project settings), the user sees AI buttons (marked with sparkle icons) in a disabled state. Hovering over these buttons shows a tooltip: "Add your OpenAI API key in Settings to use AI features". This provides a clear call-to-action without blocking the user's workflow.

### Managing an Existing Key

As a user with a configured API key, I want to update or remove my key, so that I can maintain control over my AI integration.

In the Settings page, users with an existing key see a masked display (e.g., "sk-...abc123") indicating a key is configured. They can choose to update the key by entering a new one, or remove it entirely. Removing the key disables all AI features until a new key is added.

## Spec Scope

1. **Settings Subapp** - New sidebar navigation item and page under History for managing user settings
2. **API Key Input Form** - Secure input field with save/update/remove functionality for OpenAI API key
3. **Encrypted Storage** - Server-side encryption of API keys before storing in Supabase user profiles
4. **AI Button Disabling** - Conditional disabling of all AI buttons when no key is configured
5. **Disabled State Tooltips** - Informative tooltips on disabled AI buttons explaining how to enable them

## Out of Scope

- API key validation (checking if key is valid with OpenAI)
- Multiple API key support (only one key per user)
- Project-level API key overrides
- Usage tracking or rate limiting
- Support for other AI providers (Anthropic, etc.)

## Expected Deliverable

1. Users can navigate to Settings from the project sidebar and add/update/remove their OpenAI API key
2. AI buttons in Personas, User Stories, Journey Maps, and Project Description (both create and edit pages) are disabled with tooltips when no key is configured
3. AI features work correctly when a valid key is stored
