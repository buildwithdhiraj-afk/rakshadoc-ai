import io
from PIL import Image, ImageEnhance, ImageOps

def enhance_document_image(image_path: str, output_path: str = None) -> str:
    img = Image.open(image_path).convert("RGB")

    # Autocontrast
    img = ImageOps.autocontrast(img, cutoff=1)

    # Enhance contrast & sharpness for scanned Indian document legibility
    enhancer_contrast = ImageEnhance.Contrast(img)
    img = enhancer_contrast.enhance(1.25)

    enhancer_sharpness = ImageEnhance.Sharpness(img)
    img = enhancer_sharpness.enhance(1.2)

    save_path = output_path or image_path
    img.save(save_path, "PNG")
    return save_path
