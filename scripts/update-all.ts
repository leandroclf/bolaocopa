/** Fetch latest results, then recompute standings. Used by `npm run update` and CI. */
import { fetchResults } from "./fetch-results";
import { calculateStandings } from "./calculate-standings";

(async () => {
  await fetchResults();
  calculateStandings();
})();
