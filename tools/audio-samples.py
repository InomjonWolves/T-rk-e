# Voice samples for choosing the site's Turkish voice (Piper, free and offline).
# Run by .github/workflows/audio-samples.yml: downloads every Turkish Piper voice with its MODEL_CARD (licence),
# reads the same words and sentences with each voice at two speeds and writes MP3s + licences to ./samples.
import json, os, subprocess, sys, urllib.request, wave

HF = "https://huggingface.co/rhasspy/piper-voices"
OUT = "samples"
TEXTS = [
    ("w1", "Merhaba"), ("w2", "Teşekkür ederim"), ("w3", "öğretmen"), ("w4", "ağaç"), ("w5", "ışık"), ("w6", "çiçek"),
    ("w7", "güzel"), ("w8", "Nasılsın?"),
    ("s1", "Benim adım Ali. Ben bir öğretmenim."),
    ("s2", "Bugün hava çok güzel, parka gidelim mi?"),
    ("s3", "Dün akşam arkadaşlarımla lokantada yemek yedik."),
    ("s4", "Türkçe öğrenmek sandığınız kadar zor değil."),
]

def get(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()

def voices():
    tree = json.loads(get("https://huggingface.co/api/models/rhasspy/piper-voices/tree/main/tr/tr_TR?recursive=1"))
    return sorted({p["path"].rsplit("/", 1)[0] for p in tree if p["path"].endswith(".onnx")})

def main():
    os.makedirs(OUT, exist_ok=True)
    from piper import PiperVoice, SynthesisConfig
    found = voices()
    print("Turkish voices:", found)
    report = []
    for d in found:  # e.g. tr/tr_TR/dfki/medium
        name = "tr_TR-" + d.split("/")[2] + "-" + d.split("/")[3]
        os.makedirs("models", exist_ok=True)
        for ext in (".onnx", ".onnx.json"):
            p = f"models/{name}{ext}"
            if not os.path.exists(p):
                open(p, "wb").write(get(f"{HF}/resolve/main/{d}/{name}{ext}"))
        try:
            card = get(f"{HF}/raw/main/{d}/MODEL_CARD").decode("utf8", "replace")
        except Exception as e:
            card = f"(MODEL_CARD yo'q: {e})"
        open(f"{OUT}/{name}.MODEL_CARD.txt", "w").write(card)
        cfg = json.load(open(f"models/{name}.onnx.json"))
        speakers = cfg.get("speaker_id_map") or {}
        print(f"\n===== {name}  speakers={len(speakers) or 1}\n{card}")
        voice = PiperVoice.load(f"models/{name}.onnx")
        for sid in (list(speakers.values())[:2] if speakers else [None]):
            tag = name + (f"-spk{sid}" if sid is not None else "")
            for slow in (1.0, 1.15):
                for key, text in TEXTS:
                    wav = f"/tmp/{tag}-{key}.wav"
                    with wave.open(wav, "wb") as f:
                        voice.synthesize_wav(text, f, syn_config=SynthesisConfig(speaker_id=sid, length_scale=slow))
                    mp3 = f"{OUT}/{tag}{'-sekin' if slow > 1 else ''}-{key}.mp3"
                    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-ac", "1", "-ar", "22050", "-b:a", "48k", mp3], check=True)
            report.append({"voice": tag, "bytes": sum(os.path.getsize(f"{OUT}/{x}") for x in os.listdir(OUT) if x.startswith(tag))})
    json.dump({"voices": report, "texts": TEXTS}, open(f"{OUT}/index.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(report, indent=1))

if __name__ == "__main__":
    main()
