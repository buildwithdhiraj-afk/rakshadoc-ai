from app.services.braille_service import translate_to_braille

def test_braille_translation_latin():
    result = translate_to_braille("abc", "English")
    assert result == "⠁⠃⠉"

def test_braille_translation_capital():
    result = translate_to_braille("Hello", "English")
    # Capital sign ⠠ followed by h e l l o
    assert "⠠" in result

def test_braille_translation_devanagari():
    result = translate_to_braille("भारत", "Hindi")
    assert len(result) > 0
