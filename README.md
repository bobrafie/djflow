# djflow

## Problem
1. You have lots of music in FLAC format
2. Most CDJs cannot read FLAC files

## Solution
DJFlow is designed to be run on a copy of your music (eg. your USB stick).
It makes changes in place and does not back up your files.
1. Scans your directory
2. Finds FLAC files
3. Converts them to MP3 (CBR 320)
4. Deletes the orignal FLAC files

## Prerequisites
FFmpeg needs to be in your `PATH`
