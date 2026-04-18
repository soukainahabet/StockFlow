package com.stockflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ventes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "vente", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<LigneVente> lignes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDateTime.now();
        }
    }

    public void addLigne(LigneVente ligne) {
        lignes.add(ligne);
        ligne.setVente(this);
    }

    public void removeLigne(LigneVente ligne) {
        lignes.remove(ligne);
        ligne.setVente(null);
    }
}
