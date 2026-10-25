package com.guesthub.favorite;

import com.guesthub.guesthouse.Guesthouse;
import com.guesthub.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorites")
@Getter
@Setter
@NoArgsConstructor
public class Favorite {

    @EmbeddedId
    private FavoriteId id;

    @MapsId("userId")
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @MapsId("guesthouseId")
    @ManyToOne(optional = false)
    @JoinColumn(name = "guesthouse_id")
    private Guesthouse guesthouse;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
