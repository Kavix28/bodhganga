package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@Profile({ "dev", "test" })
public class QuestionSeedService implements CommandLineRunner {

        private final QuestionRepo questionRepo;

        public QuestionSeedService(QuestionRepo questionRepo) {
                this.questionRepo = questionRepo;
        }

        @Override
        public void run(String... args) {
                seedQuestions();
        }

        public void seedQuestions() {
                List<Question> questionsToSeed = new ArrayList<>();

                // 1. Bengaluru (Karnataka)
                questionsToSeed.addAll(generateBengaluruQuestions());
                // 2. Ernakulam (Kerala)
                questionsToSeed.addAll(generateErnakulamQuestions());
                // 3. Kargil (Ladakh)
                questionsToSeed.addAll(generateKargilQuestions());
                // 4. Anantnag (Jammu & Kashmir)
                questionsToSeed.addAll(generateAnantnagQuestions());
                // 5. Chatra (Jharkhand)
                questionsToSeed.addAll(generateChatraQuestions());
                // 6. Balod (Chhattisgarh)
                questionsToSeed.addAll(generateBalodQuestions());

                int count = 0;
                for (Question q : questionsToSeed) {
                        if (!questionRepo.existsById(q.getId())) {
                                q.setCreatedAt(Instant.now());
                                q.setUpdatedAt(Instant.now());
                                questionRepo.save(q);
                                count++;
                        }
                }
                System.out.println("Idempotent Question Seeding Completed. Newly inserted: " + count + " questions.");
        }

        private List<Question> generateBengaluruQuestions() {
                List<Question> list = new ArrayList<>();

                // Bengaluru Easy Questions
                String state = "karnataka";
                String dist = "bengaluru";
                list.add(createQ(state, dist, "easy", 1, "Geography", "Easy", "Begur is located in which state?",
                                Arrays.asList("Tamil Nadu", "Karnataka", "Andhra Pradesh", "Kerala"), 1,
                                "Begur is a locality in the southern part of Bengaluru, capital of Karnataka."));
                list.add(createQ(state, dist, "easy", 2, "Geography", "Easy", "Begur is located in which district?",
                                Arrays.asList("Mysuru", "Bengaluru Urban", "Dharwad", "Hassan"), 1,
                                "Begur is located in Bengaluru Urban district of Karnataka."));
                list.add(createQ(state, dist, "easy", 3, "Geography", "Easy",
                                "Krishnagiri District, which borders Bengaluru Urban District, belongs to which state?",
                                Arrays.asList("Kerala", "Andhra Pradesh", "Tamil Nadu", "Telangana"), 2,
                                "Krishnagiri is a district in Tamil Nadu bordering Bengaluru Urban District."));
                list.add(createQ(state, dist, "easy", 4, "History", "Easy",
                                "The Hebbal-Kittayya Hero Stone Inscription is associated with which dynasty?",
                                Arrays.asList("Chola", "Western Ganga", "Vijayanagara", "Hoysala"), 1,
                                "The Hebbal-Kittayya Hero Stone Inscription belongs to the Western Ganga dynasty period."));
                list.add(createQ(state, dist, "easy", 5, "History", "Easy",
                                "The Hebbal-Kittayya Hero Stone Inscription belongs to the reign of which king?",
                                Arrays.asList("Rajendra Chola", "Sripurusha", "Ekoji", "Krishnadevaraya"), 1,
                                "The inscription dates to the reign of Sripurusha of Western Ganga dynasty."));
                list.add(createQ(state, dist, "easy", 6, "History", "Easy",
                                "The Hebbal-Kittayya Hero Stone Inscription is dated to around:",
                                Arrays.asList("517 CE", "750 CE", "900 CE", "1043 CE"), 1,
                                "The Hebbal-Kittayya Hero Stone Inscription is dated to approximately 750 CE."));
                list.add(createQ(state, dist, "easy", 7, "History", "Easy",
                                "The Hebbal-Kittayya inscription is considered important because it is:",
                                Arrays.asList("The oldest intact Kannada inscription in Bengaluru city",
                                                "The first Mughal inscription in Bengaluru",
                                                "The first English inscription in Karnataka",
                                                "The first Portuguese record of Bengaluru"),
                                0,
                                "The Hebbal-Kittayya inscription holds significance as the oldest intact Kannada inscription found within Bengaluru city limits."));
                list.add(createQ(state, dist, "easy", 8, "History", "Easy",
                                "Kittayya is remembered in the inscription for:",
                                Arrays.asList("Building a temple", "Defending the Hebbal region",
                                                "Creating Pattandur Lake",
                                                "Donating Yelahanka village"),
                                1,
                                "Kittayya is commemorated in the hero stone inscription for his bravery in defending the Hebbal region."));
                list.add(createQ(state, dist, "easy", 9, "History", "Easy",
                                "Kittayya is considered the first documented resident of modern-day:",
                                Arrays.asList("Mysuru", "Bengaluru", "Chennai", "Hyderabad"), 1,
                                "Kittayya is regarded as the first documented resident of modern-day Bengaluru."));
                list.add(createQ(state, dist, "easy", 10, "History", "Easy",
                                "The Begur Inscription is associated with which dynasty?",
                                Arrays.asList("Western Ganga", "Chola", "Hoysala", "Mughal"), 0,
                                "The Begur Inscription is associated with the Western Ganga dynasty."));

                // Bengaluru Advanced Questions
                list.add(createQ(state, dist, "advanced", 1, "Geography", "Advanced",
                                "Hebbal is especially famous for which lake?",
                                Arrays.asList("Ulsoor", "Sankey", "Hebbal Lake", "Varthur Lake"), 2,
                                "Hebbal Lake is a well-known freshwater lake in the Hebbal area of Bengaluru."));
                list.add(createQ(state, dist, "advanced", 2, "History", "Advanced",
                                "The Kadugodi Inscription belongs to which dynasty?",
                                Arrays.asList("Chola Empire", "Western Ganga", "Vijayanagara Empire", "British Empire"),
                                0,
                                "The Kadugodi Inscription belongs to the Chola Empire period."));
                list.add(createQ(state, dist, "advanced", 3, "History", "Advanced",
                                "The Kadugodi Inscription is dated to:",
                                Arrays.asList("750 CE", "900 CE", "1043 CE", "1341 CE"), 2,
                                "The Kadugodi Inscription is dated to approximately 1043 CE."));
                list.add(createQ(state, dist, "advanced", 4, "Geography", "Advanced",
                                "Bengaluru Urban District does not have massive perennial rivers mainly because of its location on the:",
                                Arrays.asList("Coastal Plains", "South Deccan Plateau", "Thar Desert", "Eastern Ghats"),
                                1,
                                "Bengaluru sits on the South Deccan Plateau at an elevation of about 900m."));
                list.add(createQ(state, dist, "advanced", 5, "Geography", "Advanced",
                                "Bengaluru Urban District functions as a watershed divide mainly between which two river basins?",
                                Arrays.asList("Ganga and Yamuna", "Kaveri and Pennar", "Godavari and Krishna",
                                                "Narmada and Tapi"),
                                1,
                                "Bengaluru Urban District sits on a ridge that divides the Kaveri river basin and Pennar river basin."));

                return list;
        }

        private List<Question> generateErnakulamQuestions() {
                List<Question> list = new ArrayList<>();
                String state = "kerala";
                String dist = "ernakulam";
                list.add(createQ(state, dist, "easy", 1, "Geography", "Easy",
                                "Ernakulam District is located on which coast of India?",
                                Arrays.asList("Coromandel Coast", "Malabar Coast", "Konkan Coast", "Utkal Coast"), 1,
                                "Ernakulam is located on the Malabar Coast of Kerala."));
                list.add(createQ(state, dist, "easy", 2, "Geography", "Easy",
                                "Which major port city serves as the commercial hub of Ernakulam district?",
                                Arrays.asList("Kozhikode", "Kochi", "Thiruvananthapuram", "Kollam"), 1,
                                "Kochi is the principal commercial hub of Ernakulam district."));
                list.add(createQ(state, dist, "easy", 3, "Geography", "Easy",
                                "Which lake is the largest lake in Kerala located partly in Ernakulam district?",
                                Arrays.asList("Ashtamudi Lake", "Vembanad Lake", "Sasthamkotta Lake", "Periyar Lake"),
                                1,
                                "Vembanad Lake is India's longest lake bordering Ernakulam."));
                list.add(createQ(state, dist, "advanced", 1, "History", "Advanced",
                                "The historic Fort Kochi was established after the arrival of which European power in 1503?",
                                Arrays.asList("British", "Dutch", "Portuguese", "French"), 2,
                                "Fort Kochi was built by the Portuguese in 1503 with permission from the Rajah of Cochin."));
                list.add(createQ(state, dist, "advanced", 2, "Economy", "Advanced",
                                "Cochin International Airport (CIAL) is world-famous for being:",
                                Arrays.asList("The highest airport", "The first fully solar-powered airport",
                                                "The largest airport by land", "The oldest active airport"),
                                1, "CIAL is the world's first fully solar-powered airport."));
                return list;
        }

        private List<Question> generateKargilQuestions() {
                List<Question> list = new ArrayList<>();
                String state = "ladakh";
                String dist = "kargil";
                list.add(createQ(state, dist, "easy", 1, "Geography", "Easy",
                                "Kargil district is part of which Union Territory?",
                                Arrays.asList("Jammu & Kashmir", "Ladakh", "Himachal Pradesh", "Uttarakhand"), 1,
                                "Kargil is one of the two districts of the Union Territory of Ladakh."));
                list.add(createQ(state, dist, "easy", 2, "Geography", "Easy", "Which river flows through Kargil town?",
                                Arrays.asList("Indus", "Suru River", "Zanskar", "Shyok"), 1,
                                "The Suru River flows directly through Kargil town."));
                list.add(createQ(state, dist, "advanced", 1, "History", "Advanced",
                                "Operation Vijay in 1999 was launched to clear infiltrators from which region of Ladakh?",
                                Arrays.asList("Pangong Tso", "Kargil", "Nubra Valley", "Siachen Glacier"), 1,
                                "Operation Vijay was conducted in 1999 to clear Kargil sector of hostile forces."));
                return list;
        }

        private List<Question> generateAnantnagQuestions() {
                List<Question> list = new ArrayList<>();
                String state = "jammu-and-kashmir";
                String dist = "anantnag";
                list.add(createQ(state, dist, "easy", 1, "Geography", "Easy",
                                "Anantnag is located in which valley of Jammu and Kashmir?",
                                Arrays.asList("Chenab Valley", "Kashmir Valley", "Poonch Valley", "Suru Valley"), 1,
                                "Anantnag is located in the southern part of the Kashmir Valley."));
                list.add(createQ(state, dist, "advanced", 1, "Heritage", "Advanced",
                                "The ancient Martand Sun Temple in Anantnag was built by which ruler of the Karkota dynasty?",
                                Arrays.asList("Lalitaditya Muktapida", "Avantivarman", "Harsha", "Didda"), 0,
                                "Martand Sun Temple was constructed by Lalitaditya Muktapida in the 8th century CE."));
                return list;
        }

        private List<Question> generateChatraQuestions() {
                List<Question> list = new ArrayList<>();
                String state = "jharkhand";
                String dist = "chatra";
                list.add(createQ(state, dist, "easy", 1, "Geography", "Easy",
                                "Chatra district is located in which state of India?",
                                Arrays.asList("Bihar", "Jharkhand", "Odisha", "West Bengal"), 1,
                                "Chatra is a district in the state of Jharkhand."));
                list.add(createQ(state, dist, "advanced", 1, "Heritage", "Advanced",
                                "Itkhori in Chatra district is famous for the convergence of which three religions?",
                                Arrays.asList("Hinduism, Buddhism, Jainism", "Buddhism, Islam, Sikhism",
                                                "Hinduism, Christianity, Islam", "Jainism, Sikhism, Zoroastrianism"),
                                0,
                                "Itkhori (Bhadrakali Temple) is a unique sacred site for Hindus, Buddhists, and Jains."));
                return list;
        }

        private List<Question> generateBalodQuestions() {
                List<Question> list = new ArrayList<>();
                String state = "chhattisgarh";
                String dist = "balod";

                for (int i = 1; i <= 20; i++) {
                        String topic = Arrays.asList("Geography", "History", "Economy", "Administration", "Culture")
                                        .get((i - 1) % 5);
                        list.add(createQ(state, dist, "easy", i, topic, "Easy",
                                        "[Q" + i + "] Which key water reservoir / dam project is located in Balod district of Chhattisgarh?",
                                        Arrays.asList("Tandula Dam", "Gangrel Dam", "Hasdeo Bango Dam", "Kutaghat Dam"),
                                        0,
                                        "Tandula Dam was constructed across Tandula and Sukha rivers in 1912 and is a premier irrigation reservoir in Balod district."));
                }

                for (int i = 1; i <= 20; i++) {
                        String topic = Arrays.asList("Geography", "History", "Economy", "Administration", "Culture")
                                        .get((i - 1) % 5);
                        list.add(createQ(state, dist, "advanced", i, topic, "Advanced",
                                        "[Q" + i + "] Consider the following statements regarding the geological formation and mineral wealth of Balod District:\n1. Dalli Rajhara iron ore complex supplies hematite ore to Bhilai Steel Plant.\n2. The district belongs entirely to the Cuddapah sedimentary basin.\nWhich of the statements given above is/are correct?",
                                        Arrays.asList("1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"),
                                        0,
                                        "Statement 1 is correct: Dalli Rajhara in Balod provides high-grade iron ore to Bhilai Steel Plant. Statement 2 is incorrect as Archean granite and Dharwar metamorphic rocks dominate the iron ore ridge."));
                }

                for (int i = 1; i <= 75; i++) {
                        String topic = Arrays
                                        .asList("History", "Geography", "Rivers and dams", "Economy and agriculture",
                                                        "Art and culture", "Tribes and communities",
                                                        "Important personalities", "Administration")
                                        .get((i - 1) % 8);
                        String difficulty = (i % 3 == 0) ? "Easy" : (i % 3 == 1) ? "Moderate" : "Difficult";
                        list.add(createQ(state, dist, "master", i, topic, difficulty,
                                        "[Master Q" + i + "] Analytical Question on " + topic + " of Balod District",
                                        Arrays.asList("Option A: Primary historical attribute",
                                                        "Option B: Secondary geographical factor",
                                                        "Option C: Administrative landmark",
                                                        "Option D: Socio-cultural tradition"),
                                        0,
                                        "Comprehensive explanation detailing state administrative structures, tribal heritage, and physical geography of Balod district."));
                }

                return list;
        }

        private Question createQ(String stateSlug, String districtSlug, String testType, int qNum,
                        String topic, String difficulty, String questionText, List<String> options,
                        int correctAnswer, String explanation) {
                String deterministicId = stateSlug + "-" + districtSlug + "-" + testType + "-" + qNum;
                return Question.builder()
                                .id(deterministicId)
                                .stateSlug(stateSlug)
                                .districtSlug(districtSlug)
                                .testType(testType)
                                .questionNumber(qNum)
                                .topic(topic)
                                .difficulty(difficulty)
                                .question(questionText)
                                .options(options)
                                .correctAnswer(correctAnswer)
                                .explanation(explanation)
                                .isActive(true)
                                .build();
        }
}
