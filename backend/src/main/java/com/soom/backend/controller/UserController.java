package com.soom.backend.controller;

import com.soom.backend.dto.request.CreateUserRequest;
import com.soom.backend.dto.request.UpdateUserRequest;
import com.soom.backend.dto.response.BaseResponse;
import com.soom.backend.dto.response.UserResponse;
import com.soom.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('admin')")
    @GetMapping
    public ResponseEntity<BaseResponse<List<UserResponse>>> getAll(){
        return ResponseEntity.ok(BaseResponse.<List<UserResponse>>builder()
                .success(true)
                .message("OK")
                .data(userService.getAll())
                .build());
    }

    @PreAuthorize("hasRole('admin')")
    @PostMapping
    public ResponseEntity<BaseResponse<UserResponse>> create(
            @Valid @RequestBody CreateUserRequest request){
        return ResponseEntity.ok(BaseResponse.<UserResponse>builder()
                .success(true)
                .message("User berhasil dibuat")
                .data(userService.createUser(request))
                .build());
    }

    @PreAuthorize("hasRole('admin')")
    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<UserResponse>> update(
            @Valid @RequestBody UpdateUserRequest request,
            @PathVariable UUID id) {
        return ResponseEntity.ok(BaseResponse.<UserResponse>builder()
                .success(true)
                .message("User berhasil diupdate")
                .data(userService.updateUser(request,id))
                .build());
    }

    @PreAuthorize("hasRole('admin')")
    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
                .success(true)
                .message("Unit berhasil dihapus")
                .data(null)
                .build());
    }
}
