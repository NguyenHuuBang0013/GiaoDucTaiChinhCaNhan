CREATE DATABASE PersonalFinanceEducation;
GO
USE PersonalFinanceEducation;
GO

-- 1. Nguoi dung dang nhap bang Google OIDC
CREATE TABLE dbo.users (
    user_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    oidc_subject NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(320) NOT NULL,
    display_name NVARCHAR(120) NOT NULL
);
GO

-- 2. Danh muc thu / chi
CREATE TABLE dbo.categories (
    category_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    name NVARCHAR(100) NOT NULL,
    category_type NVARCHAR(10) NOT NULL,
    is_sample_data BIT NOT NULL DEFAULT (0),
    CONSTRAINT CK_categories_category_type CHECK (category_type IN (N'THU', N'CHI')),
    CONSTRAINT UQ_categories_id_owner_type UNIQUE (category_id, user_id, category_type)
);
GO

-- 3. Giao dich thu / chi
CREATE TABLE dbo.transactions (
    transaction_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    category_id BIGINT NULL,
    type NVARCHAR(10) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    note NVARCHAR(1000) NULL,
    is_sample_data BIT NOT NULL DEFAULT (0),
    CONSTRAINT FK_transactions_category_owner_type
        FOREIGN KEY (category_id, user_id, type)
        REFERENCES dbo.categories(category_id, user_id, category_type),
    CONSTRAINT CK_transactions_type CHECK (type IN (N'THU', N'CHI')),
    CONSTRAINT CK_transactions_amount CHECK (amount > 0),
    CONSTRAINT CK_transactions_expense_category CHECK (type <> N'CHI' OR category_id IS NOT NULL)
);
GO

-- 4. Ngan sach
CREATE TABLE dbo.budgets (
    budget_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    name NVARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_limit DECIMAL(18, 2) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    is_sample_data BIT NOT NULL DEFAULT (0),
    CONSTRAINT CK_budgets_date_range CHECK (start_date <= end_date),
    CONSTRAINT CK_budgets_total_limit CHECK (total_limit > 0),
    CONSTRAINT CK_budgets_status CHECK (status IN (N'Draft', N'Active', N'Exceeded', N'Closed'))
);
GO

-- 5. Phan bo ngan sach theo danh muc
CREATE TABLE dbo.budget_items (
    budget_item_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    budget_id BIGINT NOT NULL REFERENCES dbo.budgets(budget_id),
    category_id BIGINT NOT NULL REFERENCES dbo.categories(category_id),
    limit_amount DECIMAL(18, 2) NOT NULL,
    CONSTRAINT CK_budget_items_limit_amount CHECK (limit_amount > 0)
);
GO

-- 6. Muc tieu tai chinh
CREATE TABLE dbo.financial_goals (
    goal_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    name NVARCHAR(150) NOT NULL,
    target_amount DECIMAL(18, 2) NOT NULL,
    deadline DATE NOT NULL,
    status NVARCHAR(20) NOT NULL,
    is_sample_data BIT NOT NULL DEFAULT (0),
    CONSTRAINT CK_financial_goals_target_amount CHECK (target_amount > 0),
    CONSTRAINT CK_financial_goals_status CHECK (status IN (N'Planned', N'InProgress', N'Achieved', N'Overdue'))
);
GO

-- 7. Cac khoan dong gop cho muc tieu
CREATE TABLE dbo.goal_contributions (
    contribution_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    goal_id BIGINT NOT NULL REFERENCES dbo.financial_goals(goal_id),
    amount DECIMAL(18, 2) NOT NULL,
    contribution_date DATE NOT NULL,
    note NVARCHAR(1000) NULL,
    CONSTRAINT CK_goal_contributions_amount CHECK (amount > 0)
);
GO

-- 8. Kich ban mo phong tiet kiem
CREATE TABLE dbo.saving_scenarios (
    scenario_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    name NVARCHAR(150) NOT NULL,
    income_per_period DECIMAL(18, 2) NOT NULL,
    expense_per_period DECIMAL(18, 2) NOT NULL,
    period_unit NVARCHAR(20) NOT NULL,
    duration INT NOT NULL,
    initial_saving DECIMAL(18, 2) NOT NULL,
    is_sample_data BIT NOT NULL DEFAULT (0),
    CONSTRAINT CK_saving_scenarios_income CHECK (income_per_period >= 0),
    CONSTRAINT CK_saving_scenarios_expense CHECK (expense_per_period >= 0),
    CONSTRAINT CK_saving_scenarios_initial_saving CHECK (initial_saving >= 0),
    CONSTRAINT CK_saving_scenarios_duration CHECK (duration > 0),
    CONSTRAINT CK_saving_scenarios_period CHECK (period_unit IN (N'DAILY', N'WEEKLY', N'MONTHLY', N'YEARLY'))
);
GO

-- 9. Bai hoc giao duc tai chinh
CREATE TABLE dbo.learning_lessons (
    lesson_id INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    slug NVARCHAR(100) NOT NULL UNIQUE,
    title NVARCHAR(200) NOT NULL,
    summary NVARCHAR(1000) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    question NVARCHAR(500) NOT NULL,
    choice_a NVARCHAR(300) NOT NULL,
    choice_b NVARCHAR(300) NOT NULL,
    choice_c NVARCHAR(300) NOT NULL,
    answer CHAR(1) NOT NULL,
    explanation NVARCHAR(1000) NOT NULL,
    sort_order INT NOT NULL DEFAULT (0),
    CONSTRAINT CK_learning_lessons_answer CHECK (answer IN ('A', 'B', 'C'))
);
GO

-- 10. Ket qua lam cau hoi cua nguoi hoc
CREATE TABLE dbo.learning_attempts (
    attempt_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    lesson_id INT NOT NULL REFERENCES dbo.learning_lessons(lesson_id),
    selected_answer CHAR(1) NOT NULL,
    is_correct BIT NOT NULL,
    attempted_at DATETIME2 NOT NULL DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_learning_attempts_answer CHECK (selected_answer IN ('A', 'B', 'C'))
);
GO

-- 11. Giao dich thu / chi lap lai hang tuan hoac hang thang
CREATE TABLE dbo.recurring_transactions (
    recurring_id BIGINT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
    category_id BIGINT NULL,
    type NVARCHAR(10) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    note NVARCHAR(1000) NULL,
    next_date DATE NOT NULL,
    frequency NVARCHAR(10) NOT NULL,
    active BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_recurring_category_owner_type
        FOREIGN KEY (category_id, user_id, type)
        REFERENCES dbo.categories(category_id, user_id, category_type),
    CONSTRAINT CK_recurring_type CHECK (type IN (N'THU', N'CHI')),
    CONSTRAINT CK_recurring_amount CHECK (amount > 0),
    CONSTRAINT CK_recurring_frequency CHECK (frequency IN (N'WEEKLY', N'MONTHLY')),
    CONSTRAINT CK_recurring_expense_cat CHECK (type <> N'CHI' OR category_id IS NOT NULL)
);
GO

-- 12. Lich su da ghi giao dich dinh ky (tranh ghi trung cung ky)
CREATE TABLE dbo.recurring_postings (
    recurring_id BIGINT NOT NULL REFERENCES dbo.recurring_transactions(recurring_id),
    occurrence_date DATE NOT NULL,
    transaction_id BIGINT NOT NULL REFERENCES dbo.transactions(transaction_id),
    CONSTRAINT PK_recurring_postings PRIMARY KEY (recurring_id, occurrence_date)
);
GO

-- 13. Index phuc vu truy van, bao cao va tinh toan
CREATE INDEX IX_categories_user_id ON dbo.categories(user_id);
CREATE INDEX IX_transactions_user_date ON dbo.transactions(user_id, transaction_date);
CREATE INDEX IX_transactions_category_id ON dbo.transactions(category_id);
CREATE INDEX IX_budgets_user_dates ON dbo.budgets(user_id, start_date, end_date);
CREATE INDEX IX_budget_items_budget_id ON dbo.budget_items(budget_id);
CREATE INDEX IX_budget_items_category_id ON dbo.budget_items(category_id);
CREATE INDEX IX_financial_goals_user_id ON dbo.financial_goals(user_id);
CREATE INDEX IX_goal_contributions_goal_date ON dbo.goal_contributions(goal_id, contribution_date);
CREATE INDEX IX_saving_scenarios_user_id ON dbo.saving_scenarios(user_id);
CREATE UNIQUE INDEX UQ_budget_items_budget_category ON dbo.budget_items(budget_id, category_id);
CREATE INDEX IX_attempts_user_lesson ON dbo.learning_attempts(user_id, lesson_id, attempted_at DESC);
CREATE INDEX IX_recurring_user ON dbo.recurring_transactions(user_id, next_date);
GO

-- 14. Du lieu mau: bon bai hoc giao duc tai chinh
-- Du lieu bai hoc dung chung cho moi tai khoan, khong tao tai khoan Google gia.
INSERT INTO dbo.learning_lessons
(slug, title, summary, content, question, choice_a, choice_b, choice_c, answer, explanation, sort_order)
VALUES
(N'budget-basics', N'Lập ngân sách cá nhân', N'Phân bổ thu nhập và theo dõi chi tiêu',
 N'Ngân sách là kế hoạch sử dụng tiền trong một kỳ. Hãy ghi thu nhập, chia hạn mức cho những nhóm chi thiết yếu và theo dõi khoản đã chi. Khi chi vượt mức dự kiến, xem lại ngân sách hoặc điều chỉnh hành vi. Ngân sách không phải là số dư tài khoản ngân hàng.',
 N'Khi một danh mục gần hết hạn mức, nên làm gì?',
 N'Bỏ ghi chép giao dịch', N'Xem lại kế hoạch và các khoản chi còn lại', N'Tự tăng thu nhập trên báo cáo', 'B',
 N'Rà soát ngân sách giúp đưa ra quyết định có căn cứ thay vì bỏ qua thực tế.', 1),
(N'needs-wants', N'Nhu cầu và mong muốn', N'Ưu tiên những khoản chi cần thiết',
 N'Nhu cầu là các chi phí cơ bản như ăn uống, chỗ ở, đi lại thiết yếu. Mong muốn là những khoản có thể trì hoãn hoặc giảm. Cách phân loại phụ thuộc hoàn cảnh mỗi người. Hãy đánh giá trước khi mua sắm, tránh áp dụng tỷ lệ máy móc.',
 N'Ví dụ nào thường là nhu cầu thiết yếu?',
 N'Tiền thuê nhà', N'Mua phụ kiện mới không cần thiết', N'Đổi điện thoại để theo xu hướng', 'A',
 N'Chỗ ở thường là khoản cần ưu tiên để bảo đảm sinh hoạt.', 2),
(N'emergency-fund', N'Quỹ dự phòng', N'Chuẩn bị cho chi phí bất ngờ',
 N'Quỹ dự phòng là khoản tiết kiệm dành cho tình huống như mất việc hoặc sửa chữa cần thiết. Mức dự phòng tùy khả năng và hoàn cảnh, không phải khoản đầu tư bảo đảm sinh lời.',
 N'Mục tiêu chính của quỹ dự phòng là gì?',
 N'Mua sắm tùy hứng', N'Đầu cơ rủi ro cao', N'Ứng phó chi phí bất ngờ', 'C',
 N'Quỹ dự phòng giúp giảm áp lực tài chính khi có sự kiện không lường trước.', 3),
(N'saving-simulation', N'Mô phỏng tiết kiệm', N'Hiểu tác động của thu nhập, chi phí và thời gian',
 N'Mô phỏng tuyến tính dùng số dư ban đầu cộng với chênh lệch thu - chi mỗi kỳ nhân số kỳ. Kết quả chỉ là giả định, chưa bao gồm lạm phát, lãi suất hay biến động thu nhập. Có thể thử nhiều kịch bản và xem kết quả âm như tín hiệu cần điều chỉnh.',
 N'Giữ nguyên thu nhập, nếu chi phí mỗi kỳ tăng thì điều gì xảy ra?',
 N'Tiết kiệm dự kiến giảm', N'Tiết kiệm luôn tăng', N'Không ảnh hưởng', 'A',
 N'Tiết kiệm mỗi kỳ bằng thu nhập trừ chi phí.', 4);
GO

-- 15. Kiem tra ket qua: phai co 12 bang va 4 bai hoc
SELECT COUNT(*) AS TotalTables FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo');
SELECT name AS TableName FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo') ORDER BY name;
SELECT COUNT(*) AS TotalLessons FROM dbo.learning_lessons;
GO

-- FINANCELAB_VNEXT_BEGIN
-- Idempotent extension: safe for existing data; do not reset users or transactions.
IF OBJECT_ID(N'dbo.budget_plans',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.budget_plans (budget_id BIGINT NOT NULL PRIMARY KEY REFERENCES dbo.budgets(budget_id), expected_income DECIMAL(18,2) NOT NULL, planned_saving DECIMAL(18,2) NOT NULL, CONSTRAINT CK_plan_income CHECK(expected_income>=0), CONSTRAINT CK_plan_saving CHECK(planned_saving>=0));
END;
GO
IF OBJECT_ID(N'dbo.learning_questions',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.learning_questions (question_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, lesson_id INT NOT NULL REFERENCES dbo.learning_lessons(lesson_id), question_key NVARCHAR(120) NOT NULL UNIQUE, question_text NVARCHAR(500) NOT NULL, choice_a NVARCHAR(300) NOT NULL, choice_b NVARCHAR(300) NOT NULL, choice_c NVARCHAR(300) NOT NULL, answer CHAR(1) NOT NULL CHECK(answer IN ('A','B','C')), explanation NVARCHAR(1000) NOT NULL);
END;
GO
IF OBJECT_ID(N'dbo.learning_question_attempts',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.learning_question_attempts (attempt_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES dbo.users(user_id), question_id BIGINT NOT NULL REFERENCES dbo.learning_questions(question_id), selected_answer CHAR(1) NOT NULL CHECK(selected_answer IN ('A','B','C')), is_correct BIT NOT NULL, attempted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_learning_question_attempts_user_question' AND object_id=OBJECT_ID(N'dbo.learning_question_attempts'))
 CREATE INDEX IX_learning_question_attempts_user_question ON dbo.learning_question_attempts(user_id,question_id,attempted_at DESC);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'income-expenses')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'income-expenses',N'Hiểu dòng tiền cá nhân',N'Phân biệt thu nhập với chi tiêu',N'Dòng tiền phản ánh tiền vào và ra trong một kỳ. Thu nhập không phải số tiền có thể tiêu hết: cần lập kế hoạch cho chi thiết yếu, chi linh hoạt và khoản dự phòng.',N'Đâu là khoản thu nhập?',N'Tiền điện',N'Tiền lương làm thêm',N'Tiền thuê nhà','B',N'Tiền lương là dòng tiền vào.',5);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'budget-methods')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'budget-methods',N'Phân bổ ngân sách linh hoạt',N'50/30/20 là gợi ý, không phải mệnh lệnh',N'Phương pháp 50/30/20 gợi ý 50% cho nhu cầu, 30% cho mong muốn và 20% tiết kiệm/trả nợ. Tỷ lệ thực tế thay đổi tùy thu nhập, gia cảnh và chi phí sinh hoạt. Ưu tiên bảo đảm nhu cầu cơ bản và khoản dự phòng phù hợp.',N'Nếu tiền thuê nhà chiếm 60% thu nhập, nên làm gì?',N'Bỏ ghi tiền thuê nhà',N'Điều chỉnh tỷ lệ theo thực tế và tìm cách giảm chi phù hợp',N'Vẫn ép theo 50% bằng cách nhập số giả','B',N'Không nên áp dụng một công thức cứng nhắc.',6);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'fixed-variable')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'fixed-variable',N'Chi phí cố định và linh hoạt',N'Hiểu khoản chi có thể điều chỉnh',N'Chi phí cố định lặp lại và khó thay đổi ngắn hạn như tiền thuê nhà. Chi linh hoạt thay đổi theo lựa chọn như ăn ngoài và giải trí. Đánh giá trước khi cắt giảm để không ảnh hưởng sức khỏe và học tập.',N'Khoản nào thường dễ điều chỉnh ngắn hạn hơn?',N'Tiền ăn ngoài tự chọn',N'Tiền thuê nhà theo hợp đồng',N'Học phí đã đến hạn','A',N'Chi tiêu tùy chọn thường có khả năng điều chỉnh hơn.',7);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'unexpected-cost')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'unexpected-cost',N'Ứng phó khoản chi bất ngờ',N'Bài tập ra quyết định khi phát sinh sự cố',N'Nếu xe hỏng hoặc cần khám bệnh, hãy ưu tiên nhu cầu an toàn. Xem khoản dự phòng, các chi có thể trì hoãn và ảnh hưởng đến hạn mức. Không vay nóng chỉ để tránh thay đổi kế hoạch.',N'Khi phát sinh khoản sửa xe cần thiết nên?',N'Bỏ qua vì không có trong kế hoạch',N'Xem quỹ dự phòng và điều chỉnh các khoản chi linh hoạt',N'Che khoản chi khỏi sổ','B',N'Thực tế thay đổi, kế hoạch cần được cập nhật minh bạch.',8);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'end-of-month')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'end-of-month',N'Tổng kết ngân sách cuối kỳ',N'Rút kinh nghiệm từ kế hoạch và thực tế',N'Cuối kỳ, so sánh thu dự kiến với thu thực tế, chi theo danh mục và khoản dành cho mục tiêu. Ghi nhận nguyên nhân chênh lệch, không chỉ đánh giá thành công bằng con số tiết kiệm.',N'Bước nào giúp cải thiện ngân sách kỳ tới?',N'Xóa giao dịch vượt mức',N'So sánh dự kiến và thực tế rồi điều chỉnh',N'Đặt cùng hạn mức bất kể hoàn cảnh','B',N'Đối chiếu dữ liệu là nền tảng cải thiện.',9);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'debt-basics')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'debt-basics',N'Nợ và chi phí vay cơ bản',N'Hiểu lãi suất và nghĩa vụ trả nợ',N'Khi vay tiêu dùng, cần biết số tiền gốc, lãi suất, phí, lịch trả và tổng tiền phải trả. Tránh vay chỉ vì khoản góp hàng tháng có vẻ nhỏ. Không giả định mọi khoản vay đều xấu hoặc đều phù hợp.',N'Khi cân nhắc khoản vay cần xem gì?',N'Chỉ quà tặng',N'Tổng chi phí vay và khả năng trả',N'Chỉ số tiền trả tháng đầu','B',N'Tổng chi phí và khả năng trả quan trọng hơn quảng cáo.',10);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'fraud-prevention')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'fraud-prevention',N'An toàn tài chính số',N'Nhận biết hành vi lừa đảo',N'Không chia sẻ OTP, mật khẩu hay mã khôi phục. Kiểm tra tên miền và bên nhận trước khi chuyển tiền. Lời hứa lợi nhuận cao chắc chắn là dấu hiệu cần thận trọng.',N'Khi có người lạ xin mã OTP bạn nên?',N'Gửi ngay để xác minh',N'Đưa cho bạn bè gửi giúp',N'Không cung cấp và kiểm tra kênh chính thức','C',N'OTP là yếu tố bảo mật riêng tư.',11);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_lessons WHERE slug=N'practice-challenge')
 INSERT INTO dbo.learning_lessons(slug,title,summary,content,question,choice_a,choice_b,choice_c,answer,explanation,sort_order)
 VALUES(N'practice-challenge',N'Thực hành cân đối ngân sách',N'Kết nối bài học với kế hoạch thực tế',N'Bạn có thu nhập 6 triệu, muốn dành 600 nghìn dự phòng. Hãy xây dựng các hạn mức chi tổng cộng không vượt quá 5,4 triệu. Nếu thực tế chi vượt, xem lại danh mục có thể điều chỉnh. Đây là tình huống giả định, không thay cho dữ liệu tài chính thật.',N'Với thu nhập 6 triệu và dự phòng 600 nghìn, tổng hạn mức chi tối đa là?',N'5,4 triệu',N'6,6 triệu',N'6 triệu','A',N'6 triệu trừ 600 nghìn bằng 5,4 triệu.',12);
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Một ngân sách phù hợp cần làm gì?',N'Không bao giờ điều chỉnh',N'Có thể điều chỉnh khi hoàn cảnh thay đổi',N'Cố gắng chi hết hạn mức','B',N'Ngân sách là kế hoạch linh hoạt.' FROM dbo.learning_lessons l WHERE l.slug=N'budget-basics' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Nhu cầu và mong muốn được phân loại thế nào?',N'Tùy hoàn cảnh và ưu tiên',N'Luôn giống nhau với mọi người',N'Chỉ dựa trên giá tiền','A',N'Phân loại phụ thuộc hoàn cảnh.' FROM dbo.learning_lessons l WHERE l.slug=N'needs-wants' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Khoản dự phòng nên dùng khi nào?',N'Để mua sắm theo xu hướng',N'Để tăng chi giải trí',N'Cho chi phí khẩn cấp hợp lý','C',N'Dự phòng giúp xử lý biến cố.' FROM dbo.learning_lessons l WHERE l.slug=N'emergency-fund' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Mô phỏng có dự báo chính xác tương lai không?',N'Luôn chính xác',N'Chỉ là kịch bản theo giả định',N'Luôn cho kết quả dương','B',N'Mô phỏng không bảo đảm diễn biến tương lai.' FROM dbo.learning_lessons l WHERE l.slug=N'saving-simulation' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Thu nhập 7 triệu, chi 6 triệu: dòng tiền thuần là?',N'1 triệu',N'13 triệu',N'6 triệu','A',N'7 triệu trừ 6 triệu bằng 1 triệu.' FROM dbo.learning_lessons l WHERE l.slug=N'income-expenses' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Phương pháp 50/30/20 là gì?',N'Quy định pháp luật',N'Khuyến nghị để tham khảo',N'Yêu cầu cho mọi ngân sách','B',N'Có thể tùy biến theo tình hình.' FROM dbo.learning_lessons l WHERE l.slug=N'budget-methods' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Chi phí nào là chi cố định tương đối?',N'Vé xem phim',N'Mua sắm giải trí',N'Tiền thuê nhà theo hợp đồng','C',N'Tiền thuê nhà theo hợp đồng thường ít linh hoạt hơn.' FROM dbo.learning_lessons l WHERE l.slug=N'fixed-variable' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Khi có chi phí bất ngờ, việc nào nên tránh?',N'Ghi nhận chi phí',N'Giấu khoản chi khỏi báo cáo',N'Rà soát kế hoạch','B',N'Dữ liệu cần minh bạch.' FROM dbo.learning_lessons l WHERE l.slug=N'unexpected-cost' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Cuối kỳ phát hiện chi vượt do học phí, nên làm gì?',N'Tìm nguyên nhân và điều chỉnh kế hoạch',N'Xóa giao dịch',N'Dừng theo dõi ngân sách','A',N'Tìm nguyên nhân trước khi thay đổi kế hoạch.' FROM dbo.learning_lessons l WHERE l.slug=N'end-of-month' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Cần kiểm tra gì trước khi vay?',N'Chỉ ưu đãi quảng cáo',N'Không cần lịch trả',N'Khả năng trả và tổng chi phí','C',N'Vay phải cân nhắc khả năng trả.' FROM dbo.learning_lessons l WHERE l.slug=N'debt-basics' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Ngân hàng có yêu cầu đọc OTP qua điện thoại không?',N'Luôn có',N'Không cung cấp OTP cho người gọi',N'Gửi mã cho bất kỳ ai tự xưng ngân hàng','B',N'OTP không chia sẻ.' FROM dbo.learning_lessons l WHERE l.slug=N'fraud-prevention' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-review'),N'Thu nhập 6 triệu, dự phòng 1 triệu: hạn mức chi tối đa?',N'5 triệu',N'7 triệu',N'6 triệu','A',N'6 triệu trừ 1 triệu bằng 5 triệu.' FROM dbo.learning_lessons l WHERE l.slug=N'practice-challenge' AND NOT EXISTS(SELECT 1 FROM dbo.learning_questions WHERE question_key=CONCAT(l.slug,N'-review'));
GO
INSERT INTO dbo.learning_questions(lesson_id,question_key,question_text,choice_a,choice_b,choice_c,answer,explanation)
SELECT l.lesson_id,CONCAT(l.slug,N'-core'),l.question,l.choice_a,l.choice_b,l.choice_c,l.answer,l.explanation FROM dbo.learning_lessons l WHERE NOT EXISTS(SELECT 1 FROM dbo.learning_questions q WHERE q.question_key=CONCAT(l.slug,N'-core'));
GO
-- Preserve the achievements from the original four one-question lessons.
-- Idempotent: each previously correct legacy lesson counts as its core question once.
INSERT INTO dbo.learning_question_attempts(user_id,question_id,selected_answer,is_correct,attempted_at)
SELECT a.user_id,q.question_id,MAX(a.selected_answer),CAST(1 AS BIT),MAX(a.attempted_at)
FROM dbo.learning_attempts a
JOIN dbo.learning_lessons l ON l.lesson_id=a.lesson_id
JOIN dbo.learning_questions q ON q.question_key=CONCAT(l.slug,N'-core')
WHERE a.is_correct=1
 AND NOT EXISTS(SELECT 1 FROM dbo.learning_question_attempts qa WHERE qa.user_id=a.user_id AND qa.question_id=q.question_id AND qa.is_correct=1)
GROUP BY a.user_id,q.question_id;
GO
-- Completion check after upgrade: expected 15 tables / 12 lessons / 24 questions.
SELECT COUNT(*) AS TotalTables FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo');
SELECT COUNT(*) AS TotalLessons FROM dbo.learning_lessons;
SELECT COUNT(*) AS TotalQuestions FROM dbo.learning_questions;
GO
-- FINANCELAB_VNEXT_END


-- FINANCELAB_EDUCATION_COMPLETE_BEGIN
-- Repeatable additive extension. Never drop data or recreate dbo.users.
IF COL_LENGTH(N'dbo.categories',N'spending_group') IS NULL
 ALTER TABLE dbo.categories ADD spending_group NVARCHAR(12) NULL;
GO
IF COL_LENGTH(N'dbo.categories',N'cost_nature') IS NULL
 ALTER TABLE dbo.categories ADD cost_nature NVARCHAR(12) NULL;
GO
UPDATE dbo.categories SET spending_group=N'NEED' WHERE category_type=N'CHI' AND spending_group IS NULL
  AND (name LIKE N'%thuê%' OR name LIKE N'%nhà%' OR name LIKE N'%học%' OR name LIKE N'%đi lại%' OR name LIKE N'%ăn uống%');
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_category_spending_group')
 ALTER TABLE dbo.categories ADD CONSTRAINT CK_category_spending_group CHECK(spending_group IS NULL OR spending_group IN (N'NEED',N'WANT'));
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name=N'CK_category_cost_nature')
 ALTER TABLE dbo.categories ADD CONSTRAINT CK_category_cost_nature CHECK(cost_nature IS NULL OR cost_nature IN (N'FIXED',N'VARIABLE'));
GO
IF OBJECT_ID(N'dbo.learning_profiles',N'U') IS NULL
 CREATE TABLE dbo.learning_profiles(
  user_id BIGINT NOT NULL PRIMARY KEY REFERENCES dbo.users(user_id),
  learning_goal NVARCHAR(40) NOT NULL DEFAULT N'BUDGET',
  skill_level NVARCHAR(20) NOT NULL DEFAULT N'BEGINNER',
  monthly_income DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK(monthly_income>=0),
  primary_priority NVARCHAR(40) NOT NULL DEFAULT N'CONTROL_SPENDING',
  onboarding_completed BIT NOT NULL DEFAULT 0,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF OBJECT_ID(N'dbo.learning_topics',N'U') IS NULL
 CREATE TABLE dbo.learning_topics(
  topic_key NVARCHAR(40) NOT NULL PRIMARY KEY,
  title NVARCHAR(150) NOT NULL,
  summary NVARCHAR(600) NOT NULL,
  sort_order INT NOT NULL);
GO
IF COL_LENGTH(N'dbo.learning_lessons',N'topic_key') IS NULL
 ALTER TABLE dbo.learning_lessons ADD topic_key NVARCHAR(40) NULL;
GO
IF NOT EXISTS(SELECT 1 FROM dbo.learning_topics WHERE topic_key=N'BUDGET')
 INSERT INTO dbo.learning_topics VALUES(N'BUDGET',N'Nền tảng ngân sách',N'Thu nhập, khoản chi và nguyên tắc lập kế hoạch',1);
IF NOT EXISTS(SELECT 1 FROM dbo.learning_topics WHERE topic_key=N'SAVING')
 INSERT INTO dbo.learning_topics VALUES(N'SAVING',N'Tiết kiệm và điều chỉnh',N'Dự phòng, thay đổi và đánh giá kỳ',2);
IF NOT EXISTS(SELECT 1 FROM dbo.learning_topics WHERE topic_key=N'SAFETY')
 INSERT INTO dbo.learning_topics VALUES(N'SAFETY',N'Ra quyết định an toàn',N'Nợ, an toàn và cân đối trong tình huống thật',3);
GO
UPDATE dbo.learning_lessons SET topic_key=CASE
 WHEN slug IN (N'budget-basics',N'needs-wants',N'income-expenses',N'budget-methods') THEN N'BUDGET'
 WHEN slug IN (N'emergency-fund',N'saving-simulation',N'fixed-variable',N'unexpected-cost',N'end-of-month') THEN N'SAVING'
 ELSE N'SAFETY' END
WHERE topic_key IS NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_learning_lessons_topic')
 ALTER TABLE dbo.learning_lessons ADD CONSTRAINT FK_learning_lessons_topic FOREIGN KEY(topic_key) REFERENCES dbo.learning_topics(topic_key);
GO
IF OBJECT_ID(N'dbo.learning_assessments',N'U') IS NULL
 CREATE TABLE dbo.learning_assessments(
  assessment_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
  phase NVARCHAR(10) NOT NULL CHECK(phase IN (N'PRE',N'POST')),
  correct_answers INT NOT NULL CHECK(correct_answers>=0),
  total_questions INT NOT NULL CHECK(total_questions>0),
  answers_json NVARCHAR(MAX) NOT NULL,
  taken_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_assessments_user_phase' AND object_id=OBJECT_ID(N'dbo.learning_assessments'))
 CREATE INDEX IX_assessments_user_phase ON dbo.learning_assessments(user_id,phase,taken_at DESC);
GO
IF OBJECT_ID(N'dbo.budget_reviews',N'U') IS NULL
 CREATE TABLE dbo.budget_reviews(
  review_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  budget_id BIGINT NOT NULL UNIQUE REFERENCES dbo.budgets(budget_id),
  user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
  reason NVARCHAR(1000) NOT NULL,
  improvement_action NVARCHAR(1000) NOT NULL,
  income_actual DECIMAL(18,2) NOT NULL,
  expense_actual DECIMAL(18,2) NOT NULL,
  status NVARCHAR(10) NOT NULL CHECK(status IN (N'DRAFT',N'FINAL')),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF OBJECT_ID(N'dbo.practice_attempts',N'U') IS NULL
 CREATE TABLE dbo.practice_attempts(
  attempt_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
  scenario_key NVARCHAR(60) NOT NULL,
  choices_json NVARCHAR(MAX) NOT NULL,
  result_json NVARCHAR(MAX) NOT NULL,
  score INT NOT NULL CHECK(score BETWEEN 0 AND 100),
  attempted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF OBJECT_ID(N'dbo.budget_change_history',N'U') IS NULL
 CREATE TABLE dbo.budget_change_history(
  change_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  budget_id BIGINT NOT NULL REFERENCES dbo.budgets(budget_id),
  user_id BIGINT NOT NULL REFERENCES dbo.users(user_id),
  old_limit DECIMAL(18,2) NOT NULL,
  new_limit DECIMAL(18,2) NOT NULL,
  reason NVARCHAR(500) NOT NULL,
  changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_budget_history_user' AND object_id=OBJECT_ID(N'dbo.budget_change_history'))
 CREATE INDEX IX_budget_history_user ON dbo.budget_change_history(user_id,budget_id,changed_at DESC);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_practice_user' AND object_id=OBJECT_ID(N'dbo.practice_attempts'))
 CREATE INDEX IX_practice_user ON dbo.practice_attempts(user_id,attempted_at DESC);
GO
-- FINANCELAB_EDUCATION_COMPLETE_END
