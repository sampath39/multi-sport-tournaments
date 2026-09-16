package com.tournament.rules;

import com.tournament.sport.SportCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class SportRulesRegistry {

    private final Map<SportCode, SportRulesEngine> engines = new EnumMap<>(SportCode.class);
    private final SportRulesEngine defaultEngine;

    public SportRulesRegistry(List<SportRulesEngine> engineList) {
        SportRulesEngine fallback = null;
        for (SportRulesEngine engine : engineList) {
            engines.put(engine.getSportCode(), engine);
            if (engine.getSportCode() == SportCode.CHESS) {
                fallback = engine;
            }
        }
        this.defaultEngine = (fallback != null) ? fallback : engineList.get(0);
        log.info("Initialized SportRulesRegistry with {} sport rule engines", engines.size());
    }

    public SportRulesEngine getEngine(SportCode code) {
        if (code == null) return defaultEngine;
        return engines.getOrDefault(code, defaultEngine);
    }

    public SportRulesEngine getEngine(String codeStr) {
        if (codeStr == null || codeStr.trim().isEmpty()) return defaultEngine;
        try {
            SportCode code = SportCode.valueOf(codeStr.trim().toUpperCase());
            return getEngine(code);
        } catch (IllegalArgumentException e) {
            return defaultEngine;
        }
    }
}
