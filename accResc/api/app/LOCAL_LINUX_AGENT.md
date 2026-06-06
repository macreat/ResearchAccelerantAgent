# GCPDS Local Linux Research Agent

This prototype is designed for a CasaOS/Linux server that stores local research documents and exposes a browser GUI for remote users.

## Server Setup

1. Copy PDFs into:

   ```bash
   /DATA/AppData/research-agent/docs
   ```

2. From this app directory, install the terminal wrapper:

   ```bash
   sudo ./bin/install-gcpds.sh
   ```

3. Start the agent:

   ```bash
   gcpds agent start
   ```

4. Open the printed GUI URL from the remote PC browser:

   ```text
   http://<linux-server-ip>:3000/docs
   ```

## Commands

```bash
gcpds agent start
gcpds agent stop
gcpds agent status
gcpds agent logs
```

## First Prototype Flow

1. Open `Local Docs`.
2. Click `Scan PDFs`.
3. Search by file name, standard number, report name, acronym, or topic.
4. Ask questions in `Agent Console`.
5. Select documents.
6. Generate a `.tex` report.
7. Compile the `.tex` report to `.pdf`.

The first prototype answers from indexed local document metadata. To enable deeper inference, configure Ollama, set `ENABLE_LOCAL_LLM=true`, and later add PDF text extraction plus embeddings.
