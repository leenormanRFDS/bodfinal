#!/usr/bin/env bash
# Rebuilds the opening cinematic's web assets from the owner's masters.
#   scripts/encode-opening-assets.sh <master.wav> <BOD_paper.mp4>
# Outputs public/audio/bod-opening.m4a, public/video/bod-paper-{wide,phone}.mp4 and
# public/images/opening/paper-poster.webp. Afterwards update the ?v=<hash> values in
# OPENING (src/consts.ts) with the first 8 hex chars of `md5sum` of each file, and re-measure
# the cue times in src/components/Opening.astro (CUES) if the mix changed.
set -euo pipefail
WAV="$1"; MP4="$2"
mkdir -p public/audio public/video public/images/opening
# -1.5 dB so AAC overshoot cannot clip (master peaks at -0.1 dBFS)
ffmpeg -y -i "$WAV" -af "volume=-1.5dB" -c:a aac -b:a 112k -movflags +faststart public/audio/bod-opening.m4a
# silent: sound comes from the master. Wide 2.35:1, and a 1500x940 crop framed on the paper for portrait phones.
ffmpeg -y -i "$MP4" -an -vf "scale=1920:820:flags=lanczos" -c:v libx264 -preset slower -profile:v high -pix_fmt yuv420p -crf 29 -maxrate 2800k -bufsize 5600k -g 24 -r 24 -movflags +faststart public/video/bod-paper-wide.mp4
ffmpeg -y -i "$MP4" -an -vf "crop=1500:940:345:0,scale=960:602:flags=lanczos" -c:v libx264 -preset slower -profile:v high -pix_fmt yuv420p -crf 29 -maxrate 2200k -bufsize 4400k -g 24 -r 24 -movflags +faststart public/video/bod-paper-phone.mp4
ffmpeg -y -i "$MP4" -vf "select=eq(n\,0),scale=1280:-1" -frames:v 1 -c:v libwebp -quality 70 public/images/opening/paper-poster.webp
md5sum public/audio/bod-opening.m4a public/video/bod-paper-wide.mp4 public/video/bod-paper-phone.mp4
