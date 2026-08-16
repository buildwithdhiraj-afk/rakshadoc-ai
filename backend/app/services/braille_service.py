LATIN_TO_BRAILLE = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠯',
    'i': '⠊', 'j': '⠫', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏',
    'q': '⠟', 'r': '⠗', 's': '⠌', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
    'y': '⠽', 'z': '⠵', ' ': '⠀', '.': '⠲', ',': '⠂', '!': '⠔', '?': '⠦', '-': '⠤'
}

BHARATI_DEVANAGARI_BRAILLE = {
    'अ': '⠁', 'आ': '⠜', 'इ': '⠊', 'ई': '⠔', 'उ': '⠥', 'ऊ': '⠇', 'ऋ': '⠐⠗', 'ए': '⠑', 'ऐ': '⠌', 'ओ': '⠕', 'औ': '⠪',
    'क': '⠅', 'ख': '⠨', 'ग': '⠛', 'घ': '⠣', 'ङ': '⠐⠅',
    'च': '⠉', 'छ': '⠡', 'ज': '⠚', 'झ': '⠮', 'ञ': '⠐⠉',
    'ट': '⠞', 'ठ': '⠾', 'ड': '⠫', 'ढ': '⠿', 'ण': '⠼',
    'त': '⠹', 'थ': 'th', 'द': 'd', 'ध': 'd', 'न': '⠝',
    'प': '⠏', 'फ': '⠋', 'ब': '⠃', 'भ': 'bf', 'म': '⠍',
    'य': '⠽', 'र': '⠗', 'ल': '⠇', 'व': '⠧', 'श': '⠯', 'ष': '⠮', 'स': '⠌', 'ह': '⠯',
    'ा': '⠜', 'ि': '⠊', 'ी': '⠔', 'ु': '⠥', 'ू': '⠇', 'े': '⠑', 'ै': '⠌', 'ो': '⠕', 'ौ': '⠪', '्': '⠈'
}

def translate_to_braille(text: str, language: str = "English") -> str:
    res = []
    for ch in text:
        if 'a' <= ch.lower() <= 'z':
            if ch.isupper():
                res.append('⠠')
            res.append(LATIN_TO_BRAILLE.get(ch.lower(), ch))
        elif '0' <= ch <= '9':
            res.append('⠼')
            digit_map = {'1':'⠁','2':'⠃','3':'⠉','4':'⠙','5':'⠑','6':'⠋','7':'⠛','8':'⠯','9':'⠊','0':'⠫'}
            res.append(digit_map.get(ch, ch))
        elif ch in BHARATI_DEVANAGARI_BRAILLE:
            res.append(BHARATI_DEVANAGARI_BRAILLE[ch])
        elif ch in LATIN_TO_BRAILLE:
            res.append(LATIN_TO_BRAILLE[ch])
        else:
            res.append(ch)
    return "".join(res)
