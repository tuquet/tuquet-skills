# 🎯 tuquet-skills

> Bộ sưu tập các kỹ năng (Skills), runbooks và cấu hình dành cho AI Coding Agents (Google Antigravity, Claude Code, Cursor, Codex).

---

## 📚 Danh mục Skills

| Skill | Mô tả | Trạng thái |
| :--- | :--- | :--- |
| [**`claude-antigravity`**](./skills/claude-antigravity/SKILL.md) | Tích hợp Claude Code CLI với Google Antigravity OAuth (`claude-agy`), tự động bypass root permissions (`IS_SANDBOX=1`), lọc lỗi 429 và quản lý vòng đời proxy. | ✅ Sẵn sàng |

---

## 🚀 Cách cài đặt & Sử dụng Skill trong Antigravity

### 1. Đồng bộ vào Antigravity Global Skills
Để Antigravity tự động kích hoạt các skill trong repo này:

```bash
# Tạo symlink vào thư mục global skills của Antigravity
mkdir -p ~/.gemini/config/skills
ln -sf /root/tuquet-skills/skills/claude-antigravity ~/.gemini/config/skills/claude-antigravity
```

### 2. Cài đặt nhanh `claude-agy` trên máy mới
Chỉ cần chạy 1 lệnh duy nhất từ repository:

```bash
bash skills/claude-antigravity/scripts/setup.sh
```

---

## 🛠️ Đóng góp thêm Skill mới

Cấu trúc chuẩn của một skill:
```text
skills/<skill-name>/
├── SKILL.md          # Hướng dẫn chính kèm YAML frontmatter (name, description)
├── scripts/          # Script tự động hóa hoặc helper
├── references/       # Tài liệu kiến trúc, specs chi tiết
└── examples/         # Ví dụ mẫu
```

---

## 📄 License
MIT © [tuquet](https://github.com/tuquet)
