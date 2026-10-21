import { createContext, useContext } from "react";

export const CanvasStatusContext = createContext("idle");

export function useCanvasStatus() {
  return useContext(CanvasStatusContext);
}
