"""Microsoft Edge neyron ovozlari (edge-tts, kalitsiz) bilan MP3 yozish — tools/audio-gen.js chaqiradi.
   python3 tools/audio-edge.py jobs.json     jobs = [{"out": fayl, "voice": "tr-TR-EmelNeural", "text": …, "rate": 0.9}]
   Yozilmay qolganlari xato emas: keyingi ishga tushirishda qayta uriniladi."""
import asyncio, json, os, sys
import edge_tts

async def one(job, sem, stat):
    rate = "%+d%%" % round((job.get("rate", 1) - 1) * 100)
    async with sem:
        for t in range(4):
            try:
                tmp = job["out"] + ".part"
                await edge_tts.Communicate(job["text"], job["voice"], rate=rate).save(tmp)
                if os.path.getsize(tmp) < 500: raise RuntimeError("empty audio")
                os.replace(tmp, job["out"])
                stat["ok"] += 1
                if stat["ok"] % 250 == 0: print("…", stat["ok"], flush=True)
                return
            except Exception as e:
                stat["last"] = repr(e)[:200]
                await asyncio.sleep(2 * (t + 1))
        stat["bad"] += 1
        try: os.remove(job["out"] + ".part")
        except OSError: pass

async def main():
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    for j in jobs: os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
    sem, stat = asyncio.Semaphore(int(os.environ.get("AUDIO_PAR", "6"))), {"ok": 0, "bad": 0, "last": ""}
    await asyncio.gather(*(one(j, sem, stat) for j in jobs))
    print("edge-tts: yozildi %d, yozilmadi %d %s" % (stat["ok"], stat["bad"], stat["last"]))

asyncio.run(main())
