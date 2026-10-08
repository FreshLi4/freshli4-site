"""Make five world previews from the matching, real tutorial recordings.

python3 build/prepare-ball-maze-world-media.py --tutorial-root PATH --output PATH
Original game/tutorial files are read-only. No game UI is generated or replaced.
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image


WORLD_SOURCES = [
    {'id': 'city', 'sources': ['自动电梯.mp4', '摩天轮.mp4']},
    {'id': 'mine', 'sources': ['矿车.mp4', '水龙头.mp4', '闸门.mp4']},
    {'id': 'island', 'sources': ['海洋.mp4', '浮木.mp4', '间歇泉.mp4']},
    {'id': 'valley', 'sources': ['风.mp4', '固定轨道.mp4', '吊桥.mp4']},
    {'id': 'black-hole', 'sources': ['黑洞.mp4', '传送门.mp4', '磁力轨道.mp4']},
]


def run(*command):
    return subprocess.run(command, check=True, capture_output=True, text=True).stdout


def duration(path):
    return float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                     '-of', 'default=noprint_wrappers=1:nokey=1', str(path)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tutorial-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    recordings = []
    for world in WORLD_SOURCES:
        asset_id = 'world-'+world['id']
        segments = []
        with tempfile.TemporaryDirectory(prefix='ball-maze-world-') as temp:
            temp_dir = Path(temp)
            parts = []
            for index, filename in enumerate(world['sources']):
                source = args.tutorial_root / filename
                source_duration = duration(source)
                # Remove the exports' opening/closing fades. The wind tutorial's
                # first attempt shows a failure menu; keep its later gameplay.
                start = 5.6 if filename == '风.mp4' else .25
                end = source_duration - .25
                if end <= start:
                    raise ValueError('No gameplay interval: '+str(source))
                part = temp_dir / (str(index)+'.mp4')
                run('ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-i', str(source),
                    '-t', str(end-start), '-an', '-vf', 'scale=960:-2,fps=30',
                    '-c:v', 'libx264', '-crf', '24', '-preset', 'fast',
                    '-pix_fmt', 'yuv420p', str(part))
                parts.append(part)
                segments.append({'source': filename, 'source_duration': source_duration,
                                 'start_seconds': start, 'end_seconds': end})
            playlist = temp_dir / 'parts.ffconcat'
            playlist.write_text('ffconcat version 1.0\n'+''.join("file '"+part.name+"'\n" for part in parts))
            target = args.output / (asset_id+'.mp4')
            run('ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '1',
                '-i', str(playlist), '-an', '-c:v', 'copy', '-movflags', '+faststart', str(target))
            frame = temp_dir / 'poster.png'
            run('ffmpeg', '-v', 'error', '-y', '-ss', '1.5', '-i', str(target),
                '-frames:v', '1', str(frame))
            Image.open(frame).convert('RGB').save(args.output / (asset_id+'.webp'), quality=86, method=6)
            recordings.append({'world_id': world['id'], 'asset_id': asset_id,
                               'segments': segments, 'duration': duration(target), 'poster_seconds': 1.5})
        print('Prepared '+asset_id, flush=True)
    manifest = {'source_root': str(args.tutorial_root), 'recordings': recordings,
                'pending_worlds': [{'id': 'darkroom', 'reason': 'No matching real tutorial footage supplied'}]}
    (args.output.parent.parent / 'world-recordings.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')


if __name__ == '__main__':
    main()
