# petri-net-editor

## 0.3.0

### Minor Changes

- a671a82: Add reachability graph as a new tab type and a general split view for any two tabs. Users can open any tab side-by-side with another tab (including two petri net tabs) using the split button in the tab bar.
- 518679a: Re-work canvas interaction in selection mode. Left-click still selects a single element, and left-button drag-and-drop on a node still moves it, but left-button drag on the empty canvas now rubber-band (box) selects any elements inside the dragged rectangle. Panning the canvas is now done exclusively by dragging with the middle mouse button instead of the left button.
- 518679a: Add copy/paste for Petri net elements. Select one or more elements (use Ctrl/Shift+click for multiple) and copy with Ctrl+C or the toolbar button, then paste duplicates with Ctrl+V. Pasted elements include arcs between copied nodes, keep labels and tokens, are anchored near the viewport center, and can be pasted into any open net tab. Paste is a single undoable action.
- b0829d5: Add more keyboard shortcuts to the editor: digits 1-6 switch between tools (Select, Place, Transition, Arc, Token, Delete) from left to right, Delete/Backspace removes the selected element, Ctrl++/Ctrl+-/Ctrl+0 zoom in/out and fit to screen, F toggles fire mode, Escape deselects/exits fire mode, and ? opens a new keyboard shortcuts overview modal (also available via a toolbar button). The shortcuts modal is presented as a centered dialog that scrolls internally so opening it no longer surfaces page scrollbars.
- a671a82: Add multi-tab support: users can open multiple independent Petri nets in separate tabs, duplicate tab contents, rename tabs via double-click, and switch between tabs without losing state. Tab names are included in JSON export/import, and the page title reflects the active tab.

### Patch Changes

- 2970def: Update all patch updates
- 1d507a3: Update dependency @types/node to v26.4.1
- 2970def: Update all patch updates
- e825d1e: Update dependency wrangler to v4.128.0
- 9492a43: Update dependency vue-router to v5.3.1
- 2970def: Update dependency katex to v0.18.5
- 6eef631: Update dependency @antfu/eslint-config to v9.5.1
- 87e0141: Fix production deployment pipeline: manual workflow dispatch now runs the deploy job, and the Release workflow calls the deploy workflow directly after publishing instead of relying on broken tag detection.
- 5d7addc: Replace cloudflare/wrangler-action with wrangler installed as a devDependency in the deploy workflows, and allow workerd build scripts so it installs correctly.

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
