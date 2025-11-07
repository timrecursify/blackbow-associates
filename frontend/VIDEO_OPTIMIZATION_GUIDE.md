# BlackBow Video Optimization Guide

## Current Status
- **Original Video Size:** 110 MB
- **Current Loading:** Lazy load (preload="none"), desktop-only, network-aware
- **Target:** 20-30 MB (70-80% reduction)

## Performance Optimizations Implemented

### ✅ Code-Level Optimizations (Already Done)
1. **Lazy Loading:** `preload="none"` - video only loads when needed
2. **Mobile Disabled:** Video hidden on mobile devices (`hidden sm:block`)
3. **Network-Aware:** Automatically skips video on slow connections (2G)
4. **CSS Fallback:** Gradient background shows while video loads
5. **White Overlay:** Improved text readability across all pages
6. **Accessibility:** Respects `prefers-reduced-motion` setting

### 🎥 Video Compression Required

The video needs to be compressed from 110 MB to ~25 MB for optimal web performance.

## Option 1: Automated Compression (Recommended)

### Using the Provided Script

```bash
cd /home/newadmin/projects/blackbow-associates/frontend
./optimize-video.sh
```

**Requirements:**
- ffmpeg must be installed
- Script handles: compression, poster extraction, backup

### Manual ffmpeg Installation

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

## Option 2: Manual Compression with ffmpeg

```bash
cd /home/newadmin/projects/blackbow-associates/frontend/public/videos

# Backup original
cp Demo_Reel_New.mp4 Demo_Reel_New_ORIGINAL.mp4

# Compress video (target: 20-30 MB)
ffmpeg -i Demo_Reel_New_ORIGINAL.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset medium \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
  -r 30 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  Demo_Reel_Optimized.mp4

# Extract poster image
ffmpeg -i Demo_Reel_Optimized.mp4 \
  -ss 00:00:01 \
  -vframes 1 \
  -vf "scale=1920:1080" \
  -q:v 2 \
  poster.jpg

# Replace original with optimized
mv Demo_Reel_Optimized.mp4 Demo_Reel_New.mp4

# Verify size
ls -lh Demo_Reel_New.mp4
```

### Compression Parameters Explained

- **`-crf 28`**: Constant Rate Factor (18-28 = visually lossless, 28 = good quality, smaller file)
- **`-preset medium`**: Balance between compression time and file size
- **`-vf scale`**: Limit resolution to max 1920x1080
- **`-r 30`**: 30 FPS (reduces from higher frame rates)
- **`-b:a 128k`**: Audio bitrate (good quality, smaller size)
- **`-movflags +faststart`**: Enable progressive loading (crucial for web!)

## Option 3: Online Tools (No Terminal Required)

### CloudConvert (Free)
1. Go to https://cloudconvert.com/mp4-converter
2. Upload `Demo_Reel_New.mp4`
3. Settings:
   - Format: MP4
   - Codec: H.264
   - Quality: Medium (70-75%)
   - Resolution: 1920x1080
   - Framerate: 30 fps
   - Audio: AAC, 128 kbps
4. Download optimized file
5. Replace original in `/public/videos/`

### HandBrake (Desktop App)
1. Download: https://handbrake.fr/
2. Open video file
3. Preset: "Fast 1080p30"
4. Adjust quality: RF 24-26
5. Save to `/public/videos/Demo_Reel_New.mp4`

## Option 4: CDN Video Optimization (Production Best Practice)

### Cloudflare Stream (Recommended for Production)
- Upload video to Cloudflare Stream
- Automatic optimization, adaptive bitrate
- Global CDN delivery
- Cost: $5/month for 1000 minutes

```typescript
// Update App.tsx
<video
  src="https://customer-[code].cloudflarestream.com/[video-id]/manifest/video.m3u8"
  // ... other props
>
```

### AWS S3 + CloudFront
- Store video in S3
- Serve via CloudFront CDN
- Enable compression at edge

## After Optimization Checklist

### 1. Update Code (if needed)
If using poster image:
```typescript
// App.tsx
<video poster="/videos/poster.jpg" ...>
```

### 2. Test Locally
```bash
npm run build
npm run preview
```

### 3. Deploy to Production
```bash
npm run build
pm2 reload blackbow-frontend
```

### 4. Verify Performance

**Check file size:**
```bash
ls -lh /home/newadmin/projects/blackbow-associates/frontend/public/videos/
```

**Test loading speed:**
- Open https://blackbowassociates.com
- Check Network tab in DevTools
- Video should start loading progressively
- Initial page load should be < 3 seconds

## Performance Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Video Size | 110 MB | 20-30 MB | ⏳ Pending |
| Initial Load | ~5s | < 2s | ⏳ Pending |
| Time to Interactive | ~7s | < 3s | ⏳ Pending |
| Lighthouse Score | ~70 | 90+ | ⏳ Pending |

## Additional Performance Tips

### 1. Enable Cloudflare Optimization
If using Cloudflare proxy:
- Enable "Polish" (image/video compression)
- Enable "Mirage" (lazy loading)
- Enable "Rocket Loader" (defer JS)

### 2. Multiple Video Formats
For better browser support:
```html
<video>
  <source src="/videos/demo.webm" type="video/webm">
  <source src="/videos/demo.mp4" type="video/mp4">
</video>
```

### 3. Conditional Loading by Device
```typescript
// Only load video on desktop with good connection
const shouldLoadVideo =
  window.innerWidth >= 1024 &&
  navigator.connection?.effectiveType !== '2g';
```

## Monitoring Performance

### Tools
- **Google Lighthouse**: Performance audit
- **WebPageTest**: Detailed metrics
- **GTmetrix**: Performance monitoring
- **Chrome DevTools**: Network analysis

### Key Metrics to Watch
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

## Support

For questions or issues:
1. Check this guide
2. Review `/frontend/optimize-video.sh` script
3. Test with online tools first
4. Verify network conditions in DevTools

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0
**Status:** Ready for video compression
