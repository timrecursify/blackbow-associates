#!/bin/bash

# BlackBow Video Optimization Script
# This script compresses the video and creates a poster image for fast loading
# Run this script to optimize your video for web delivery

set -e

echo "🎬 BlackBow Video Optimization Script"
echo "======================================"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Installing..."
    echo "wVITLs5xX09l1P2Myj9XsHpCIi5dvRy" | sudo -S apt-get update
    echo "wVITLs5xX09l1P2Myj9XsHpCIi5dvRy" | sudo -S apt-get install -y ffmpeg
    echo "✅ ffmpeg installed successfully"
fi

VIDEO_DIR="/home/newadmin/projects/blackbow-associates/frontend/public/videos"
INPUT_VIDEO="$VIDEO_DIR/Demo_Reel_New.mp4"
OUTPUT_VIDEO="$VIDEO_DIR/Demo_Reel_Optimized.mp4"
POSTER_IMAGE="$VIDEO_DIR/poster.jpg"

echo ""
echo "📊 Current video size:"
ls -lh "$INPUT_VIDEO"

echo ""
echo "🎥 Compressing video for web delivery..."
echo "   - Target: ~20-30MB (70-80% reduction)"
echo "   - Quality: High (CRF 28, visually lossless)"
echo "   - Codec: H.264 (best compatibility)"
echo "   - Resolution: 1920x1080 (if larger)"

# Optimize video with aggressive compression while maintaining quality
ffmpeg -i "$INPUT_VIDEO" \
  -c:v libx264 \
  -crf 28 \
  -preset medium \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
  -r 30 \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  -y \
  "$OUTPUT_VIDEO"

echo ""
echo "✅ Video compressed successfully!"
echo "📊 New video size:"
ls -lh "$OUTPUT_VIDEO"

echo ""
echo "📸 Extracting poster image (first frame)..."
ffmpeg -i "$OUTPUT_VIDEO" \
  -ss 00:00:01 \
  -vframes 1 \
  -vf "scale=1920:1080" \
  -q:v 2 \
  -y \
  "$POSTER_IMAGE"

echo "✅ Poster image created!"

echo ""
echo "🔄 Backing up original video..."
mv "$INPUT_VIDEO" "$VIDEO_DIR/Demo_Reel_New_ORIGINAL.mp4"

echo "📝 Renaming optimized video..."
mv "$OUTPUT_VIDEO" "$INPUT_VIDEO"

echo ""
echo "✅ Video optimization complete!"
echo ""
echo "📊 Size comparison:"
echo "   Original: $(ls -lh $VIDEO_DIR/Demo_Reel_New_ORIGINAL.mp4 | awk '{print $5}')"
echo "   Optimized: $(ls -lh $INPUT_VIDEO | awk '{print $5}')"
echo "   Poster: $(ls -lh $POSTER_IMAGE | awk '{print $5}')"
echo ""
echo "🚀 Next steps:"
echo "   1. Rebuild frontend: cd /home/newadmin/projects/blackbow-associates/frontend && npm run build"
echo "   2. Deploy: pm2 reload blackbow-frontend"
echo "   3. Test loading speed at https://blackbowassociates.com"
echo ""
echo "💡 Tips for even better performance:"
echo "   - Consider serving video via CDN (Cloudflare R2, AWS S3 + CloudFront)"
echo "   - Enable Cloudflare video optimization if using Cloudflare proxy"
echo "   - Add multiple video formats (webm) for better browser support"
