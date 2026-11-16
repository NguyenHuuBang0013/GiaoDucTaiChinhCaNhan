package vn.edu.finance.util;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Pure teaching exercise: no transactions, balances or bank transfers are created. */
public final class FinancialPracticeCalculator {
    private FinancialPracticeCalculator() {}
    private static final BigDecimal INCOME = new BigDecimal("6000000");
    private static final BigDecimal SHOCK = new BigDecimal("900000");

    public static Map<String, Object> evaluate(BigDecimal housing, BigDecimal food,
            BigDecimal transport, BigDecimal flexible, BigDecimal reserve, String response) {
        for (BigDecimal n : new BigDecimal[] {housing, food, transport, flexible, reserve}) {
            if (n == null || n.signum() < 0 || n.scale() > 2 || n.precision() > 18)
                throw new IllegalArgumentException("Các khoản phân bổ phải là số không âm hợp lệ");
        }
        if (!java.util.Set.of("RESERVE", "REDUCE_FLEXIBLE", "BORROW").contains(response))
            throw new IllegalArgumentException("Cách xử lý khoản chi đột xuất không hợp lệ");
        BigDecimal allocation = housing.add(food).add(transport).add(flexible).add(reserve);
        BigDecimal surplus = INCOME.subtract(allocation);
        int score = 0;
        if (surplus.signum() >= 0) score += 25;
        if (housing.compareTo(new BigDecimal("2000000")) >= 0
                && food.compareTo(new BigDecimal("1000000")) >= 0
                && transport.compareTo(new BigDecimal("400000")) >= 0) score += 20;
        if (reserve.compareTo(new BigDecimal("600000")) >= 0) score += 20;
        if (response.equals("REDUCE_FLEXIBLE")) score += 20;
        else if (response.equals("RESERVE")) score += 15;
        if (response.equals("RESERVE") && reserve.compareTo(SHOCK) >= 0) score += 15;
        else if (response.equals("REDUCE_FLEXIBLE") && flexible.compareTo(SHOCK) >= 0) score += 15;
        score = Math.min(100, score);
        String feedback = surplus.signum() < 0 ? "Bạn phân bổ vượt thu nhập; cần giảm khoản linh hoạt hoặc điều chỉnh kế hoạch." :
                "Phân bổ không vượt thu nhập. Hãy tiếp tục bảo vệ khoản thiết yếu và quỹ dự phòng.";
        if (response.equals("BORROW")) feedback += " Vay tiền chỉ để tránh điều chỉnh chi tiêu là lựa chọn cần cân nhắc vì phát sinh chi phí trả nợ.";
        else if (response.equals("RESERVE") && reserve.compareTo(SHOCK) < 0) feedback += " Quỹ dự phòng chưa đủ cho sự cố 900.000đ; cần kết hợp giảm chi linh hoạt.";
        else if (response.equals("REDUCE_FLEXIBLE") && flexible.compareTo(SHOCK) < 0) feedback += " Khoản chi linh hoạt có thể cắt giảm chưa đủ bù sự cố; hãy rà soát dự phòng.";
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("income", INCOME);
        result.put("unexpected_cost", SHOCK);
        result.put("allocated", allocation);
        result.put("unallocated", surplus);
        result.put("feedback", feedback);
        result.put("recommended_lesson", "unexpected-cost");
        result.put("simulation_only", true);
        return result;
    }
}
