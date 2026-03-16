package com.soom.backend.service;

import com.soom.backend.dto.request.CreateUserRequest;
import com.soom.backend.dto.response.AuthResponse;
import com.soom.backend.dto.response.UserResponse;
import com.soom.backend.entity.UserEntity;
import com.soom.backend.repository.UserRepository;
import com.soom.backend.utils.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUtil authUtil;


    public List<UserResponse> getAll(){
        return userRepository.findAll()
                .stream()
                .filter(user -> !user.getIsDeleted())
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .isActive(user.getIsActive())
                        .build())
                .toList();
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

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public UserEntity findById(UUID id){
        return userRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("User tidak ditemukan"));
    }

    public UserResponse updateUser(CreateUserRequest request, UUID id){
        UserEntity user = findById(id);
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());
        userRepository.save(user);
        return UserResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .id(user.getId())
                .build();
    }

    public void deleteUser(UUID id){
        UserEntity user = findById(id);
        user.setIsDeleted(true);
        userRepository.save(user);
    }

}
