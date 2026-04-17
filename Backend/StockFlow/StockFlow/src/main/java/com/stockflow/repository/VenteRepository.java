package com.stockflow.repository;

import com.stockflow.model.Vente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VenteRepository extends JpaRepository<Vente, Long> {

    List<Vente> findAllByOrderByDateDesc();

    List<Vente> findByUserId(Long userId);

    List<Vente> findByDateBetween(LocalDateTime start, LocalDateTime end);
}
