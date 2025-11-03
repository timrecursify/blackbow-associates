# Public Assets Directory

This directory contains static assets served by the frontend application.

## Directory Structure

- **`logos/`** - Company logos and branding images
- **`avatars/`** - User avatar images (if needed for custom uploads)
- **`favicon/`** - Favicon and app icons

## Usage

Files in this directory are automatically served at the root path. For example:
- `public/favicon/favicon.ico` → `/favicon/favicon.ico`
- `public/logos/logo.png` → `/logos/logo.png`

## Note

Vite automatically serves files from this directory during development and includes them in the production build.
