import {vi} from "vitest"

globalThis.jest = vi as unknown as typeof globalThis.jest
