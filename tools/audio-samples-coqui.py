# Second candidate: Coqui TTS Turkish model (tts_models/tr/common-voice/glow-tts). Prints its licence from the
import json, os, subprocess, importlib.resources as R
sys_texts = __import__("importlib").import_module("audio-samples".replace("-", "_")) if False else None
TEXTS = [l for l in json.load(open("samples/index.json"))["texts"]]
from TTS.api import TTS
import TTS as T
models = json.load(open(os.path.join(os.path.dirname(T.__file__), ".models.json")))
info = models["tts_models"]["tr"]["common-voice"]["glow-tts"]
print("COQUI MODEL INFO:", json.dumps({k: v for k, v in info.items() if k != "github_rls_url"}, ensure_ascii=False))
open("samples/coqui-tr-glow-tts.MODEL_CARD.txt", "w").write(json.dumps(info, ensure_ascii=False, indent=1))
tts = TTS("tts_models/tr/common-voice/glow-tts")
for key, text in TEXTS:
    tts.tts_to_file(text=text, file_path=f"/tmp/c-{key}.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"/tmp/c-{key}.wav", "-ac", "1", "-ar", "22050", "-b:a", "48k", f"samples/coqui-tr-glow-tts-{key}.mp3"], check=True)
print("coqui ok")
