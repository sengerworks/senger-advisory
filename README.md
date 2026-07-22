# Senger Advisory Website

Static site for Senger Advisory.

## Local preview
Open `index.html` in a browser.

## Flow Engine
`flow-engine.js` provides the reusable canvas visualization used by the homepage hero. Add
`data-flow-engine` to a canvas inside a sized container, then load `flow-engine.js`. Each
matching canvas is initialized automatically. The constructor is also available as
`window.SengerFlowEngine` for product experiences that need custom particle counts or seeds.

The engine models work as routed particles moving through a directed network. Nodes have a
hidden capacity model, independent service rates, priority-aware queues, and observable
throughput and wait time. Demand, utilization, local pressure, and propagated downstream
pressure determine effective capacity; routing responds to those conditions. Use
`getSnapshot()` to read the current model state without coupling other product experiences to
the renderer. The engine pauses outside the viewport, rebuilds at responsive breakpoints,
caps pixel density, and renders a static state when reduced motion is preferred.

The Capacity Lens applies a feathered capacity increase around the pointer. It follows the
cursor on desktop, drifts autonomously on touch devices, and can be repositioned by dragging.
Its influence changes model behavior—not only appearance—by increasing effective capacity,
accelerating work, reducing visible pressure, and helping queues clear. The lens is disabled
when reduced motion is preferred.

## Deploy
Push to GitHub. Netlify deploys automatically from the connected repository.

## Current release
Release 0.5 RC1 — public launch candidate structure.
