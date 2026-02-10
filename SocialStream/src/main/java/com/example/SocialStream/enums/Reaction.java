package com.example.SocialStream.enums;

public enum Reaction {
    LIKE("👍"),
    LOVE("❤️"),
    HAHA("😂"),
    WOW("😮"),
    SAD("😢");

    private final String emoji;

    Reaction(String emoji){
        this.emoji = emoji;
    }

    public String getEmoji() {
        return emoji;
    }
}
