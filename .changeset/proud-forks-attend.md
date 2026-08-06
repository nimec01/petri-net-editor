---
'petri-net-editor': minor
---

Load the editor with a pre-defined net via a POST request to `/editor`. The request body is the JSON representation of the net (a raw `PetriNetState` or an object with a `net` field), which may be sent as `application/json` or as FormData with the JSON in a `net` field; the server responds with a `303` redirect to an encoded shareable URL that the editor loads.
