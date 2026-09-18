import io
import os
import sys
import pytesseract
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Auto-configure Windows Tesseract binary path if present
if sys.platform.startswith("win"):
    default_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(default_win_path):
        pytesseract.pytesseract.tesseract_cmd = default_win_path

app = FastAPI(title="BodhGanga OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "Tesseract OCR 5.x",
        "service": "BodhGanga OCR Service"
    }

@app.post("/ocr")
async def process_ocr_page(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Configurable OCR languages (default: eng+mar)
        ocr_lang = os.environ.get("OCR_LANGUAGES", "eng+mar")
        tess_config = "--psm 6"

        # Attempt OCR with configured language pack, fallback gracefully to 'eng' if language pack is missing
        try:
            text = pytesseract.image_to_string(image, lang=ocr_lang, config=tess_config)
            ocr_data = pytesseract.image_to_data(image, lang=ocr_lang, config=tess_config, output_type=pytesseract.Output.DICT)
        except Exception:
            # Fallback to eng if requested language dataset (e.g. mar) is not installed
            ocr_lang = "eng"
            text = pytesseract.image_to_string(image, lang=ocr_lang, config=tess_config)
            ocr_data = pytesseract.image_to_data(image, lang=ocr_lang, config=tess_config, output_type=pytesseract.Output.DICT)

        confidences = [int(c) for c in ocr_data.get("conf", []) if int(c) >= 0]
        if confidences:
            avg_conf = sum(confidences) / len(confidences) / 100.0
            avg_conf = max(0.0, min(1.0, avg_conf))
        else:
            avg_conf = -1.0 # Unknown confidence sentinel when word confidence is unavailable

        return {
            "success": True,
            "text": text if text else "",
            "confidence": round(avg_conf, 4)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR engine execution error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
