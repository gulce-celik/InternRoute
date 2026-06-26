# Ingestion Pipeline

Ham veriyi vektör veritabanına işleme akışı.

## Akış

```
PDF Upload → Text Extraction → Chunking → Embedding → ChromaDB Store
Interview Answer → Chunking → Embedding → ChromaDB Store
```

## Planlanan

- `ingestor.py` — Ana ingestion orchestrator
- `pdf_parser.py` — PDF → düz metin
