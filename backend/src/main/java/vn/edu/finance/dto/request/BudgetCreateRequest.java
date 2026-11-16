
package vn.edu.finance.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BudgetCreateRequest(

    @NotBlank(message = "Tên ngân sách không được để trống")
    String name,

    @NotNull(message = "Ngày bắt đầu không được để trống")
    LocalDate start_date,

    @NotNull(message = "Ngày kết thúc không được để trống")
    LocalDate end_date,

    @NotNull(message = "Tổng hạn mức không được để trống")
    @DecimalMin(
        value = "0.01",
        message = "Tổng hạn mức phải lớn hơn 0"
    )
    BigDecimal total_limit,

    @DecimalMin(value="0.00") BigDecimal expected_income,
    @DecimalMin(value="0.00") BigDecimal planned_saving,

    List<@Valid Allocation> items

) {
    public record Allocation(

        @NotNull(message = "Danh mục không được để trống")
        Long category_id,

        @NotNull(message = "Hạn mức không được để trống")
        @DecimalMin(
            value = "0.01",
            message = "Hạn mức phải lớn hơn 0"
        )
        BigDecimal limit_amount

    ) {}
}
