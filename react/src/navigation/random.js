export { uniform, by_population };
import "../style.css";
import "../common.css";
import { article_link } from '../navigation/links';

import { loadJSON } from '../load_json.js';
import { is_historical_cd } from "../utils/is_historical";


function by_population(settings) {
    let values = loadJSON("/index/pages.json");
    let populations = loadJSON("/index/population.json");
    var totalWeight = populations.reduce(function (sum, x) {
        return sum + x;
    }, 0);

    while (true) {
        // Generate a random number between 0 and the total weight
        var randomValue = Math.random() * totalWeight;

        // Find the destination based on the random value
        var x = null;
        var cumulativeWeight = 0;

        for (var i = 0; i < values.length; i++) {
            cumulativeWeight += populations[i];

            if (randomValue < cumulativeWeight) {
                x = values[i];
                break;
            }
        }

        if (!settings.show_historical_cds && is_historical_cd(x)) {
            continue;
        }

        document.location = article_link(x);
        break;
    }
}

function uniform(settings) {
    let values = loadJSON("/index/pages.json");
    while (true) {
        var randomIndex = Math.floor(Math.random() * values.length);
        let x = values[randomIndex];
        if (!settings.show_historical_cds && is_historical_cd(x)) {
            continue;
        }
        document.location = article_link(x);
        break;
    }
}