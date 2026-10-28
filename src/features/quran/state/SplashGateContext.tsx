import { createContext, useContext } from "react";

/**
 * True once the splash intro has let go of the 3D renderer (or when there is no splash).
 *
 * The garden screen sits under the splash from the first frame. Its own 3D sun and plant used
 * to start building their scenes at the same time as the splash book, and three WebGL loops
 * sharing the JS thread made the intro slow and late. They now wait for this gate.
 * The default is `true`, so anything rendered without the provider behaves as before.
 */
const SplashGateContext = createContext(true);

export const SplashGateProvider = SplashGateContext.Provider;

export function useSplashGate(): boolean {
  return useContext(SplashGateContext);
}
