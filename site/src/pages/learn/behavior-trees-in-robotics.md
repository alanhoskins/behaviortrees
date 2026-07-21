---
layout: ../../layouts/ArticleLayout.astro
title: "Behavior Trees in Robotics: BehaviorTree.CPP, ROS 2, and Nav2"
description: "Why robotics adopted behavior trees from games — and how BehaviorTree.CPP, ROS 2, and the Nav2 navigation stack use them today, with the key differences from game-style trees."
pubDate: "2026-07-20"
order: 6
---

# Behavior Trees in Robotics

<div class="disclosure">Disclosure: some links on this page are affiliate links. If you buy
through them we may earn a commission at no extra cost to you.</div>

Behavior trees were born in games, but their second career is arguably bigger: they've
become a standard task-orchestration architecture in robotics. The ROS 2 **Nav2** navigation
stack — running on thousands of real robots — is driven by behavior trees, and
**BehaviorTree.CPP** has become the de-facto C++ library for robot mission logic.

If you're coming from gamedev, the concepts transfer directly
([intro here](/learn/what-is-a-behavior-tree/) if you need it). This guide covers what's
different on real hardware, and the concrete stack you'd use today.

## Why robotics switched from state machines

Robot task logic was traditionally FSMs (SMACH, FlexBE in ROS 1). The pain points that
drove the migration mirror [the gamedev comparison](/learn/behavior-trees-vs-state-machines/),
plus two robotics-specific ones:

- **Recovery behaviors everywhere.** Real robots fail constantly — grasps slip, paths get
  blocked, sensors drop out. BTs express "try this, and if it fails, try these fallbacks"
  natively with selectors and retry decorators, without wiring recovery transitions into
  every state.
- **Formal analyzability.** Robotics cares about provable properties (safety, robustness).
  The academic foundation — Colledanchise & Ögren's work — established BTs as a
  generalization of several classical control architectures, giving the field theoretical
  cover to standardize on them.

## BehaviorTree.CPP: the workhorse

[BehaviorTree.CPP](https://www.behaviortree.dev/) (by Davide Faconti) is a C++ library where
trees are defined in **XML** and leaf nodes are C++ classes registered by name:

```xml
<root BTCPP_format="4">
  <BehaviorTree ID="PickAndPlace">
    <Sequence>
      <Fallback>
        <Condition ID="IsHoldingObject"/>
        <Sequence>
          <Action ID="MoveToObject"/>
          <RetryUntilSuccessful num_attempts="3">
            <Action ID="GraspObject"/>
          </RetryUntilSuccessful>
        </Sequence>
      </Fallback>
      <Action ID="MoveToTarget"/>
      <Action ID="PlaceObject"/>
    </Sequence>
  </BehaviorTree>
</root>
```

Note the dialect: robotics says **Fallback** where games say Selector/Priority, and
BT.CPP distinguishes synchronous actions from long-running **stateful/async actions**
(equivalent to returning `Running`). It ships with **Groot2**, a visual editor/monitor
that can watch a live tree over a network connection — the robotics equivalent of a
debugger, and something you'll want from day one.

<a class="try-editor" href="/?example=robot-pick-and-place">▶ Explore this pick-and-place tree interactively</a>

## ROS 2 and Nav2: behavior trees in production

**Nav2**, the ROS 2 navigation framework, is the highest-profile BT deployment in robotics.
Its default "navigate to pose" logic is a behavior tree XML you can read and customize:
compute a path (with retries and rate throttling), follow it, and on failure run recovery
branches — clear costmaps, spin in place, back up, wait — in fallback order.

The practical superpower: **changing robot behavior means editing an XML tree, not
recompiling a node graph.** Want the robot to try re-planning five times before backing up?
Edit the tree. Fleet operators tune per-site behavior this way.

For manipulation and full-mission logic (patrol → inspect → dock → charge), teams compose
BT.CPP subtrees the same way — subtree reuse maps naturally onto "skills" a robot exposes.

## Game trees vs robot trees: what actually differs

| Aspect | Games | Robotics |
|--------|-------|----------|
| Tick source | Frame loop (30–60 Hz) | Explicit rate, often 10–100 Hz per tree |
| Leaves talk to | Engine/gameplay code | ROS actions/services, hardware drivers |
| Failure | A design case | The *common* case — recovery is the point |
| Long actions | Animation-length | Seconds to minutes (async is mandatory) |
| Authoring format | Editor-specific JSON / engine assets | XML (BT.CPP), often hand-edited |
| Verification | Playtesting | Simulation + formal analysis culture |

## Learning path

1. **The book:** *Behavior Trees in Robotics and AI: An Introduction* by Michele
   Colledanchise and Petter Ögren is the definitive text — rigorous but readable, and the
   authors maintain a [free preprint on arXiv](https://arxiv.org/abs/1709.00084)
   ([print edition on Amazon](https://www.amazon.com/s?k=Behavior+Trees+in+Robotics+and+AI&tag=behaviortrees-20)).
2. **Hands-on:** work through the [BehaviorTree.CPP tutorials](https://www.behaviortree.dev/docs/intro),
   then read Nav2's default behavior tree XMLs — they're short and production-grade.
3. **Design practice:** sketch your mission logic in the free
   [online behavior tree editor](/) before committing it to XML — structure mistakes are
   much cheaper to fix in a sketch.

## Related guides

- [What Is a Behavior Tree?](/learn/what-is-a-behavior-tree/)
- [Sequence, Selector, and Decorator Nodes Explained](/learn/behavior-tree-nodes-explained/)
- [Behavior Trees vs Finite State Machines](/learn/behavior-trees-vs-state-machines/)
