/** Fetch latest results, then recompute standings + bracket. Used by `npm run update` and CI. */
import { fetchResults } from "./fetch-results";
import { calculateStandings } from "./calculate-standings";
import { calculateLiveStandings } from "./calculate-live-standings";
import { calculateBracket } from "./calculate-bracket";

(async () => {
  await fetchResults();
  calculateStandings();
  calculateLiveStandings();
  calculateBracket();
})();
