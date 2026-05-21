package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "states")
public class State {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code; // e.g. "MH", "DL"

    private String name;
    private String capital;
    private String description;
    private String culture;
    private String history;
    private String geography;
    private String population;
    private String area;
    private String language;
    private List<String> districts;
    private List<String> images;
    private String type; // "STATE" or "UT"

    private int notesCount = 0;
    private int questionsCount = 0;
    private int solutionsCount = 0;

    private Date createdAt;
    private Date updatedAt;

    public State() {
        this.createdAt = new Date();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCapital() { return capital; }
    public void setCapital(String capital) { this.capital = capital; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCulture() { return culture; }
    public void setCulture(String culture) { this.culture = culture; }

    public String getHistory() { return history; }
    public void setHistory(String history) { this.history = history; }

    public String getGeography() { return geography; }
    public void setGeography(String geography) { this.geography = geography; }

    public String getPopulation() { return population; }
    public void setPopulation(String population) { this.population = population; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public List<String> getDistricts() { return districts; }
    public void setDistricts(List<String> districts) { this.districts = districts; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getNotesCount() { return notesCount; }
    public void setNotesCount(int notesCount) { this.notesCount = notesCount; }

    public int getQuestionsCount() { return questionsCount; }
    public void setQuestionsCount(int questionsCount) { this.questionsCount = questionsCount; }

    public int getSolutionsCount() { return solutionsCount; }
    public void setSolutionsCount(int solutionsCount) { this.solutionsCount = solutionsCount; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
