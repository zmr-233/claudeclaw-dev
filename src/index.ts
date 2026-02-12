import { start } from "./commands/start";
import { stop, stopAll } from "./commands/stop";
import { status } from "./commands/status";
import { telegram } from "./commands/telegram";

const args = process.argv.slice(2);
const command = args[0];

if (command === "--stop-all") {
  stopAll();
} else if (command === "--stop") {
  stop();
} else if (command === "status") {
  status(args.slice(1));
} else if (command === "telegram") {
  telegram();
} else {
  start();
}
