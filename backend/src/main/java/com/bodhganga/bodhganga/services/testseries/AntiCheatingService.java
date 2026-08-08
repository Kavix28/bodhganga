package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.dto.testseries.AntiCheatingEventDTO;
import com.bodhganga.bodhganga.entity.testseries.AntiCheatingLog;
import com.bodhganga.bodhganga.entity.testseries.TestSession;
import com.bodhganga.bodhganga.repo.testseries.AntiCheatingLogRepo;
import com.bodhganga.bodhganga.repo.testseries.TestSessionRepo;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AntiCheatingService {

    private final AntiCheatingLogRepo antiCheatingLogRepo;
    private final TestSessionRepo testSessionRepo;

    public AntiCheatingService(AntiCheatingLogRepo antiCheatingLogRepo, TestSessionRepo testSessionRepo) {
        this.antiCheatingLogRepo = antiCheatingLogRepo;
        this.testSessionRepo = testSessionRepo;
    }

    public boolean logSecurityEvent(AntiCheatingEventDTO dto, String userId, String userEmail) {
        Optional<TestSession> sessionOpt = testSessionRepo.findById(dto.getSessionId());
        if (sessionOpt.isEmpty()) return false;

        TestSession session = sessionOpt.get();
        AntiCheatingLog log = new AntiCheatingLog(
                session.getId(),
                userId,
                userEmail,
                session.getTestSeriesId(),
                dto.getEventType(),
                dto.getDetails(),
                dto.getClientIp(),
                dto.getUserAgent()
        );
        antiCheatingLogRepo.save(log);

        if ("TAB_SWITCH".equalsIgnoreCase(dto.getEventType()) || "FULLSCREEN_EXIT".equalsIgnoreCase(dto.getEventType())) {
            int currentSwitches = session.getTabSwitchCount() != null ? session.getTabSwitchCount() + 1 : 1;
            session.setTabSwitchCount(currentSwitches);
            if (currentSwitches >= 3) {
                session.setIsLocked(true);
                session.setLockReason("Exceeded maximum tab switch / focus loss limit (" + currentSwitches + ")");
            }
            testSessionRepo.save(session);
        }

        return true;
    }
}
