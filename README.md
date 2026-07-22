# Senger Advisory Website

Static site for Senger Advisory.

## Local preview
Open `index.html` in a browser.

## Flow Engine
`flow-engine.js` provides the reusable canvas visualization used by the homepage hero. Add
`data-flow-engine` to a canvas inside a sized container, then load `flow-engine.js`. Each
matching canvas is initialized automatically. The constructor is also available as
`window.SengerFlowEngine` for product experiences that need custom particle counts or seeds.

The engine models work as routed particles moving through a directed network. Nodes have
independent service rates and priority-aware queues; route selection responds to downstream
queue depth. It pauses outside the viewport, rebuilds at responsive breakpoints, caps pixel
density, and renders a static state when reduced motion is preferred.

## Deploy
Push to GitHub. Netlify deploys automatically from the connected repository.

## Current release
Release 0.5 RC1 — public launch candidate structure.
