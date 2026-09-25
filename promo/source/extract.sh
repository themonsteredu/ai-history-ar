#!/bin/bash
# 필요한 구간만 JPEG 프레임으로 추출 (가로 2560px로 통일) + 프레임 정보 meta.js 생성
FF=${FFMPEG:-$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
mkdir -p work/frames
echo "window.CLIPS_META = {" > work/meta.js
for c in "$@"; do
  rm -rf work/frames/$c; mkdir -p work/frames/$c
  $FF -y -loglevel error -i clips/$c.mp4 -vf "scale=2560:1440:flags=lanczos" -q:v 3 work/frames/$c/%05d.jpg
done
for d in work/frames/*/; do c=$(basename $d); n=$(ls $d | wc -l); echo "  $c:{n:$n,w:2560}," >> work/meta.js; done
echo "};" >> work/meta.js
cat work/meta.js
