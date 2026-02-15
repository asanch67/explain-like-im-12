# Explain Like I’m 12 (ELI12)

Paste textbook text → get:
- simple explanation (12 y.o. level)
- real-life examples
- mini-quiz (5 questions)

## How it works (MVP)
We use simple NLP heuristics:
- sentence splitting
- detecting “hard words”
- building a small glossary + examples + quiz

## Run locally
```bash
pip install -r requirements.txt
streamlit run app.py
