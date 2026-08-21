# petri-net-editor

## 0.2.0

### Minor Changes

- c7f02f3: Rework the extensions sidebar to use the daisyUI drawer component so it auto-closes when clicking outside the drawer.
- d494e57: Load the editor with a pre-defined net via a POST request to `/editor`. The request body is the JSON representation of the net (a raw `PetriNetState` or an object with a `net` field), which may be sent as `application/json` or as FormData with the JSON in a `net` field; the server responds with a `303` redirect to an encoded shareable URL that the editor loads.
- 2fa16eb: Add a GitHub repository link and a version badge (linked to the matching GitHub release) to the editor navbar.

### Patch Changes

- ebd1542: Update all patch updates
- 2c57b95: Update dependency @antfu/eslint-config to v9.3.0
- e2936dd: Update dependency @types/node to v26.2.0
- ebd1542: Update dependency katex to v0.18.2
- ebd1542: Update dependency katex to v0.18.4
- 78c7431: Update dependency @changesets/cli to v3
- ebd1542: Upgrade deps
- ebd1542: Upgrade dependencies
