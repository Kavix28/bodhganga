package com.bodhganga.bodhganga.config;

import com.bodhganga.bodhganga.entity.Courses;
import com.bodhganga.bodhganga.repo.CourseRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Data loader to populate sample courses in the database on startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final CourseRepo courseRepo;

    @Override
    public void run(String... args) {
        // Check if courses already exist
        if (courseRepo.count() > 0) {
            log.info("Courses already exist in database. Skipping data load.");
            return;
        }

        log.info("Loading sample course data...");

        List<Courses> sampleCourses = Arrays.asList(
                createCourse(
                        "Introduction to Indian History",
                        "Explore the rich tapestry of Indian history from ancient civilizations to modern times. Learn about the Indus Valley Civilization, Mauryan Empire, Mughal Dynasty, and the Indian independence movement.",
                        "Dr. Ramesh Kumar",
                        "History",
                        40.0,
                        0.0,
                        "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800",
                        "Hindi/English",
                        45,
                        4.7,
                        1250),
                createCourse(
                        "Yoga and Meditation Fundamentals",
                        "Master the ancient practices of yoga and meditation. Learn asanas, pranayama, and meditation techniques to achieve physical, mental, and spiritual well-being.",
                        "Swami Ananda",
                        "Yoga & Wellness",
                        30.0,
                        0.0,
                        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
                        "Hindi/English",
                        32,
                        4.9,
                        2100),
                createCourse(
                        "Sanskrit Language Basics",
                        "Learn the foundation of Sanskrit, the ancient language of India. Master Devanagari script, basic grammar, and common phrases used in traditional texts.",
                        "Prof. Lakshmi Devi",
                        "Sanskrit",
                        50.0,
                        0.0,
                        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
                        "Hindi/English",
                        60,
                        4.5,
                        890),
                createCourse(
                        "Vedic Mathematics",
                        "Discover the ancient Indian system of mathematics. Learn mental calculation techniques from the Vedas that make complex calculations simple and fast.",
                        "Dr. Arvind Sharma",
                        "Mathematics",
                        25.0,
                        0.0,
                        "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800",
                        "Hindi/English",
                        28,
                        4.8,
                        1560),
                createCourse(
                        "Indian Classical Music",
                        "Explore the beauty of Indian classical music with Ragas, Talas, and traditional instruments like Sitar, Tabla, and Veena. Perfect for beginners.",
                        "Ustad Rahman Khan",
                        "Music",
                        45.0,
                        0.0,
                        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
                        "Hindi/English",
                        50,
                        4.6,
                        780),
                createCourse(
                        "Ayurveda and Natural Healing",
                        "Learn the principles of Ayurveda, India's ancient system of medicine. Understand doshas, natural remedies, and holistic health practices.",
                        "Vaidya Sunita Patel",
                        "Ayurveda",
                        35.0,
                        0.0,
                        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
                        "Hindi/English",
                        38,
                        4.7,
                        1340),
                createCourse(
                        "Bhagavad Gita Study",
                        "Deep dive into the teachings of the Bhagavad Gita. Understand karma yoga, bhakti yoga, and the path to self-realization through Lord Krishna's wisdom.",
                        "Swami Vidyananda",
                        "Philosophy",
                        42.0,
                        0.0,
                        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
                        "Hindi/English",
                        48,
                        4.9,
                        1920),
                createCourse(
                        "Indian Art and Sculpture",
                        "Explore the diverse art forms of India including temple architecture, bronze sculptures, miniature paintings, and contemporary Indian art.",
                        "Dr. Kavita Menon",
                        "Art",
                        30.0,
                        0.0,
                        "https://images.unsplash.com/photo-1580853039692-835f8d0a8b68?w=800",
                        "Hindi/English",
                        35,
                        4.6,
                        650),
                createCourse(
                        "Kathak Dance Basics",
                        "Learn the graceful moves of Kathak, one of India's eight classical dance forms. Master footwork, spins, and expressive storytelling through dance.",
                        "Guru Nandini Sharma",
                        "Dance",
                        40.0,
                        0.0,
                        "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800",
                        "Hindi/English",
                        44,
                        4.8,
                        920),
                createCourse(
                        "Traditional Indian Cooking",
                        "Master authentic Indian cuisine from different regions. Learn traditional recipes, spice blending, and cooking techniques passed down through generations.",
                        "Chef Anjali Verma",
                        "Cooking",
                        20.0,
                        0.0,
                        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
                        "Hindi/English",
                        25,
                        4.7,
                        1580));

        courseRepo.saveAll(sampleCourses);
        log.info("Successfully loaded {} sample courses", sampleCourses.size());
    }

    private Courses createCourse(String title, String description, String instructor,
            String category, double duration, double price,
            String thumbnail, String language, int lectures,
            double rating, int enrolled) {
        Courses course = new Courses();
        course.setId(UUID.randomUUID().toString());
        course.setCourseTitle(title);
        course.setDescription(description);
        course.setInstructorName(instructor);
        course.setCourseCategory(category);
        course.setCourseDuration(duration);
        course.setCoursePrice(price);
        course.setThumbnailUrl(thumbnail);
        course.setLanguage(language);
        course.setTotalLectures(lectures);
        course.setRating(rating);
        course.setEnrolledStudents(enrolled);
        course.setCreatedAt(new Date());
        course.setUpdatedAt(new Date());
        return course;
    }
}
