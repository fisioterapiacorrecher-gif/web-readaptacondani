#!/usr/bin/env bash
# Prepara una sesión nueva para editar reels. Uso: bash reels-kit/scripts/preparar.sh
set -e
pip install -q numpy scipy pillow opencv-python-headless sherpa-onnx fonttools 2>&1 | grep -v WARN || true
M=$HOME/models/sherpa-onnx-whisper-large-v3
if [ ! -f "$M/large-v3-encoder.int8.onnx" ]; then
  mkdir -p $HOME/models && cd $HOME/models
  # GitHub está permitido; huggingface (CDN) suele estar bloqueado en este entorno
  curl -sS -L https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-large-v3.tar.bz2 | tar xjf - --wildcards '*int8*' '*tokens*'
fi
ls -la $M
which ffmpeg ffprobe
