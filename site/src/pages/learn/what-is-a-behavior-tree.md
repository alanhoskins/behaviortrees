---
layout: ../../layouts/ArticleLayout.astro
title: "What Is a Behavior Tree? A Practical Introduction for Game AI"
description: "Behavior trees explained from scratch: what they are, how ticks, sequences, selectors and decorators work, why games and robots use them, and an interactive editor to try one yourself."
pubDate: "2026-07-20"
order: 1
---

# What Is a Behavior Tree?

A **behavior tree** is a way to organize the decision-making logic of an AI agent — a game
enemy, an NPC, a robot — as a tree of small, reusable tasks. Instead of one giant tangle of
`if/else` statements or a state machine that grows unmanageable, you compose simple building
blocks: *"try this first, fall back to that, repeat this until it succeeds."*

Behavior trees became the dominant AI architecture in games after **Halo 2** popularized them
in the mid-2000s, and titles like *Bioshock* and *Spore* cemented them. Today they're built
into Unreal Engine, available in Unity through popular assets, and widely used in robotics
through libraries like BehaviorTree.CPP and ROS 2.

The fastest way to build an intuition is to look at one. This is a complete enemy AI:

```text
                    ┌─────────────┐
                    │  Selector    │  "try each child until one succeeds"
                    └──────┬──────┘
        ┌──────────────────┼───────────────────┐
   ┌────┴─────┐      ┌─────┴─────┐       ┌─────┴─────┐
   │ Sequence │      │ Sequence  │       │ Sequence  │
   │ (Attack) │      │  (Chase)  │       │ (Patrol)  │
   └────┬─────┘      └─────┬─────┘       └─────┬─────┘
     ┌──┴───┐           ┌──┴────┐        ┌─────┼─────────┐
  In range? Attack   Visible? Chase   Waypoint  Wait  Next point
```

<a class="try-editor" href="/?example=enemy-patrol">▶ Open this exact tree in the free editor</a>

Reading it top-to-bottom, left-to-right: *if the player is in range, attack; otherwise if the
player is visible, chase; otherwise patrol.* That priority ordering falls naturally out of the
structure — no flags, no state transitions to wire up.

## The tick: how a behavior tree "runs"

A behavior tree doesn't run continuously. The AI system **ticks** the tree at some interval —
every frame, every few frames, or whenever something relevant changes. On each tick, execution
starts at the root and flows down through the tree.

Every node that gets ticked returns one of three statuses:

| Status | Meaning |
|--------|---------|
| **Success** | The task finished and achieved its goal ("target reached"). |
| **Failure** | The task cannot succeed ("no path to target"). |
| **Running** | The task needs more time ("still walking there"). |

That third status, `Running`, is what separates behavior trees from simple decision trees:
tasks can take many frames, and the tree remembers what's in progress.

## The four kinds of nodes

Almost everything in a behavior tree is one of four node categories.

### 1. Composites control the flow

Composite nodes have multiple children and decide which of them run, in what order:

- **Sequence** — runs children left to right, and fails the moment one child fails. It's an
  AND: *all* steps must succeed. "Has key → unlock door → open door."
- **Selector** (also called *Priority* or *Fallback*) — runs children left to right, and
  succeeds the moment one child succeeds. It's an OR with priorities: "attack, else chase,
  else patrol."

Those two cover the vast majority of real trees. Many implementations add a **Parallel**
composite (run children simultaneously) and memory variants (`MemSequence`/`MemPriority`)
that resume from the running child instead of re-evaluating from the start each tick.

### 2. Decorators modify a single child

A decorator wraps exactly one child and alters its behavior or result:

- **Inverter** — flips Success and Failure (turns "is enemy visible?" into "is enemy *not* visible?")
- **Repeater** / **Repeat Until Success** — loops its child
- **Limiter / cooldown** — restricts how often the child may run

### 3. Conditions check the world

Leaf nodes that read game or sensor state and return Success or Failure instantly:
`IsPlayerVisible?`, `HasAmmo?`, `IsBatteryLow?`. They never return Running.

### 4. Actions change the world

The leaves that actually do things: `MoveToTarget`, `PlayAnimation`, `FireWeapon`,
`GraspObject`. Actions commonly return Running across many ticks while they work.

## Why not just use if/else or a state machine?

You *can* build the patrol/chase/attack enemy with nested conditionals or a finite state
machine. The problems appear as the AI grows:

- **Modularity.** A behavior tree's subtrees are self-contained. You can rip out the whole
  "Patrol" branch, reuse it in another agent, or replace it, without touching the rest. In an
  FSM, transitions couple every state to the states around it.
- **Priorities and interruption for free.** Because ticking re-evaluates from the root,
  a higher-priority branch (like "flee when health is low") naturally preempts lower branches.
  In an FSM you'd add a transition from *every* state to the flee state.
- **Readability at scale.** Designers can read a tree. A 40-state FSM transition diagram is
  spaghetti; a 40-node tree is still just nested priorities.

There are real trade-offs — we compare the two architectures honestly in
[Behavior Trees vs Finite State Machines](/learn/behavior-trees-vs-state-machines/).

## Try it yourself

The best way to understand behavior trees is to build one. The free, no-signup
[behavior tree editor](/) on this site runs in your browser and lets you create trees with
sequences, selectors, decorators and your own custom action/condition nodes, then export
clean JSON you can load in your engine or framework.

<a class="try-editor" href="/?example=open-the-door">▶ Start with the classic "open the door" example</a>

## Where to go next

- [Sequence, Selector, and Decorator Nodes Explained](/learn/behavior-tree-nodes-explained/) —
  a deeper look at every node type with worked examples
- [Behavior Trees vs Finite State Machines](/learn/behavior-trees-vs-state-machines/)
- [Behavior Trees in Unity](/learn/behavior-trees-in-unity/) ·
  [Behavior Trees in Unreal Engine](/learn/behavior-trees-in-unreal-engine/) ·
  [Behavior Trees in Robotics](/learn/behavior-trees-in-robotics/)
- [Behavior Tree Examples: Common Game AI Patterns](/learn/behavior-tree-examples/)
