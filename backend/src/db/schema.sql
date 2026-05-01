-- 员工表（users 表）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,              -- 员工姓名
  employee_no VARCHAR(20) UNIQUE NOT NULL, -- 工号
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',       -- 'staff' | 'manager' | 'admin'
  department VARCHAR(50),                 -- 部门
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 打卡记录表（check_ins 表）
CREATE TABLE check_ins (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  check_date DATE NOT NULL,               -- 打卡日期
  clock_in TIMESTAMPTZ,                   -- 上班时间（UTC存储）
  clock_out TIMESTAMPTZ,                  -- 下班时间（UTC存储）
  break_minutes INT DEFAULT 0,             -- 原始输入分钟数
  break_hours_rounded DECIMAL(4,1) DEFAULT 0, -- 取整后休息（0 或 0.5 倍数）
  status VARCHAR(20) DEFAULT 'normal',    -- 'normal' | 'missing_checkout' | 'modified'
  modified_by INT REFERENCES users(id),      -- 谁改的
  modified_at TIMESTAMPTZ,
  UNIQUE(user_id, check_date)             -- 每人每天只有一条记录
);

-- 审计日志表
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  operator_id INT REFERENCES users(id),
  action VARCHAR(50) NOT NULL,              -- 'clock_in' | 'clock_out' | 'modify' 等
  target_record_id INT REFERENCES check_ins(id),
  old_value JSONB,                         -- 修改前的值
  new_value JSONB,                         -- 修改后的值
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
