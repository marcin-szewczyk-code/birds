from pathlib import Path
import json
import copy

BASE_DIR = Path("../data")
INPUT_JSON = BASE_DIR / "birds.json"
OUTPUT_JSON = BASE_DIR / "birds-local.json"

IMAGE_EXT = ".jpg"
AUDIO_EXT = ".ogg"


def main() -> None:
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"Brak pliku wejściowego: {INPUT_JSON}")

    with INPUT_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    out = copy.deepcopy(data)

    missing_files = []

    for dataset in out.get("datasets", []):
        dataset_id = dataset.get("id", "").strip()
        if not dataset_id:
            continue

        region_dir = BASE_DIR / dataset_id

        for bird in dataset.get("birds", []):
            bird_id = bird.get("id", "").strip()
            if not bird_id:
                continue

            image_rel = f"{dataset_id}/{bird_id}{IMAGE_EXT}"
            audio_rel = f"{dataset_id}/{bird_id}{AUDIO_EXT}"

            image_abs = BASE_DIR / dataset_id / f"{bird_id}{IMAGE_EXT}"
            audio_abs = BASE_DIR / dataset_id / f"{bird_id}{AUDIO_EXT}"

            if not image_abs.exists():
                missing_files.append(str(image_abs))

            if not audio_abs.exists():
                missing_files.append(str(audio_abs))

            # Podmieniamy URL-e internetowe na ścieżki lokalne
            bird["image_url"] = image_rel
            bird["audio_url"] = audio_rel

    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"[OK] zapisano: {OUTPUT_JSON}")

    if missing_files:
        print("\n[UWAGA] Brakujące pliki lokalne:")
        for path in missing_files:
            print(f" - {path}")
    else:
        print("[OK] Wszystkie lokalne pliki istnieją.")


if __name__ == "__main__":
    main()