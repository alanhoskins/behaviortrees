---
layout: ../../layouts/ArticleLayout.astro
title: "Behavior Trees vs Finite State Machines: Which Should You Use?"
description: "An honest comparison of behavior trees and finite state machines for game AI — scalability, reactivity, debugging, performance — with concrete guidance on when each one wins."
pubDate: "2026-07-20"
order: 3
---

# Behavior Trees vs Finite State Machines

Ask "should my AI be a behavior tree or a state machine?" in any gamedev community and
you'll get confident answers in both directions. Both architectures are mainstream, both
ship in AAA games, and both can implement the same agents. The real question is which one
stays maintainable as *your* project grows. Here's the honest comparison.

## The 30-second versions

A **finite state machine (FSM)** models the agent as being in exactly one *state*
(Patrol, Chase, Attack, Flee), with explicit *transitions* between states triggered by
events or conditions. Simple, fast, and the transitions are exactly as flexible — and as
numerous — as you make them.

A **behavior tree (BT)** models the agent as a tree of prioritized tasks, re-evaluated on a
tick from the root. There are no explicit transitions; "switching behaviors" falls out of
selectors picking a different branch when conditions change.
(New to trees? Read [What Is a Behavior Tree?](/learn/what-is-a-behavior-tree/) first.)

## Where FSMs hurt: transition explosion

The canonical FSM failure mode is quadratic wiring. With 4 states, adding "flee when health
is low" means adding a transition from every state — 4 new edges and 4 places to maintain.
With 15 states, the diagram is unreadable and every new global behavior touches everything.

The BT equivalent is one edit: add a high-priority "Flee" branch under the root selector.
Every lower-priority behavior is automatically interruptible by it, because the tree
re-evaluates priorities every tick. **This is the single biggest practical argument for
behavior trees.**

## Where BTs hurt: stateful, cyclic flows

Some logic genuinely *is* a state machine. Turn-based game flow (menu → deploy → battle →
results), animation states, network connection lifecycles — these have well-defined modes,
few global interrupts, and cyclic transitions that BTs express awkwardly. Forcing them into
a tree gives you condition-checking gymnastics to reconstruct state you could have just...
stored.

BTs also re-evaluate conditions every tick, which is both their superpower (reactivity) and
a cost: naive trees re-run expensive checks (visibility raycasts, pathfinding queries)
constantly. Real projects cache expensive queries in a blackboard, tick trees at lower
frequencies, or use event-driven variants.

## Head to head

| Dimension | FSM | Behavior tree |
|-----------|-----|---------------|
| Small AI (2–5 behaviors) | **Wins** — trivial to write and read | Slight overkill |
| Large AI (10+ behaviors) | Transition spaghetti | **Wins** — scales by composition |
| Global interrupts ("always flee at low HP") | Edge from every state | **Wins** — one priority branch |
| Reusing logic between agents | Copy states *and* rewire transitions | **Wins** — graft a subtree |
| Stateful/cyclic flows (menus, animation) | **Wins** — natural fit | Awkward |
| Raw CPU cost per decision | **Wins** — an enum and a switch | Tree traversal + re-checked conditions |
| Designer-editable tooling | Rare | **Wins** — visual editors are the norm |
| Debugging | Easy: "what state am I in" | Needs tree-visualization tooling |

## The hybrid answer real games use

This isn't actually an either/or. Common production patterns:

- **BT for decisions, FSM for execution.** The tree decides *what* to do; each action leaf
  drives an animation/locomotion state machine that does it.
- **FSM at the top, BTs inside.** High-level game modes are states; the combat mode's brain
  is a behavior tree.
- **Utility scoring bolted on.** Some games score branches by utility functions instead of
  fixed priority order — utility AI and BTs compose well.

## So which should you use?

- **A handful of behaviors, one-off agent, game jam?** FSM (or plain code). You'll ship faster.
- **AI you'll iterate on for months, multiple agent types sharing logic, designers in the
  loop?** Behavior tree. The composition and tooling advantages compound.
- **Mode-heavy flow logic?** FSM, possibly with BTs inside the complex modes.

If you land on behavior trees, the fastest way to build intuition is hands-on: sketch your
agent in the [free online behavior tree editor](/) — start from the
[enemy AI example](/?example=enemy-patrol) and reshape it into your own design, then export
JSON for [Unity](/learn/behavior-trees-in-unity/),
[Unreal](/learn/behavior-trees-in-unreal-engine/), or
[a robotics stack](/learn/behavior-trees-in-robotics/).

<a class="try-editor" href="/?example=enemy-patrol">▶ Open the enemy AI example in the editor</a>
