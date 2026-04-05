package com.soom.backend.service;

import com.soom.backend.context.TenantContext;
import com.soom.backend.dto.request.CreateUserRequest;
import com.soom.backend.dto.request.UpdateUserRequest;
import com.soom.backend.dto.response.PageResponse;
import com.soom.backend.dto.response.UserResponse;
import com.soom.backend.entity.UserEntity;
import com.soom.backend.repository.UserRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUtil authUtil;
    private final EmailService emailService;

    public PageResponse<UserResponse> getAll(Pageable pageable, String search) {
        UUID tenantId = TenantContext.getTenantId();
        String searchParam = (search != null && !search.isEmpty()) ? "%" + search.toLowerCase() + "%" : null;
        Page<UserEntity> page = userRepository.findAllActive(tenantId, searchParam, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    public UserResponse createUser(CreateUserRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email sudah terdaftar");
        }

        if(userRepository.existsByName(request.getName())){
            throw new RuntimeException("Nama sudah terdaftar");
        }

        UserEntity user = new UserEntity();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());

        userRepository.save(user);

        return toResponse(user);
    }

    public UserEntity findById(UUID id){
        return userRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("User tidak ditemukan"));
    }

    public UserResponse updateUser(UpdateUserRequest request, UUID id){
        UserEntity user = findById(id);
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());
        userRepository.save(user);
        return toResponse(user);
    }

    public void deleteUser(UUID id){
        UserEntity user = findById(id);
        user.setIsDeleted(true);
        userRepository.save(user);
    }

    private UserResponse toResponse(UserEntity user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .build();
    }
}
