"""Prepare real tutorial, score and solo recordings without changing the game UI.

python3 build/prepare-ball-maze-feature-media.py --tutorial-root PATH --output PATH
The score clip holds its final recorded frame for readability; it does not
generate rankings or simulate UI interactions.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--tutorial-root', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--only', nargs='+', help='Prepare only these clip IDs; retain the complete source manifest')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

clips = [
    {'id': 'editor', 'source': '关卡编辑器-back.mp4', 'poster_seconds': 8,
     'start_seconds': 0, 'hold_last_seconds': 0, 'content': 'In-game rail selection, placement, rotation and playtest'},
    {'id': 'records', 'source': '完成迷宫挑战-back.mp4', 'poster_seconds': 6,
     'start_seconds': 4.4, 'end_seconds': 6.05, 'hold_last_seconds': 5,
     'content': 'Recorded completion screen with your record and best record; not a multiplayer ranking list'},
    {'id': 'solo', 'source': '普通球-back.mp4', 'poster_seconds': 2,
     'start_seconds': 0, 'hold_last_seconds': 0,
     'content': 'Single-player gameplay with the ordinary ball'},
    {'id': 'tracks', 'source': '特殊轨道.mp4', 'poster_seconds': 3,
     'start_seconds': 0, 'hold_last_seconds': 0,
     'content': 'Complete tutorial overview of special rails'},
    {'id': 'abilities', 'source': '小球能力.mp4', 'poster_seconds': 3,
     'start_seconds': 0, 'hold_last_seconds': 0,
     'content': 'Complete tutorial overview of ball abilities'},
]
if args.only and set(args.only) - {clip['id'] for clip in clips}:
    raise ValueError('Unknown clip IDs: '+', '.join(set(args.only) - {clip['id'] for clip in clips}))
for clip in clips:
    if args.only and clip['id'] not in args.only:
        continue
    source = args.tutorial_root / clip['source']
    if not source.is_file():
        raise FileNotFoundError(source)
    with tempfile.TemporaryDirectory(prefix='ball-maze-recording-') as temp:
        frame = Path(temp) / 'poster.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(clip['poster_seconds']),
                        '-i', str(source), '-frames:v', '1', '-vf', 'scale=1280:-2',
                        str(frame)], check=True)
        Image.open(frame).convert('RGB').save(args.output / (clip['id']+'.webp'), quality=86, method=6)
    filters = ['scale=1280:-2', 'fps=30']
    if 'end_seconds' in clip:
        # Exclude the tutorial's closing UI fade before holding the real score.
        filters.append('trim=duration='+str(clip['end_seconds']-clip['start_seconds']))
    if clip['hold_last_seconds']:
        filters.append('tpad=stop_mode=clone:stop_duration='+str(clip['hold_last_seconds']))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(clip['start_seconds']),
                    '-i', str(source), '-an', '-vf', ','.join(filters),
                    '-c:v', 'libx264', '-crf', '23', '-preset', 'fast',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    str(args.output / (clip['id']+'.mp4'))], check=True)
    print('Prepared '+clip['id'], flush=True)

manifest = {'source_root': str(args.tutorial_root), 'recordings': clips,
            'pending_recordings': [{'id': 'coop', 'reason': 'No verified co-op recording in the supplied media set'}]}
with (args.output.parent.parent / 'recordings.json').open('w') as stream:
    json.dump(manifest, stream, ensure_ascii=False, indent=2)
