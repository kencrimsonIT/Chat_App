package com.messapp.backend.repository;

import com.messapp.backend.entity.Call;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallRepository extends JpaRepository<Call, Long> {

    List<Call> findByCallerIdOrCalleeIdOrderByCreatedAtDesc(Long callerId, Long calleeId);
}
