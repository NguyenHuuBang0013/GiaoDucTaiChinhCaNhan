package vn.edu.finance.exception;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.*;

@RestControllerAdvice
public class ErrorAdvice {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> known(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("error", e.getReason() == null ? "Yêu cầu không hợp lệ" : e.getReason()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<?> invalid(org.springframework.web.bind.MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error",
                        "Dữ liệu không hợp lệ: " + e.getBindingResult().getFieldErrors().stream()
                                .map(x -> x.getField() + " " + x.getDefaultMessage()).findFirst()
                                .orElse("Thiếu trường bắt buộc")));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(409)
                .body(Map.of("error", "Dữ liệu đang được sử dụng hoặc vi phạm ràng buộc. Vui lòng kiểm tra lại."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> db(DataAccessException e) {
        return ResponseEntity.status(500).body(Map.of("error", "Lỗi truy cập cơ sở dữ liệu. Vui lòng thử lại."));
    }
}
