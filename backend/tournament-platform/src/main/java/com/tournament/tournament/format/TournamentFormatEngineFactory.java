package com.tournament.tournament.format;

import com.tournament.tournament.TournamentFormat;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Factory and registry for tournament format engines.
 * Dispatches Swiss, Knockout (Single Elimination), and Round Robin requests
 * to their dedicated multi-sport engines.
 */
@Slf4j
@Component
public class TournamentFormatEngineFactory {

    private final Map<TournamentFormat, TournamentFormatEngine> engines = new EnumMap<>(TournamentFormat.class);
    private final TournamentFormatEngine defaultEngine;

    public TournamentFormatEngineFactory(List<TournamentFormatEngine> engineList) {
        TournamentFormatEngine fallback = null;
        for (TournamentFormatEngine engine : engineList) {
            if (engine instanceof SwissFormatEngine) {
                engines.put(TournamentFormat.SWISS, engine);
                fallback = engine;
            } else if (engine instanceof KnockoutFormatEngine) {
                engines.put(TournamentFormat.KNOCKOUT, engine);
                engines.put(TournamentFormat.SINGLE_ELIMINATION, engine);
                engines.put(TournamentFormat.DOUBLE_ELIMINATION, engine);
                engines.put(TournamentFormat.GROUP_STAGE_KNOCKOUT, engine);
            } else if (engine instanceof RoundRobinFormatEngine) {
                engines.put(TournamentFormat.ROUND_ROBIN, engine);
                engines.put(TournamentFormat.DOUBLE_ROUND_ROBIN, engine);
            } else {
                engines.putIfAbsent(engine.getFormat(), engine);
            }
        }
        this.defaultEngine = (fallback != null) ? fallback : engineList.get(0);
        log.info("Initialized TournamentFormatEngineFactory with {} engines", engines.size());
    }

    public TournamentFormatEngine getEngine(TournamentFormat format) {
        if (format == null) {
            return defaultEngine;
        }

        TournamentFormatEngine engine = engines.get(format);
        if (engine != null) {
            return engine;
        }

        if (format == TournamentFormat.SINGLE_ELIMINATION || format == TournamentFormat.KNOCKOUT
            || format == TournamentFormat.DOUBLE_ELIMINATION || format == TournamentFormat.GROUP_STAGE_KNOCKOUT) {
            return engines.getOrDefault(TournamentFormat.KNOCKOUT,
                   engines.getOrDefault(TournamentFormat.SINGLE_ELIMINATION, defaultEngine));
        }
        if (format == TournamentFormat.DOUBLE_ROUND_ROBIN) {
            return engines.getOrDefault(TournamentFormat.ROUND_ROBIN, defaultEngine);
        }

        return defaultEngine;
    }
}
