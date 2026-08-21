---
'petri-net-editor': patch
---

Fix production deployment pipeline: manual workflow dispatch now runs the deploy job, and the Release workflow calls the deploy workflow directly after publishing instead of relying on broken tag detection.
