import {isLocal} from "../environment";
import {EpsClient} from "./base-eps-client";
import {LiveEpsClient} from "./live-eps-client";
import {SandboxEpsClient} from "./sandbox-eps-client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getEpsClient(accessToken: string): EpsClient {
    return isLocal()
      ? new SandboxEpsClient()
      : new LiveEpsClient(accessToken)
  }