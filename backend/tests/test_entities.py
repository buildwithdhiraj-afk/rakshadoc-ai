"""Tests for rule-based named-entity extraction.

The contract that matters: every entity returned is a literal substring of the
text that was extracted. No value is ever invented.
"""
from app.services.entities import extract_entities, entities_from_pages


def _values(entities, etype):
    return [e["value"] for e in entities if e["type"] == etype]


def _is_literal(entities, text):
    return all(e["value"] in text for e in entities)


def test_extracts_label_on_next_line_layout():
    text = (
        "Candidate Full Name Entered For CAP Process 2025\n"
        "DHIRAJ NIMJE\n"
        "Date of Birth (DD-MM-YYYY)\n"
        "16-11-2004\n"
        "District from which Candidate has passed H.S.C\n"
        "Thane\n"
    )
    ents = extract_entities(text, page=1)
    assert "DHIRAJ NIMJE" in _values(ents, "PERSON")
    assert "16-11-2004" in _values(ents, "DATE")
    assert "Thane" in _values(ents, "LOCATION")
    assert _is_literal(ents, text)


def test_extracts_inline_label_value_layout():
    text = "Application ID : MC25106763\nRoll No - 2502028315\nE-mail: dhiraj@example.com\n"
    ents = extract_entities(text, page=2)
    assert "MC25106763" in _values(ents, "ID")
    assert "2502028315" in _values(ents, "ID")
    assert "dhiraj@example.com" in _values(ents, "EMAIL")
    assert _is_literal(ents, text)


def test_hyphenated_text_is_not_a_label_separator():
    # "MAH-MCA-CET" must not be split into a label and an inline value.
    text = "Candidate Full Name Fetched From MAH-MCA-CET 2025 data\nNIMJE DHIRAJ YESHWANT\n"
    ents = extract_entities(text)
    assert "MCA-CET 2025 data" not in [e["value"] for e in ents]
    assert "NIMJE DHIRAJ YESHWANT" in _values(ents, "PERSON")


def test_placeholder_tokens_are_not_entities():
    text = "Date of Birth (DD-MM-\nYYYY)\nGender\nMale\n"
    ents = extract_entities(text)
    assert ents == []


def test_instruction_lines_do_not_produce_entities():
    text = (
        'NOTE - Candidate and Facilitation centre shall check and verify the '
        '"Candidate Full Name Entered For CAP"\nProcess"\n'
        "Candidate Name Matching Score = 0.73\n"
    )
    ents = extract_entities(text)
    assert _values(ents, "PERSON") == []


def test_identifier_values_require_digits():
    text = "Total Percentile\n98.5\n"  # label, then a non-identifier value
    assert "Total Percentile" not in [e["value"] for e in extract_entities(text)]


def test_ip_addresses_and_prose_are_rejected():
    text = "Server Address\n103.127.23.124\n"
    assert _values(extract_entities(text), "LOCATION") == []


def test_empty_and_blank_text_yield_nothing():
    assert extract_entities("") == []
    assert extract_entities("   \n\n  \n") == []


def test_pages_with_no_text_contribute_nothing():
    pages = [{"page": 1, "text": "Application ID : MC25106763\n"}, {"page": 2, "text": ""}]
    ents = entities_from_pages(pages)
    assert [e["value"] for e in ents] == ["MC25106763"]


def test_merge_deduplicates_and_keeps_first_page():
    pages = [
        {"page": 1, "text": "Candidate Name\nRAHUL SHARMA\nDate of Birth\n01-01-2000\n"},
        {"page": 2, "text": "Candidate Name\nRAHUL SHARMA\nDate of Birth\n01-01-2000\n"},
    ]
    ents = entities_from_pages(pages)
    assert len(ents) == 2
    assert all(e["page"] == 1 for e in ents)


def test_every_entity_is_deduplicated_and_capped():
    text = "\n".join(
        f"Candidate Name\nTEST NAME {i}\n" for i in range(20)
    )
    persons = _values(extract_entities(text), "PERSON")
    assert len(persons) == len(set(persons))
    assert len(persons) <= 4
