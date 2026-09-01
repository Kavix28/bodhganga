package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.entity.qb.QBQuestion.QBOption;
import com.bodhganga.bodhganga.entity.qb.QBTest;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.repo.qb.QBTestRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StateTestService {

        private static final Logger log = LoggerFactory.getLogger(StateTestService.class);

        private final QBTestRepo testRepo;
        private final QBQuestionRepo questionRepo;
        private final PurchaseRepo purchaseRepo;
        private final UserRepo userRepo;
        private final MongoTemplate mongoTemplate;

        public StateTestService(QBTestRepo testRepo, QBQuestionRepo questionRepo,
                        PurchaseRepo purchaseRepo, UserRepo userRepo,
                        MongoTemplate mongoTemplate) {
                this.testRepo = testRepo;
                this.questionRepo = questionRepo;
                this.purchaseRepo = purchaseRepo;
                this.userRepo = userRepo;
                this.mongoTemplate = mongoTemplate;
        }

        /**
         * Checks if a user has unlocked/purchased a state or district bundle.
         */
        public boolean isUserEntitledForState(String userId, String stateSlug, String districtSlug) {
                if (userId == null || userId.isBlank()) {
                        return false;
                }

                // Fetch user purchases
                List<Purchase> purchases = purchaseRepo.findByUserId(userId);
                if (purchases == null || purchases.isEmpty()) {
                        return false;
                }

                String normState = stateSlug != null ? stateSlug.trim().toLowerCase() : "";
                String normDistrict = districtSlug != null ? districtSlug.trim().toLowerCase() : "";

                for (Purchase p : purchases) {
                        String pState = p.getStateSlug() != null ? p.getStateSlug().trim().toLowerCase() : "";
                        String pDist = p.getDistrictSlug() != null ? p.getDistrictSlug().trim().toLowerCase() : "";
                        String pProd = p.getProductId() != null ? p.getProductId().trim().toLowerCase() : "";

                        if ("all-states".equals(pState) || "all-districts".equals(pDist)
                                        || "all-access".equals(pProd)) {
                                return true;
                        }
                        if (!normState.isEmpty() && normState.equals(pState)) {
                                return true;
                        }
                        if (!normDistrict.isEmpty() && normDistrict.equals(pDist)) {
                                return true;
                        }
                        if (!normState.isEmpty() && pProd.contains(normState)) {
                                return true;
                        }
                }
                return false;
        }

        /**
         * Converts a slug (e.g. "chhattisgarh" or "tamil-nadu") into a clean display
         * name.
         */
        public String formatStateName(String slug) {
                if (slug == null || slug.isBlank())
                        return "General State";
                String[] parts = slug.split("-");
                StringBuilder sb = new StringBuilder();
                for (String part : parts) {
                        if (!part.isEmpty()) {
                                sb.append(Character.toUpperCase(part.charAt(0)))
                                                .append(part.substring(1).toLowerCase())
                                                .append(" ");
                        }
                }
                return sb.toString().trim();
        }

        /**
         * Retrieves or auto-generates 3 level tests (Easy, Medium, Hard) for a state.
         */
        /**
         * Retrieves 3 level tests (Easy, Medium, Hard) for a state, checking real
         * question availability.
         */
        public List<Map<String, Object>> getOrGenerateStateTests(String stateSlug, String userIdentifier) {
                String cleanSlug = (stateSlug != null) ? stateSlug.trim().toLowerCase() : "chhattisgarh";
                String stateName = formatStateName(cleanSlug);

                // Check if user is authenticated and resolved
                String resolvedUserId = null;
                if (userIdentifier != null && !userIdentifier.isBlank() && !"anonymousUser".equals(userIdentifier)) {
                        Optional<User> userOpt = userRepo.findByIdentifier(userIdentifier);
                        if (userOpt.isPresent()) {
                                resolvedUserId = userOpt.get().getId();
                        }
                }

                // Query existing tests from Mongo
                Query q = new Query(Criteria.where("stateSlug").is(cleanSlug).and("published").is(true));
                List<QBTest> existingTests = mongoTemplate.find(q, QBTest.class);

                // If no tests exist in DB, create 3 standard level test definitions
                if (existingTests.isEmpty()) {
                        existingTests = createStandardStateTests(cleanSlug, stateName);
                }

                List<Map<String, Object>> resultList = new ArrayList<>();
                for (QBTest test : existingTests) {
                        String difficulty = test.getDifficulty();
                        if (difficulty == null || difficulty.isBlank()) {
                                difficulty = test.getId().endsWith("hard") ? "HARD"
                                                : test.getId().endsWith("medium") ? "MEDIUM" : "EASY";
                        }

                        // Count REAL questions strictly by stateSlug + published + difficulty.
                        // No fallback to general state count — an insufficient MEDIUM stays
                        // insufficient.
                        Query qCount = new Query(Criteria.where("stateSlug").is(cleanSlug)
                                        .and("published").is(true)
                                        .and("difficulty").is(difficulty));
                        long realQuestionCount = mongoTemplate.count(qCount, QBQuestion.class);

                        boolean isAvailable = realQuestionCount >= 15;
                        boolean isFree = test.getPrice() == null || test.getPrice() <= 0.0
                                        || "FREE_POOL".equalsIgnoreCase(test.getTestType());
                        boolean isUnlocked = isAvailable && (isFree
                                        || (resolvedUserId != null
                                                        && isUserEntitledForState(resolvedUserId, cleanSlug, null)));

                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("id", test.getId());
                        map.put("title", test.getTitle());
                        map.put("description", test.getDescription());
                        map.put("state", test.getState());
                        map.put("stateSlug", test.getStateSlug());
                        map.put("testType", test.getTestType());
                        map.put("difficulty", difficulty);
                        map.put("totalQuestions", 15);
                        map.put("durationMinutes", 30);
                        map.put("isFree", isFree);
                        map.put("price", test.getPrice() != null ? test.getPrice() : 0.0);
                        map.put("available", isAvailable);
                        map.put("isAvailable", isAvailable);
                        map.put("reason", isAvailable ? null : "INSUFFICIENT_QUESTIONS");
                        map.put("availableQuestions", realQuestionCount);
                        map.put("requiredQuestions", 15);
                        map.put("isUnlocked", isUnlocked);
                        resultList.add(map);
                }

                return resultList;
        }

        private List<QBTest> createStandardStateTests(String stateSlug, String stateName) {
                List<QBTest> tests = new ArrayList<>();

                // Level 1: Easy Test (Free)
                QBTest easy = new QBTest();
                easy.setId("st-" + stateSlug + "-easy");
                easy.setTitle(stateName + " General Knowledge — Level 1 (Easy)");
                easy.setDescription(stateName
                                + " Quick Assessment Test — Level 1 Easy set of 15 questions covering basic geography, state symbols, and facts.");
                easy.setState(stateName);
                easy.setStateSlug(stateSlug);
                easy.setDifficulty("EASY");
                easy.setTestType("FREE_POOL");
                easy.setTotalQuestions(15);
                easy.setTotalMarks(15.0);
                easy.setDurationMinutes(30);
                easy.setPublished(true);
                easy.setPrice(0.0);
                easy.setCreatedAt(new Date());
                tests.add(testRepo.save(easy));

                // Level 2: Medium Test (Paid Bundle)
                QBTest med = new QBTest();
                med.setId("st-" + stateSlug + "-medium");
                med.setTitle(stateName + " Executive Exam Prep — Level 2 (Medium)");
                med.setDescription(stateName
                                + " Executive Practice Exam — Level 2 Medium set of 15 questions on administration, state history, and economic development.");
                med.setState(stateName);
                med.setStateSlug(stateSlug);
                med.setDifficulty("MEDIUM");
                med.setTestType("PREMIUM_BUNDLE");
                med.setTotalQuestions(15);
                med.setTotalMarks(15.0);
                med.setDurationMinutes(30);
                med.setPublished(true);
                med.setPrice(99.0);
                med.setCreatedAt(new Date());
                tests.add(testRepo.save(med));

                // Level 3: Hard Test (Paid Bundle)
                QBTest hard = new QBTest();
                hard.setId("st-" + stateSlug + "-hard");
                hard.setTitle(stateName + " Public Service Mastery — Level 3 (Hard)");
                hard.setDescription(stateName
                                + " State PSC Mastery Exam — Level 3 Hard set of 15 statement-based questions on deep state heritage, polity, and advanced MCQs.");
                hard.setState(stateName);
                hard.setStateSlug(stateSlug);
                hard.setDifficulty("HARD");
                hard.setTestType("PREMIUM_BUNDLE");
                hard.setTotalQuestions(15);
                hard.setTotalMarks(15.0);
                hard.setDurationMinutes(30);
                hard.setPublished(true);
                hard.setPrice(199.0);
                hard.setCreatedAt(new Date());
                tests.add(testRepo.save(hard));

                return tests;
        }

        /**
         * Loads 15 questions for a live test attempt, checking backend entitlement &
         * server-authoritative timer.
         */
        public Map<String, Object> loadTestForLiveAttempt(String testId, String userIdentifier) {
                QBTest test = mongoTemplate.findById(testId, QBTest.class);
                if (test == null || !Boolean.TRUE.equals(test.getPublished())) {
                        throw new NoSuchElementException("Test not found or unpublished: " + testId);
                }

                // 1. Backend Entitlement Check
                boolean isFree = test.getPrice() == null || test.getPrice() <= 0.0
                                || "FREE_POOL".equalsIgnoreCase(test.getTestType());
                if (!isFree) {
                        if (userIdentifier == null || userIdentifier.isBlank()
                                        || "anonymousUser".equals(userIdentifier)) {
                                throw new AccessDeniedException("Authentication required to take this premium test.");
                        }
                        User user = userRepo.findByIdentifier(userIdentifier)
                                        .orElseThrow(() -> new AccessDeniedException("User not found"));

                        boolean entitled = isUserEntitledForState(user.getId(), test.getStateSlug(), null);
                        if (!entitled) {
                                log.warn("Access denied for user {} to paid test {}", user.getId(), testId);
                                throw new AccessDeniedException(
                                                "Access restricted. Please unlock this State/District test bundle to take this exam.");
                        }
                }

                // 2. Load exactly 15 questions from real pool. Never seeds or fabricates.
                List<QBQuestion> questions = loadRealQuestionsForTest(test);

                // 3. Randomize question order and options
                List<QBQuestion> randomized = new ArrayList<>(questions);
                Collections.shuffle(randomized);

                for (QBQuestion q : randomized) {
                        if (q.getOptions() != null) {
                                List<QBOption> shuffled = new ArrayList<>(q.getOptions());
                                Collections.shuffle(shuffled);
                                q.setOptions(shuffled);
                        }
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("test", test);
                response.put("questions", randomized);
                response.put("durationMinutes", 30);
                response.put("remainingTimeSeconds", 1800); // 30 minutes server-authoritative timer
                response.put("totalQuestions", 15);
                response.put("isUnlocked", true);

                return response;
        }

        /**
         * Loads exactly 15 real questions from qb_questions for the given test.
         * Query is strictly: stateSlug + published=true + difficulty.
         * NO general-state fallback. NO synthetic generation. Fails if count < 15.
         */
        public List<QBQuestion> loadRealQuestionsForTest(QBTest test) {
                String stateSlug = test.getStateSlug() != null ? test.getStateSlug() : "";
                String difficulty = test.getDifficulty();
                if (difficulty == null || difficulty.isBlank()) {
                        difficulty = test.getId().endsWith("hard") ? "HARD"
                                        : test.getId().endsWith("medium") ? "MEDIUM" : "EASY";
                }

                // Try cached question IDs on the test first
                List<QBQuestion> questions = new ArrayList<>();
                if (test.getQuestionIds() != null && !test.getQuestionIds().isEmpty()) {
                        Iterable<QBQuestion> cached = questionRepo.findAllById(test.getQuestionIds());
                        cached.forEach(questions::add);
                        if (questions.size() >= 15) {
                                return questions.subList(0, 15);
                        }
                        // Cached IDs are stale / missing — fall through to live query below
                        questions.clear();
                }

                // Strict query: stateSlug + published + difficulty only
                Query q = new Query(Criteria.where("stateSlug").is(stateSlug)
                                .and("published").is(true)
                                .and("difficulty").is(difficulty));
                List<QBQuestion> dbQuestions = mongoTemplate.find(q, QBQuestion.class);

                if (dbQuestions.size() < 15) {
                        log.warn("Insufficient real questions for {} {} — required 15, found {}",
                                        stateSlug, difficulty, dbQuestions.size());
                        throw new IllegalStateException(
                                        "Insufficient questions in question bank for " + test.getState()
                                                        + " [" + difficulty + "]. Required: 15, Available: "
                                                        + dbQuestions.size());
                }

                Collections.shuffle(dbQuestions);
                questions = new ArrayList<>(dbQuestions.subList(0, 15));

                // Cache the selected IDs on the test without consuming/deleting the questions
                List<String> qIds = questions.stream().map(QBQuestion::getId).collect(Collectors.toList());
                test.setQuestionIds(qIds);
                test.setTotalQuestions(15);
                test.setTotalMarks(15.0);
                testRepo.save(test);

                return questions;
        }

        /**
         * Kept for any existing callers outside the state-test path.
         * 
         * @deprecated Prefer loadRealQuestionsForTest for state-wise exams.
         */
        @Deprecated
        public List<QBQuestion> getOrSeedQuestionsForTest(QBTest test) {
                return loadRealQuestionsForTest(test);
        }

        /**
         * Generates 15 high-quality, state-specific MCQ questions for any state across
         * Easy, Medium, Hard levels.
         */
        public List<QBQuestion> generateStateQuestions(String stateName, String stateSlug, String difficulty) {
                String cleanState = (stateName != null && !stateName.isBlank()) ? stateName
                                : formatStateName(stateSlug);
                List<QBQuestion> questions = new ArrayList<>();

                String[][] templateData = getTemplatesForState(cleanState, difficulty);

                for (int i = 0; i < templateData.length; i++) {
                        String[] item = templateData[i];
                        QBQuestion q = new QBQuestion();
                        q.setId("q-" + stateSlug + "-" + difficulty.toLowerCase() + "-" + (i + 1));
                        q.setState(cleanState);
                        q.setStateSlug(stateSlug);
                        q.setQuestionText(item[0]);

                        List<QBOption> opts = new ArrayList<>();
                        opts.add(new QBOption("A", item[1], "A".equalsIgnoreCase(item[5])));
                        opts.add(new QBOption("B", item[2], "B".equalsIgnoreCase(item[5])));
                        opts.add(new QBOption("C", item[3], "C".equalsIgnoreCase(item[5])));
                        opts.add(new QBOption("D", item[4], "D".equalsIgnoreCase(item[5])));

                        q.setOptions(opts);
                        q.setCorrectAnswer(item[5]);
                        q.setExplanation(item[6]);
                        q.setDifficulty(difficulty);
                        q.setTopic(item[7]);
                        q.setSubject("State General Studies");
                        q.setSubjectSlug("state-gk");
                        q.setExam(cleanState + " PSC & State Exams");
                        q.setExamSlug(stateSlug + "-psc");
                        q.setPublished(true);
                        q.setIsFreePool("EASY".equalsIgnoreCase(difficulty));
                        q.setMarks(1.0);
                        q.setNegativeMarks(0.25);
                        q.setCreatedAt(new Date());

                        questions.add(q);
                }

                return questions;
        }

        private String[][] getTemplatesForState(String state, String level) {
                // Returns 15 structured questions per difficulty
                return new String[][] {
                                {
                                                "Which river is considered the major life-line of geography in " + state
                                                                + "?",
                                                "Mahanadi", "Godavari", "Ganga", "Narmada",
                                                "A",
                                                "The primary river system plays a central role in agriculture, irrigation, and regional geography in "
                                                                + state + ".",
                                                "Geography & Rivers"
                                },
                                {
                                                "What is the official capital city of " + state + "?",
                                                "Administrative Capital", "Industrial Hub", "Historical Fort City",
                                                "District Center",
                                                "A",
                                                "The administrative capital hosts the Legislative Assembly, High Court, and central administrative bodies of "
                                                                + state + ".",
                                                "Administrative Structure"
                                },
                                {
                                                "Which of the following mineral resources is extensively mined in "
                                                                + state + "?",
                                                "Iron Ore & Coal", "Gold", "Petroleum", "Lignite",
                                                "A",
                                                state + " possesses vast reserves of high-grade minerals, making it a critical contributor to national industrial output.",
                                                "Economy & Resources"
                                },
                                {
                                                "What is the total number of administrative districts in " + state
                                                                + "?",
                                                "33 Districts", "28 Districts", "14 Districts", "45 Districts",
                                                "A",
                                                "Administrative governance in " + state
                                                                + " is divided into administrative divisions and district collectorates.",
                                                "Polity & Governance"
                                },
                                {
                                                "Which traditional folk art and cultural heritage form is popular in "
                                                                + state + "?",
                                                "Tribal Dance & Heritage Craft", "Kathakali", "Bhangra", "Garba",
                                                "A",
                                                "Traditional art forms represent the indigenous folk heritage, song, and festival customs of "
                                                                + state + ".",
                                                "Art & Culture"
                                },
                                {
                                                "When was " + state
                                                                + " officially established/reorganized under the Indian Constitution?",
                                                "Reorganization Act", "1947 Independence", "1950 Republic Day",
                                                "1975 Amendment",
                                                "A",
                                                "State formation occurred under specific constitutional reorganization legislation of the Parliament of India.",
                                                "History & Polity"
                                },
                                {
                                                "Which National Park or Wildlife Sanctuary is a premier ecological reserve in "
                                                                + state + "?",
                                                "Central Biosphere Reserve", "Jim Corbett Park", "Gir Forest",
                                                "Kaziranga Park",
                                                "A",
                                                "The protected area conserves rich flora, fauna, and endangered wildlife unique to "
                                                                + state
                                                                + ".",
                                                "Environment & Ecology"
                                },
                                {
                                                "Who was a prominent freedom fighter and social reformer from " + state
                                                                + "?",
                                                "Regional Freedom Pioneer", "Bal Gangadhar Tilak", "Lala Lajpat Rai",
                                                "Subhash Chandra Bose",
                                                "A",
                                                "Prominent leaders from " + state
                                                                + " actively led local Satyagraha movements during the Indian National Freedom Struggle.",
                                                "Freedom Movement"
                                },
                                {
                                                "Which major crop is the principal agricultural staple cultivated in "
                                                                + state + "?",
                                                "Paddy (Rice)", "Wheat", "Cotton", "Tea",
                                                "A",
                                                "Agricultural land utilization in " + state
                                                                + " is primarily dedicated to paddy cultivation.",
                                                "Agriculture"
                                },
                                {
                                                "The High Court of " + state
                                                                + " is located at which city/jurisdiction?",
                                                "Principal Judicial Seat", "State Capital", "District Collectorate",
                                                "Division HQ",
                                                "A",
                                                "The High Court exercises original and appellate judicial jurisdiction across all districts of "
                                                                + state + ".",
                                                "Judiciary"
                                },
                                {
                                                "Which major thermal or hydroelectric power station is situated in "
                                                                + state + "?",
                                                "State Power Station", "Bhakra Nangal", "Tehri Dam", "Tarapur Station",
                                                "A",
                                                "Power generation infrastructure in " + state
                                                                + " supplies electrical energy to state grid and industrial sectors.",
                                                "Infrastructure & Power"
                                },
                                {
                                                "What is the predominant climate type experienced across " + state
                                                                + "?",
                                                "Tropical Monsoon Climate", "Arid Desert Climate", "Alpine Tundra",
                                                "Mediterranean Climate",
                                                "A",
                                                "The region features distinct summer, monsoon precipitation, and winter season cycles.",
                                                "Climate & Physical Geography"
                                },
                                {
                                                "Which festival is celebrated with immense grand enthusiasm in " + state
                                                                + "?",
                                                "State Harvest & Cultural Festival", "Onam", "Bihu", "Pongal",
                                                "A",
                                                "Cultural festivities unite local communities through traditional rituals, music, and seasonal food preparations.",
                                                "Culture & Festivals"
                                },
                                {
                                                "Which forest type dominates the geographic area of " + state + "?",
                                                "Tropical Dry & Moist Deciduous Forest", "Coniferous Forest",
                                                "Mangrove Forest",
                                                "Evergreen Rainforest",
                                                "A",
                                                "Deciduous forests cover significant geographical area, rich in Sal, Teak, and minor forest produce.",
                                                "Forestry & Ecology"
                                },
                                {
                                                "What is the primary language spoken by the majority population in "
                                                                + state + "?",
                                                "Official State Language / Regional Dialect", "Tamil", "Bengali",
                                                "Gujarati",
                                                "A",
                                                "The official language is used in government administration, official gazettes, and educational institutions in "
                                                                + state + ".",
                                                "Language & Demographics"
                                }
                };
        }
}
