// Tech stack data, grouped by category (FR-20, AC-20).
//
// Rules:
// - Capacity: at most 4 categories with at most 5 tools each.
// - name: at most 20 characters.
// - use: at most 40 characters.
// - id: unique across all categories.
// - icon: optional. Add it only when an owner-supplied logo exists.
// - tint: optional, `tint: true` tints the icon with the current text colour
//   (single-colour SVGs only).

import blenderIcon from "../assets/tech/blender.svg";
import unityIcon from "../assets/tech/unity.svg";
import godotIcon from "../assets/tech/godot.svg";
import unrealIcon from "../assets/tech/unreal-engine.svg";
import mayaIcon from "../assets/tech/maya.svg";
import csharpIcon from "../assets/tech/csharp.svg";
import pythonIcon from "../assets/tech/python.svg";
import javaIcon from "../assets/tech/java.svg";
import gdscriptIcon from "../assets/tech/gdscript.svg";
import reactIcon from "../assets/tech/react.svg";
import threejsIcon from "../assets/tech/threejs.svg";

export const techStack = [
  {
    id: "modeling",
    title: "Modeling",
    tools: [
      // Provenance: Simple Icons (CC0) logo, trademark of Blender Foundation, used to identify the tool only.
      { id: "blender", name: "Blender", use: "Modeling and texturing", icon: blenderIcon, tint: true },
      { id: "zbrush", name: "ZBrush", use: "Sculpting" },
      // Provenance: Simple Icons (CC0) logo, trademark of Autodesk, used to identify the tool only.
      { id: "maya", name: "Maya", use: "Modeling and rigging", icon: mayaIcon, tint: true },
      { id: "substance-3d-painter", name: "Substance 3D Painter", use: "PBR texturing" },
    ],
  },
  {
    id: "game-dev",
    title: "Game Dev",
    tools: [
      // Provenance: Simple Icons (CC0) logo, trademark of Unity Technologies, used to identify the tool only.
      { id: "unity", name: "Unity", use: "Game engine", icon: unityIcon, tint: true },
      // Provenance: Simple Icons (CC0) logo, trademark of the Godot Foundation, used to identify the tool only.
      { id: "godot", name: "Godot", use: "Game engine", icon: godotIcon, tint: true },
      // Provenance: Simple Icons (CC0) logo, trademark of Epic Games, used to identify the tool only.
      { id: "unreal-engine", name: "Unreal Engine 5", use: "Game engine", icon: unrealIcon, tint: true },
    ],
  },
  {
    id: "programming",
    title: "Programming",
    tools: [
      // Provenance: Devicon (MIT) logo, trademark of Microsoft, used to identify the tool only.
      { id: "csharp", name: "C#", use: "Unity scripting", icon: csharpIcon, tint: true },
      // Provenance: Simple Icons (CC0) logo, trademark of the Python Software Foundation, used to identify the tool only.
      { id: "python", name: "Python", use: "Tools and scripting", icon: pythonIcon, tint: true },
      // Provenance: Devicon (MIT) logo, trademark of Oracle, used to identify the tool only.
      { id: "java", name: "Java", use: "Programming", icon: javaIcon, tint: true },
      // Provenance: the Godot logo (Simple Icons, CC0), trademark of the Godot Foundation, used to identify the language only.
      { id: "gdscript", name: "GDScript", use: "Godot scripting", icon: gdscriptIcon, tint: true },
    ],
  },
  {
    id: "web",
    title: "Web",
    tools: [
      // Provenance: Simple Icons (CC0) logo, trademark of Meta Platforms, used to identify the tool only.
      { id: "react", name: "React", use: "Interface and tooling", icon: reactIcon, tint: true },
      // Provenance: Simple Icons (CC0) logo, trademark of the three.js authors, used to identify the tool only.
      { id: "threejs", name: "Three.js", use: "3D on the web", icon: threejsIcon, tint: true },
    ],
  },
];
