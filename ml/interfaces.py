from typing import Protocol, List, Dict, Any, Optional

class LayoutModel(Protocol):
    def predict(self, image_path: str) -> List[Dict[str, Any]]:
        ...

class OCRModel(Protocol):
    def extract_text(self, image_path: str, bbox: Dict[str, float]) -> Dict[str, Any]:
        ...

class SensitiveDetector(Protocol):
    def detect_sensitive_regions(self, image_path: str) -> List[Dict[str, Any]]:
        ...
