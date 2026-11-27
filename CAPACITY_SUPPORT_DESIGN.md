# Petri Net Capacity Support

## Scope

Capacities are optional upper bounds on individual places in the existing Petri net model. There is no separate capacitated-net type, net-kind selector, or persistent net-kind indicator. A place without a capacity is unbounded.

Capacity values are non-negative integers. Users can set or clear a place's capacity in the place properties panel. Adding a capacity does not require assigning capacities to other places. A net-level action to remove all capacities is deferred; capacities can be cleared one place at a time.

## Editing and simulation

Editing a place's token count or capacity may produce a marking that exceeds its capacity. Such a place is invalid and must be marked red, with an explanation in its properties. Editing remains available while a net is invalid so the user can repair it. Once all places are valid, the error indication clears and simulation becomes available again.

A transition is enabled only when firing it would leave every place at or below its defined capacity. Simulation is blocked whenever any place is invalid, including when an imported marking exceeds a capacity.

## Import and export

JSON stores the optional capacity on each place. PNML stores capacities using a tool-specific annotation. When an import or export cannot preserve capacity data, the editor warns the user rather than silently discarding it.

Files without capacity data remain unbounded; no net-kind marker is needed. An imported numeric marking that exceeds a place's capacity is retained and marks that place invalid. An imported malformed capacity value also loads as invalid rather than being treated as unbounded. A token marking that cannot be parsed as a non-negative integer produces an import error instead of silently becoming zero.

## Deferred

A net-level action to remove all defined capacities may be considered later. For the initial scope, users remove a capacity by clearing it on the corresponding place.
