# Petri Net Editor - Requirements

## Core Editing

- [X] **Create/edit/delete places** - Add circles representing places, edit names, delete when no longer needed
- [X] **Create/edit/delete transitions** - Add rectangles representing transitions, edit names, delete
- [X] **Create/edit/delete arcs** - Draw directed edges from places to transitions and transitions to places
- [X] **Add/remove tokens** - Click on places to toggle tokens or set specific counts
- [X] **Drag & drop positioning** - Move elements freely on the canvas
- [ ] **Multi-select** - Select multiple elements for batch operations
- [X] **Undo/redo** - Revert and restore actions with history
- [X] **Save/load** - Persist Petri nets to file (JSON or PNML format)

## Visualization

- [X] **Canvas zoom & pan** - Navigate and zoom into large Petri nets
- [ ] **Grid/snap-to-grid** - Align elements neatly on a grid
- [ ] **Enabled transition highlighting** - Visually indicate which transitions can fire
- [X] **Labels** - Name places and transitions, display initial markings

## Simulation

- [ ] **Manual firing** - Click on enabled transitions to fire them
- [ ] **Auto-firing mode** - Automatic random or sequential transition firing
- [ ] **Step-by-step execution** - Pause between firings for observation
- [ ] **Execution trace** - Display history of fired transitions and resulting markings

## Analysis

- [ ] **Reachability check** - Determine if a target marking can be reached
- [ ] **Liveness check** - Verify all transitions are potentially fireable
- [ ] **Boundedness check** - Check if place capacities are finite
- [ ] **Deadlock detection** - Identify markings with no enabled transitions

## Unfolding

- [ ] **Compute unfolding** - Generate the branching process of the Petri net
- [ ] **Visualize unfolding** - Display the unfolded net structure

## Advanced

- [ ] **Import/export PNML** - Support standard Petri net exchange format
- [ ] **Copy/paste** - Duplicate elements within or across nets
- [ ] **Templates** - Predefined common patterns (choice, loop, parallel)
